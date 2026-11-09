// Описание формы данных, которые приходят из API (см. app/Http/Resources/*).
// TypeScript проверяет, что мы обращаемся только к существующим полям.

export interface Employee {
    id: number;
    full_name: string;
    position: string;
}

export type TemplateColor = 'blue' | 'violet' | 'teal';

export interface ShiftTemplate {
    id: number;
    name: string;
    start_time: string; // "07:00"
    end_time: string; // "15:00"
    hours: number;
    color: TemplateColor;
}

// Смена в том виде, в каком её хранит фронтенд и отправляет «Сохранить».
export interface Shift {
    employee_id: number;
    date: string; // "2026-11-10"
    start_time: string;
    end_time: string;
    shift_template_id: number | null; // null = «своя смена»
}

// Смена из GET /api/shifts — те же поля плюс то, что считает сервер.
export interface ShiftFromApi extends Shift {
    id: number;
    hours: number;
    is_published: boolean;
}
