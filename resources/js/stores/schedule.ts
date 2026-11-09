import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { api } from '../api';
import type { Employee, Shift, ShiftTemplate } from '../types';
import { addDays, daysBetween, startOfWeek, today } from '../utils/dates';
import { hoursBetween } from '../utils/time';

/**
 * Хранилище страницы «График» (Pinia).
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

    const periodStart = ref<string>(startOfWeek(today())); // понедельник отображаемой недели
    const loading = ref(false);
    const error = ref<string | null>(null);

    // ---------- Вычисляемые значения ----------
    const periodEnd = computed(() => addDays(periodStart.value, 6));

    // Колонки таблицы: 7 дней недели
    const days = computed(() => daysBetween(periodStart.value, periodEnd.value));

    // Быстрый поиск смены по ячейке: ключ "id сотрудника|дата" -> смена.
    // Map вместо перебора массива для каждой из 56+ ячеек.
    const shiftByCell = computed(() => {
        const map = new Map<string, Shift>();
        for (const shift of shifts.value) {
            map.set(cellKey(shift.employee_id, shift.date), shift);
        }
        return map;
    });

    // Покрытие: сколько смен назначено на каждую дату
    const coverageByDate = computed(() => {
        const counts: Record<string, number> = {};
        for (const shift of shifts.value) {
            counts[shift.date] = (counts[shift.date] ?? 0) + 1;
        }
        return counts;
    });

    // Часы сотрудника за период — «агент · 16 ч» под именем
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

    // Загрузить смены отображаемого периода (повторно вызывается при смене недели — этап 2.3)
    async function loadShifts(): Promise<void> {
        const loaded = await api.shifts(periodStart.value, periodEnd.value);
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
        periodStart,
        periodEnd,
        loading,
        error,
        days,
        coverageByDate,
        hoursByEmployee,
        templateUsage,
        templateById,
        shiftAt,
        init,
    };
});
