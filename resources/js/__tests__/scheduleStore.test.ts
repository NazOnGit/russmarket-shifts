// Тесты логики хранилища без браузера и без сервера: назначение, удаление, покрытие.
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useScheduleStore } from '../stores/schedule';

describe('schedule store', () => {
    let store: ReturnType<typeof useScheduleStore>;

    beforeEach(() => {
        setActivePinia(createPinia()); // новое пустое хранилище для каждого теста
        store = useScheduleStore();
        store.templates = [{ id: 2, name: 'День', start_time: '10:00', end_time: '18:00', hours: 8, color: 'violet' }];
        store.shifts = [{ employee_id: 1, date: '2026-11-10', start_time: '07:00', end_time: '15:00', shift_template_id: null }];
    });

    it('шаблон ставится во все выделенные ячейки и заменяет старую смену', () => {
        store.toggleCell(1, '2026-11-10'); // здесь уже есть смена 07–15
        store.toggleCell(2, '2026-11-10'); // пустая ячейка

        store.applyTemplate(2);

        expect(store.shifts).toHaveLength(2);
        expect(store.shiftAt(1, '2026-11-10')?.start_time).toBe('10:00');
        expect(store.shiftAt(2, '2026-11-10')?.shift_template_id).toBe(2);
        expect(store.coverageByDate['2026-11-10']).toBe(2); // покрытие пересчиталось само
        expect(store.templateUsage[2]).toBe(2);
        expect(store.selectionSummary.cells).toBe(0); // выделение снято
    });

    it('своя смена через полночь считается в часах сотрудника', () => {
        store.toggleCell(3, '2026-11-11');
        store.assignToSelected('22:00', '06:00', null);

        expect(store.hoursByEmployee[3]).toBe(8);
    });

    it('«Очистить» удаляет смены выделенных ячеек и обнуляет покрытие', () => {
        store.toggleCell(1, '2026-11-10');
        store.clearSelectedShifts();

        expect(store.shifts).toHaveLength(0);
        expect(store.coverageByDate['2026-11-10']).toBeUndefined(); // в таблице это «0»
    });
});
