// ЗА ЧТО ОТВЕЧАЕТ ЭТОТ ФАЙЛ?
//
// Описывает «форму» данных: какие поля есть у сотрудника, шаблона и смены и какого они типа.
// Сам по себе этот файл ничего не делает в браузере — после сборки он исчезает.
// Он нужен TypeScript, чтобы проверять код ДО запуска.
//
// Пример: API отдаёт сотрудника { "id": 1, "full_name": "Кузнецова Алина", "position": "агент" }.
// interface Employee говорит: у сотрудника есть id (число), full_name (строка), position (строка).
// Если в компоненте написать employee.fullname (без подчёркивания), `npm run typecheck`
// покажет ошибку «Property 'fullname' does not exist», а не пустое место на экране.
//
// Формы совпадают с тем, что отдают классы в app/Http/Resources/*.

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
