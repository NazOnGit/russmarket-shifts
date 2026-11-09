import type { Employee, Shift, ShiftFromApi, ShiftTemplate } from './types';

// ЗА ЧТО ОТВЕЧАЕТ ЭТОТ ФАЙЛ?
//
// Это единственное место, где фронтенд разговаривает с Laravel. Компоненты и хранилище
// не пишут fetch() сами — они вызывают api.employees(), api.shifts(...) и т.д.
// Если адрес API поменяется, править нужно только здесь.
//
// Путь одного запроса:
// хранилище вызывает api.employees()
// → request('GET', '/employees') → fetch('/api/employees') — браузер отправляет HTTP-запрос
// → Laravel: routes/api.php → EmployeeController::index() → JSON
// → response.json() превращает текст ответа в JS-объект { data: [...] }
// → api.employees() возвращает массив из data.

export class ApiError extends Error {
    constructor(
        message: string,
        public errors: Record<string, string[]> = {}, // ошибки валидации Laravel (код 422)
    ) {
        super(message);
    }
}

// Общая функция для всех запросов.
// <T> — «тип ответа подставим при вызове»: request<Collection<Employee>> вернёт { data: Employee[] }.
// async — функция ждёт ответа сервера (await), не замораживая страницу.
async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
    const response = await fetch(`/api${url}`, {
        method,
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    const json = await response.json().catch(() => ({}));
    // response.ok = false, если статус не 2xx: например 422 (ошибка валидации) или 500.
    // Тогда бросаем ApiError с текстом от Laravel, хранилище поймает его и покажет плашку с ошибкой.
    if (!response.ok) {
        throw new ApiError(json.message ?? `Ошибка сервера (${response.status})`, json.errors);
    }
    return json as T;
}

// Laravel Resource-коллекции оборачивают список в { data: [...] }
type Collection<T> = { data: T[] };

export const api = {
    async employees(): Promise<Employee[]> {
        return (await request<Collection<Employee>>('GET', '/employees')).data;
    },
    async templates(): Promise<ShiftTemplate[]> {
        return (await request<Collection<ShiftTemplate>>('GET', '/shift-templates')).data;
    },
    async shifts(from: string, to: string): Promise<ShiftFromApi[]> {
        return (await request<Collection<ShiftFromApi>>('GET', `/shifts?from=${from}&to=${to}`)).data;
    },
    async saveShifts(from: string, to: string, shifts: Shift[]): Promise<ShiftFromApi[]> {
        return (await request<Collection<ShiftFromApi>>('PUT', '/shifts', { from, to, shifts })).data;
    },
    async publish(from: string, to: string): Promise<number> {
        return (await request<{ published: number }>('POST', '/shifts/publish', { from, to })).published;
    },
};
