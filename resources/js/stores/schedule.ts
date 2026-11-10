import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { api, ApiError } from '../api';
import type { Employee, Shift, ShiftFromApi, ShiftTemplate } from '../types';
import { addDays, addMonths, daysBetween, endOfMonth, monthLabel, startOfMonth, startOfWeek, today, weekLabel } from '../utils/dates';
import { hoursBetween } from '../utils/time';

/**
 * ЗА ЧТО ОТВЕЧАЕТ ЭТОТ ФАЙЛ?
 *
 * Хранилище страницы «График» (Pinia).
 *
 * Путь данных при открытии страницы:
 * App.vue (onMounted) → store.init() → api.employees() / api.templates() / api.shifts(from, to)
 * → Laravel отдаёт JSON → кладём в employees / templates / shifts
 * → ScheduleGrid.vue и TemplatesPanel.vue читают store.* и рисуют таблицу.
 *
 * Здесь лежат ВСЕ данные страницы: сотрудники, шаблоны, смены выбранного периода.
 * Компоненты (таблица, строка покрытия, панель шаблонов) читают данные отсюда,
 * поэтому любое изменение смен сразу видно во всех местах без перезагрузки страницы.
 *
 * ref()      — реактивное значение: когда оно меняется, Vue перерисовывает то, что его использует.
 * computed() — значение, вычисляемое из других; пересчитывается автоматически.
 */
