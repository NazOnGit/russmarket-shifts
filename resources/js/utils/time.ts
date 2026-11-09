// Расчёт и вывод времени смен. Та же логика, что Shift::hoursBetween() на бэкенде:
// фронтенду нужно считать часы сразу, ещё до сохранения на сервер.

function toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours! * 60 + minutes!;
}

// 07:00-15:00 = 8; 22:00-06:00 = 8 (смена через полночь)
export function hoursBetween(start: string, end: string): number {
    let minutes = toMinutes(end) - toMinutes(start);
    if (minutes <= 0) {
        minutes += 24 * 60;
    }
    return Math.round((minutes / 60) * 100) / 100;
}

// 8 -> "8 ч", 8.5 -> "8,5 ч"
export function formatHours(hours: number): string {
    return `${String(hours).replace('.', ',')} ч`;
}

// Подпись в ячейке как в макете: "08 - 18", а если есть минуты — "08:30 - 18"
export function shortRange(start: string, end: string): string {
    const short = (time: string) => (time.endsWith(':00') ? time.slice(0, 2) : time);
    return `${short(start)} - ${short(end)}`;
}
