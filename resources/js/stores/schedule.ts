import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { api } from '../api';
import type { Employee, Shift, ShiftTemplate } from '../types';
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
    const loading = ref(false);
    const error = ref<string | null>(null);

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

    const templateById = computed(() => new Map(templates.value.map((template) => [template.id, template])));

    // ---------- Действия ----------
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

    // ---------- Навигация по датам (стрелки ‹ ›, «Сегодня», «Месяц / Неделя») ----------
    //
    // Каждое действие меняет periodStart (и view), после чего загружаем смены нового периода.
    // Пример: неделя 9–15 ноября, нажали › → periodStart = "2026-11-16"
    //   → periodEnd пересчитался в "2026-11-22" (computed) → days тоже → таблица перестроилась
    //   → loadShifts() запрашивает GET /api/shifts?from=2026-11-16&to=2026-11-22.

    // direction: -1 = назад (‹), 1 = вперёд (›)
    async function move(direction: -1 | 1): Promise<void> {
        periodStart.value = view.value === 'week'
            ? addDays(periodStart.value, 7 * direction)
            : addMonths(periodStart.value, direction);
        await run(loadShifts);
    }

    async function goToday(): Promise<void> {
        periodStart.value = view.value === 'week' ? startOfWeek(today()) : startOfMonth(today());
        await run(loadShifts);
    }

    // Переключатель «Месяц / Неделя». Остаёмся рядом с той же датой:
    // неделя 9–15 ноября → месяц «Ноябрь»; месяц «Ноябрь» → первая неделя ноября (с понедельника).
    async function setView(newView: 'week' | 'month'): Promise<void> {
        if (newView === view.value) {
            return;
        }
        view.value = newView;
        periodStart.value = newView === 'week' ? startOfWeek(periodStart.value) : startOfMonth(periodStart.value);
        await run(loadShifts);
    }

    // Загрузить смены отображаемого периода: при открытии страницы и после каждой навигации
    //
    // Защита от «гонки» запросов: быстро нажали › два раза → ушло два запроса (неделя 16–22 и 23–29).
    // Если ответ на первый придёт позже второго, он перезаписал бы таблицу не той неделей.
    // Поэтому каждому запросу даём номер и принимаем ответ, только если он от последнего запроса.
    let latestRequest = 0;
    async function loadShifts(): Promise<void> {
        const requestNumber = ++latestRequest;
        const loaded = await api.shifts(periodStart.value, periodEnd.value);
        if (requestNumber !== latestRequest) {
            return; // пришёл устаревший ответ — игнорируем
        }
        // Оставляем только поля, которые отправим обратно при сохранении
        shifts.value = loaded.map(({ employee_id, date, start_time, end_time, shift_template_id }) => ({
            employee_id,
            date,
            start_time,
            end_time,
            shift_template_id,
        }));
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
        days,
        coverageByDate,
        hoursByEmployee,
        templateUsage,
        templateById,
        shiftAt,
        init,
        move,
        goToday,
        setView,
    };
});