export const useScheduleStore = defineStore('schedule', () => {
    // ---------- Состояние ----------
    const employees = ref<Employee[]>([]);
    const templates = ref<ShiftTemplate[]>([]);
    const shifts = ref<Shift[]>([]); // смены текущего периода (черновик, пока не нажали «Сохранить»)

    // Режим отображения: 'week' — 7 колонок, 'month' — все дни месяца (переключатель «Месяц / Неделя»)
    const view = ref<'week' | 'month'>('week');

    // Первый день видимого периода: понедельник в режиме недели, 1-е число в режиме месяца
    const periodStart = ref<string>(startOfWeek(today()));

    // Текст из поля «Поиск по ФИО». v-model в ScheduleToolbar.vue записывает сюда каждую нажатую букву.
    const search = ref('');
    // Выделенные ячейки. Каждая ячейка — строка-ключ "id сотрудника|дата", например "1|2026-11-10".
    // Set — набор без повторов: одну ячейку нельзя выделить дважды.
    const selectedCells = ref(new Set<string>());

    const loading = ref(false);
    const error = ref<string | null>(null);

    // ---------- Сохранение (этап 2.6) ----------
    // savedSnapshot — «снимок» смен в том виде, в каком они лежат в базе (после загрузки или сохранения).
    // Если текущие смены отличаются от снимка — есть несохранённые изменения.
    const savedSnapshot = ref('[]');
    // Опубликован ли видимый период: все его смены имеют is_published = true
    const isPublished = ref(false);
    const saving = ref(false);
    // Короткое сообщение внизу экрана: «Сохранено», «Опубликовано: 8 смен», текст ошибки
    const notice = ref<{ type: 'success' | 'error'; text: string } | null>(null);

    // ---------- Вычисляемые значения ----------
    // Последний день периода.
    // Неделя: 2026-11-09 + 6 дней = 2026-11-15. Месяц: 2026-11-01 → 2026-11-30.
    const periodEnd = computed(() =>
        view.value === 'week' ? addDays(periodStart.value, 6) : endOfMonth(periodStart.value),
    );

    // Колонки таблицы: 7 дней недели или 28–31 день месяца
    const days = computed(() => daysBetween(periodStart.value, periodEnd.value));

    // Подпись между стрелками: «9 – 15 ноября 2026» или «Ноябрь 2026»
    const periodLabel = computed(() =>
        view.value === 'week' ? weekLabel(periodStart.value, periodEnd.value) : monthLabel(periodStart.value),
    );

    // Сотрудники, которые подходят под поиск. Таблица рисует именно этот список, а не все employees.
    //
    // Пример: search = "вол" → query = "вол"
    //   "Кузнецова Алина".toLowerCase() содержит "вол"? нет → скрыть
    //   "Волков Тимур".toLowerCase() = "волков тимур" содержит "вол"? да → показать
    // replace(/ё/g, 'е') — чтобы «Артем» находил «Соколов Артём».
    //
    // Поиск идёт в браузере по уже загруженному списку: сотрудников мало, запрос к серверу не нужен,
    // и смены скрытых сотрудников не теряются — они остаются в shifts и в покрытии.
    const visibleEmployees = computed(() => {
        const query = normalize(search.value.trim());
        if (query === '') {
            return employees.value;
        }
        return employees.value.filter((employee) => normalize(employee.full_name).includes(query));
    });

    // Быстрый поиск смены по ячейке: ключ "id сотрудника|дата" -> смена.
    // Map вместо перебора массива для каждой из 56+ ячеек.
    const shiftByCell = computed(() => {
        const map = new Map<string, Shift>();
        for (const shift of shifts.value) {
            map.set(cellKey(shift.employee_id, shift.date), shift);
        }
        return map;
    });

    // Покрытие: сколько смен назначено на каждую дату (нижняя строка таблицы «Покрытие»).
    //
    // Пример: shifts =
    //   { employee_id: 1, date: "2026-11-10", ... }
    //   { employee_id: 2, date: "2026-11-10", ... }
    //   { employee_id: 1, date: "2026-11-11", ... }
    // Проходим по сменам и прибавляем 1 к счётчику их даты:
    //   coverageByDate = { "2026-11-10": 2, "2026-11-11": 1 }
    // Даты без смен в объекте нет → таблица показывает 0 (розовым).
    //
    // computed: когда в shifts добавится или удалится смена, Vue сам пересчитает этот объект
    // и перерисует строку покрытия. Отдельного кода «обнови покрытие» нет.
    const coverageByDate = computed(() => {
        const counts: Record<string, number> = {};
        for (const shift of shifts.value) {
            counts[shift.date] = (counts[shift.date] ?? 0) + 1;
        }
        return counts;
    });

    // Часы сотрудника за период — «агент · 16 ч» под именем.
    // Пример: у сотрудника 1 две смены 10:00–18:00 → hoursByEmployee = { 1: 16 }
    const hoursByEmployee = computed(() => {
        const hours: Record<number, number> = {};
        for (const shift of shifts.value) {
            hours[shift.employee_id] = (hours[shift.employee_id] ?? 0) + hoursBetween(shift.start_time, shift.end_time);
        }
        return hours;
    });

    // Сколько раз шаблон использован в периоде — цифра в углу карточки шаблона
    const templateUsage = computed(() => {
        const usage: Record<number, number> = {};
        for (const shift of shifts.value) {
            if (shift.shift_template_id !== null) {
                usage[shift.shift_template_id] = (usage[shift.shift_template_id] ?? 0) + 1;
            }
        }
        return usage;
    });

    // Данные для тёмной панели «Выделено: 4 ячейки · 2 сотрудника(-ов) · 2 дн.»
    // Пример: выделены "1|2026-11-10", "1|2026-11-11", "2|2026-11-10", "2|2026-11-11"
    //   → ячеек 4, разных сотрудников {1, 2} = 2, разных дней {10, 11} = 2.
    const selectionSummary = computed(() => {
        const employeeIds = new Set<string>();
        const dates = new Set<string>();
        for (const key of selectedCells.value) {
            const [employeeId, date] = key.split('|');
            employeeIds.add(employeeId!);
            dates.add(date!);
        }
        return { cells: selectedCells.value.size, employees: employeeIds.size, days: dates.size };
    });

    // Есть ли несохранённые изменения.
    // Сравниваем отсортированные смены с «снимком» из базы. Сортировка нужна, чтобы порядок в массиве
    // не влиял: если поставить смену и тут же «Очистить», изменений снова нет.
    const isDirty = computed(() => snapshotOf(shifts.value) !== savedSnapshot.value);

    const templateById = computed(() => new Map(templates.value.map((template) => [template.id, template])));

    // ---------- Действия ----------
    function snapshotOf(list: Shift[]): string {
        return JSON.stringify([...list].sort((a, b) => cellKey(a.employee_id, a.date).localeCompare(cellKey(b.employee_id, b.date))));
    }

    // Ответ API → смены для хранилища: оставляем только поля, которые отправим обратно при сохранении,
    // и запоминаем этот набор как «сохранённый».
    function acceptFromServer(loaded: ShiftFromApi[]): void {
        shifts.value = loaded.map(({ employee_id, date, start_time, end_time, shift_template_id }) => ({
            employee_id,
            date,
            start_time,
            end_time,
            shift_template_id,
        }));
        savedSnapshot.value = snapshotOf(shifts.value);
        isPublished.value = loaded.length > 0 && loaded.every((shift) => shift.is_published);
    }

    function normalize(text: string): string {
        return text.toLowerCase().replace(/ё/g, 'е');
    }

    function cellKey(employeeId: number, date: string): string {
        return `${employeeId}|${date}`;
    }

    function shiftAt(employeeId: number, date: string): Shift | undefined {
        return shiftByCell.value.get(cellKey(employeeId, date));
    }

    // Первая загрузка страницы: справочники и смены — тремя параллельными запросами
    async function init(): Promise<void> {
        await run(async () => {
            const [loadedEmployees, loadedTemplates] = await Promise.all([api.employees(), api.templates()]);
            employees.value = loadedEmployees;
            templates.value = loadedTemplates;
            await loadShifts();
        });
    }

    // ---------- Выделение ячеек ----------

    function isSelected(employeeId: number, date: string): boolean {
        return selectedCells.value.has(cellKey(employeeId, date));
    }

    // Клик по ячейке: если не выделена — выделить, если выделена — снять. Остальные выделения остаются,
    // поэтому можно собрать несколько отдельных ячеек у разных сотрудников (как в макете, кадр 5).
    function toggleCell(employeeId: number, date: string): void {
        const key = cellKey(employeeId, date);
        if (selectedCells.value.has(key)) {
            selectedCells.value.delete(key);
        } else {
            selectedCells.value.add(key);
        }
    }

    // Заменить выделение целиком (используется при протягивании мышью — ScheduleGrid.vue)
    function setSelection(keys: Iterable<string>): void {
        selectedCells.value = new Set(keys);
    }

    // Кнопка «Снять» и клавиша Esc
    function clearSelection(): void {
        selectedCells.value = new Set();
    }

    // Если пользователь начал поиск, выделение снимаем: иначе действие применилось бы
    // и к ячейкам сотрудников, которых сейчас не видно на экране.
    watch(search, clearSelection);

    // ---------- Назначение и удаление смен (этап 2.5) ----------
    //
    // ВСЕ способы назначения сводятся к одной функции assignToSelected():
    //   «Применить шаблон» в тёмной панели → applyTemplate(id) → assignToSelected(время шаблона, id)
    //   клик по карточке шаблона справа    → applyTemplate(id) → assignToSelected(...)
    //   «Своя смена» → «Поставить в выделенные» → assignToSelected("10:00", "23:00", null)
    // Поэтому все способы работают с общими данными (требование задания).
    //
    // Изменения пока только в браузере (черновик). В базу их отправит кнопка «Сохранить» (этап 2.6).

    // Пример: выделены "5|2026-11-12" (там уже смена 10–18) и "5|2026-11-13" (пусто),
    // assignToSelected("10:00", "23:00", null):
    //   1) убираем из shifts все смены выделенных ячеек → смена 10–18 у сотрудника 5 на 12-е удалена
    //   2) добавляем по новой смене в каждую выделенную ячейку → 2 смены 10:00–23:00
    //   3) снимаем выделение
    // shifts изменился → покрытие, часы сотрудника и счётчики шаблонов пересчитаются сами (computed).
    function assignToSelected(startTime: string, endTime: string, templateId: number | null): void {
        assignToCells(selectedCells.value, startTime, endTime, templateId);
        clearSelection();
    }

    // Общая «рабочая» функция: поставить смену в указанные ячейки (ключи "id|дата").
    // Её вызывают и выделение (assignToSelected), и перетаскивание шаблона на ячейку (этап 2.7).
    function assignToCells(keys: Set<string>, startTime: string, endTime: string, templateId: number | null): void {
        if (keys.size === 0) {
            return;
        }

        const kept = shifts.value.filter((shift) => !keys.has(cellKey(shift.employee_id, shift.date)));
        const added: Shift[] = [...keys].map((key) => {
            const [employeeId, date] = key.split('|');
            return {
                employee_id: Number(employeeId),
                date: date!,
                start_time: startTime,
                end_time: endTime,
                shift_template_id: templateId,
            };
        });

        shifts.value = [...kept, ...added];
    }

    // Шаблон → его время копируется в смену, а id шаблона сохраняется (для цвета и счётчика в панели)
    function applyTemplate(templateId: number): void {
        const template = templateById.value.get(templateId);
        if (template) {
            assignToSelected(template.start_time, template.end_time, template.id);
        }
    }

    // ---------- Быстрое назначение и перетаскивание (этап 2.7) ----------

    // Клик по дате в шапке: выделить весь столбец этого дня (у сотрудников, видимых после поиска).
    // Дальше меню быстрого выбора вызывает обычный applyTemplate() — та же логика, что и у панели выделения.
    function selectDay(date: string): void {
        setSelection(visibleEmployees.value.map((employee) => cellKey(employee.id, date)));
    }

    // Перетащили шаблон из правой панели на ячейку.
    // Если ячейка входит в выделение — шаблон ставится во все выделенные ячейки, иначе только в эту.
    function dropTemplate(templateId: number, employeeId: number, date: string): void {
        const template = templateById.value.get(templateId);
        if (!template) {
            return;
        }
        const key = cellKey(employeeId, date);
        const keys = selectedCells.value.has(key) ? selectedCells.value : new Set([key]);
        assignToCells(keys, template.start_time, template.end_time, template.id);
        clearSelection();
    }

    // Перетащили смену из одной ячейки в другую.
    // copy = false — перенос (старая ячейка освобождается), copy = true (зажат Alt/Option) — копия.
    // Если в целевой ячейке уже была смена — она заменяется (одна смена на ячейку).
    //
    // Пример: смена Алины на вт 10 (10–18) → перетащили на ячейку Новикова, пт 13
    //   → у Новикова на пт 13 смена 10–18 с тем же шаблоном, у Алины на вт 10 пусто.
    function moveShift(fromEmployeeId: number, fromDate: string, toEmployeeId: number, toDate: string, copy: boolean): void {
        const source = shiftAt(fromEmployeeId, fromDate);
        const fromKey = cellKey(fromEmployeeId, fromDate);
        const toKey = cellKey(toEmployeeId, toDate);
        if (!source || fromKey === toKey) {
            return;
        }
        const remaining = shifts.value.filter((shift) => {
            const key = cellKey(shift.employee_id, shift.date);
            return key !== toKey && (copy || key !== fromKey);
        });
        shifts.value = [...remaining, { ...source, employee_id: toEmployeeId, date: toDate }];
        clearSelection();
    }

    // «Очистить»: удалить смены в выделенных ячейках
    function clearSelectedShifts(): void {
        const keys = selectedCells.value;
        shifts.value = shifts.value.filter((shift) => !keys.has(cellKey(shift.employee_id, shift.date)));
        clearSelection();
    }

    // ---------- Навигация по датам (стрелки ‹ ›, «Сегодня», «Месяц / Неделя») ----------
    //
    // Каждое действие меняет periodStart (и view), после чего загружаем смены нового периода.
    // Пример: неделя 9–15 ноября, нажали › → periodStart = "2026-11-16"
    //   → periodEnd пересчитался в "2026-11-22" (computed) → days тоже → таблица перестроилась
    //   → loadShifts() запрашивает GET /api/shifts?from=2026-11-16&to=2026-11-22.

    // direction: -1 = назад (‹), 1 = вперёд (›)
    async function move(direction: -1 | 1): Promise<void> {
        if (!confirmLeave()) {
            return;
        }
        periodStart.value = view.value === 'week'
            ? addDays(periodStart.value, 7 * direction)
            : addMonths(periodStart.value, direction);
        await run(loadShifts);
    }

    async function goToday(): Promise<void> {
        if (!confirmLeave()) {
            return;
        }
        periodStart.value = view.value === 'week' ? startOfWeek(today()) : startOfMonth(today());
        await run(loadShifts);
    }

    // Переключатель «Месяц / Неделя».
    // Неделя → месяц: показываем месяц той недели и запоминаем, какая неделя была открыта.
    // Месяц → неделя: возвращаемся на запомненную неделю, если она входит в этот месяц;
    // иначе (пользователь листал месяцы) — первая «полная» неделя месяца: та, где у месяца хотя бы 4 дня.
    // Пример: неделя 9–15 ноября → «Месяц» (ноябрь) → «Неделя» → снова 9–15 ноября, а не 26 окт – 1 ноя.
    let weekBeforeMonth: string | null = null;

    async function setView(newView: 'week' | 'month'): Promise<void> {
        if (newView === view.value || !confirmLeave()) {
            return;
        }
        if (newView === 'month') {
            weekBeforeMonth = periodStart.value;
            periodStart.value = startOfMonth(addDays(periodStart.value, 3)); // месяц, к которому относится большая часть недели
        } else {
            const monthStart = periodStart.value;
            const rememberedWeekInMonth =
                weekBeforeMonth !== null &&
                (startOfMonth(weekBeforeMonth) === monthStart || startOfMonth(addDays(weekBeforeMonth, 6)) === monthStart);
            periodStart.value = rememberedWeekInMonth ? weekBeforeMonth! : startOfWeek(addDays(monthStart, 3));
        }
        view.value = newView;
        await run(loadShifts);
    }

    // Загрузить смены отображаемого периода: при открытии страницы и после каждой навигации
    //
    // Защита от «гонки» запросов: быстро нажали › два раза → ушло два запроса (неделя 16–22 и 23–29).
    // Если ответ на первый придёт позже второго, он перезаписал бы таблицу не той неделей.
    // Поэтому каждому запросу даём номер и принимаем ответ, только если он от последнего запроса.
    let latestRequest = 0;
    async function loadShifts(): Promise<void> {
        clearSelection(); // при смене периода старые выделенные даты больше не видны
        const requestNumber = ++latestRequest;
        const loaded = await api.shifts(periodStart.value, periodEnd.value);
        if (requestNumber !== latestRequest) {
            return; // пришёл устаревший ответ — игнорируем
        }
        acceptFromServer(loaded);
    }

    // ---------- «Сохранить» и «Опубликовать» ----------
    //
    // «Сохранить»: PUT /api/shifts с ВСЕМИ сменами видимого периода.
    // Путь: кнопка в App.vue → store.save() → api.saveShifts(from, to, shifts)
    //   → Laravel: SyncShiftsRequest проверяет → ShiftController::sync() заменяет смены периода в транзакции
    //   → в ответ — смены из базы → acceptFromServer() → снимок обновлён → isDirty = false.
    // Если Laravel ответил 422 (ошибка валидации) — показываем первую ошибку, черновик в браузере не теряется.
    async function save(): Promise<boolean> {
        saving.value = true;
        try {
            const saved = await api.saveShifts(periodStart.value, periodEnd.value, shifts.value);
            acceptFromServer(saved);
            showNotice('success', 'Изменения сохранены');
            return true;
        } catch (e) {
            showNotice('error', 'Не удалось сохранить: ' + errorText(e));
            return false;
        } finally {
            saving.value = false;
        }
    }

    // «Опубликовать»: сначала сохраняем несохранённое, затем POST /api/shifts/publish за период.
    async function publish(): Promise<void> {
        if (isDirty.value && !(await save())) {
            return; // сохранение не удалось — не публикуем
        }
        saving.value = true;
        try {
            const count = await api.publish(periodStart.value, periodEnd.value);
            isPublished.value = count > 0;
            showNotice('success', count > 0 ? `Опубликовано смен: ${count}` : 'В этом периоде нет смен для публикации');
        } catch (e) {
            showNotice('error', 'Не удалось опубликовать: ' + errorText(e));
        } finally {
            saving.value = false;
        }
    }

    // Первая ошибка валидации Laravel ("shifts.0.end_time": ["..."]) или общий текст
    function errorText(e: unknown): string {
        if (e instanceof ApiError) {
            const first = Object.values(e.errors)[0]?.[0];
            return first ?? e.message;
        }
        return e instanceof Error ? e.message : 'неизвестная ошибка';
    }

    let noticeTimer: ReturnType<typeof setTimeout> | undefined;
    function showNotice(type: 'success' | 'error', text: string): void {
        notice.value = { type, text };
        clearTimeout(noticeTimer);
        noticeTimer = setTimeout(() => (notice.value = null), type === 'error' ? 6000 : 3000);
    }

    // Перед сменой недели/месяца: если есть несохранённые изменения — спросить.
    // Без этого смены, назначенные на этой неделе, молча пропали бы при переходе.
    function confirmLeave(): boolean {
        return !isDirty.value || window.confirm('Есть несохранённые изменения. Перейти без сохранения?');
    }

    // Обёртка: флаг загрузки и понятная ошибка вместо «упавшей» страницы
    async function run(action: () => Promise<void>): Promise<void> {
        loading.value = true;
        error.value = null;
        try {
            await action();
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Неизвестная ошибка';
        } finally {
            loading.value = false;
        }
    }

    return {
        employees,
        templates,
        shifts,
        view,
        periodStart,
        periodEnd,
        periodLabel,
        search,
        visibleEmployees,
        loading,
        error,
        isDirty,
        isPublished,
        saving,
        notice,
        days,
        coverageByDate,
        hoursByEmployee,
        templateUsage,
        templateById,
        selectedCells,
        selectionSummary,
        isSelected,
        toggleCell,
        setSelection,
        clearSelection,
        cellKey,
        assignToSelected,
        assignToCells,
        applyTemplate,
        selectDay,
        dropTemplate,
        moveShift,
        clearSelectedShifts,
        shiftAt,
        init,
        save,
        publish,
        move,
        goToday,
        setView,
    };
});
