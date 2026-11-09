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

// ---------- Месяц и подписи периода (этап 2.3) ----------

// Родительный падеж — для подписи недели: «9 – 15 ноября 2026»
const MONTHS_GENITIVE = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
// Именительный падеж — для подписи месяца: «Ноябрь 2026»
const MONTHS_NOMINATIVE = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

// "2026-11-18" → "2026-11-01"
export function startOfMonth(iso: string): string {
    return iso.slice(0, 8) + '01';
}

// "2026-11-18" → "2026-11-30".
// new Date(год, месяц + 1, 0) — «нулевой» день следующего месяца = последний день текущего.
export function endOfMonth(iso: string): string {
    const date = parseIso(iso);
    return toIso(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

// "2026-11-18", +1 → "2026-12-01" (первое число соседнего месяца)
export function addMonths(iso: string, months: number): string {
    const date = parseIso(startOfMonth(iso));
    return toIso(new Date(date.getFullYear(), date.getMonth() + months, 1));
}

// Подпись над таблицей.
// Неделя в одном месяце:  "9 – 15 ноября 2026"
// Неделя на стыке месяцев: "30 ноября – 6 декабря 2026"
export function weekLabel(from: string, to: string): string {
    const start = parseIso(from);
    const end = parseIso(to);
    const startText = start.getMonth() === end.getMonth()
        ? `${start.getDate()}`
        : `${start.getDate()} ${MONTHS_GENITIVE[start.getMonth()]}`;
    return `${startText} – ${end.getDate()} ${MONTHS_GENITIVE[end.getMonth()]} ${end.getFullYear()}`;
}

// "2026-11-01" → "Ноябрь 2026"
export function monthLabel(iso: string): string {
    const date = parseIso(iso);
    return `${MONTHS_NOMINATIVE[date.getMonth()]} ${date.getFullYear()}`;
}
