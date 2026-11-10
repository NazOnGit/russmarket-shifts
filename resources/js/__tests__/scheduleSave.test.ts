// Тесты «Сохранить» и несохранённых изменений. Настоящий API заменён подделкой (vi.mock),
// поэтому тест не ходит на сервер, а проверяет только логику хранилища.
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from '../api';
import { useScheduleStore } from '../stores/schedule';
import type { Shift } from '../types';

vi.mock('../api', async (importOriginal) => {
    const original = await importOriginal<typeof import('../api')>();
    return { ...original, api: { ...original.api, saveShifts: vi.fn(), publish: vi.fn() } };
});

// Сервер «отвечает» тем, что ему прислали, добавляя id, часы и статус
const echo = (shifts: Shift[]) => shifts.map((shift, i) => ({ ...shift, id: i + 1, hours: 8, is_published: false }));

describe('save', () => {
    let store: ReturnType<typeof useScheduleStore>;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useScheduleStore();
        vi.mocked(api.saveShifts).mockReset();
    });

    it('после назначения есть несохранённые изменения, после «Очистить» той же ячейки — нет', () => {
        expect(store.isDirty).toBe(false);
        store.toggleCell(1, '2026-11-10');
        store.assignToSelected('09:00', '17:00', null);
        expect(store.isDirty).toBe(true);

        store.toggleCell(1, '2026-11-10');
        store.clearSelectedShifts();
        expect(store.isDirty).toBe(false);
    });

    it('«Сохранить» отправляет смены периода и сбрасывает флаг изменений', async () => {
        vi.mocked(api.saveShifts).mockImplementation(async (_from, _to, shifts) => echo(shifts));
        store.toggleCell(1, store.periodStart);
        store.assignToSelected('09:00', '17:00', null);

        expect(await store.save()).toBe(true);

        expect(api.saveShifts).toHaveBeenCalledWith(store.periodStart, store.periodEnd, store.shifts);
        expect(store.isDirty).toBe(false);
        expect(store.notice?.type).toBe('success');
    });

    it('ошибка валидации 422: показываем текст ошибки и не теряем черновик', async () => {
        vi.mocked(api.saveShifts).mockRejectedValue(
            new ApiError('The given data was invalid.', { 'shifts.0.date': ['Дата смены вне выбранного периода.'] }),
        );
        store.toggleCell(1, store.periodStart);
        store.assignToSelected('09:00', '17:00', null);

        expect(await store.save()).toBe(false);

        expect(store.notice?.text).toContain('Дата смены вне выбранного периода.');
        expect(store.isDirty).toBe(true);
        expect(store.shifts).toHaveLength(1);
    });
});
