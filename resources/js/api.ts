import type { Employee, Shift, ShiftFromApi, ShiftTemplate } from './types';

// Единственное место, где фронтенд обращается к Laravel. Компоненты и store не пишут fetch() сами.

export class ApiError extends Error {
    constructor(
        message: string,
        public errors: Record<string, string[]> = {}, // ошибки валидации Laravel (код 422)
    ) {
        super(message);
    }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
    const response = await fetch(`/api${url}`, {
        method,
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    const json = await response.json().catch(() => ({}));
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
