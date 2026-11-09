// Работа с датами без библиотек. Даты храним строками "YYYY-MM-DD" — так же, как их отдаёт API,
// и так их удобно сравнивать и использовать как ключи.

const WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

export interface CalendarDay {
    iso: string; // "2026-11-10"
    weekday: string; // "вт"
    dayOfMonth: number; // 10
    isWeekend: boolean;
}

// "2026-11-10" -> Date в локальном времени (new Date("2026-11-10") дал бы UTC и мог бы сдвинуть день)
export function parseIso(iso: string): Date {
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(year!, month! - 1, day!);
}

export function toIso(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

export function addDays(iso: string, days: number): string {
    const date = parseIso(iso);
    date.setDate(date.getDate() + days);
    return toIso(date);
}

// Понедельник недели, в которую входит дата
export function startOfWeek(iso: string): string {
    const weekday = parseIso(iso).getDay(); // 0 = воскресенье
    return addDays(iso, weekday === 0 ? -6 : 1 - weekday);
}

export function today(): string {
    return toIso(new Date());
}

// Список дней от from до to включительно — это колонки таблицы
export function daysBetween(from: string, to: string): CalendarDay[] {
    const days: CalendarDay[] = [];
    for (let iso = from; iso <= to; iso = addDays(iso, 1)) {
        const date = parseIso(iso);
        days.push({
            iso,
            weekday: WEEKDAYS[date.getDay()]!,
            dayOfMonth: date.getDate(),
            isWeekend: date.getDay() === 0 || date.getDay() === 6,
        });
    }
    return days;
}
