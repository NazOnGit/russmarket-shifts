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

    it('перетаскивание смены переносит её, а с Alt — копирует; занятая ячейка заменяется', () => {
        store.moveShift(1, '2026-11-10', 2, '2026-11-12', false);
        expect(store.shiftAt(1, '2026-11-10')).toBeUndefined();
        expect(store.shiftAt(2, '2026-11-12')?.start_time).toBe('07:00');

        store.moveShift(2, '2026-11-12', 3, '2026-11-12', true); // копия
        expect(store.shiftAt(2, '2026-11-12')).toBeDefined();
        expect(store.shiftAt(3, '2026-11-12')).toBeDefined();
        expect(store.shifts).toHaveLength(2);
    });

    it('шаблон, брошенный на выделенную ячейку, ставится во всё выделение, на невыделенную — только в неё', () => {
        store.toggleCell(5, '2026-11-13');
        store.toggleCell(6, '2026-11-13');
        store.dropTemplate(2, 5, '2026-11-13');
        expect(store.coverageByDate['2026-11-13']).toBe(2);

        store.dropTemplate(2, 7, '2026-11-14');
        expect(store.coverageByDate['2026-11-14']).toBe(1);
    });

    it('клик по дате выделяет столбец видимых сотрудников', () => {
        store.employees = [
            { id: 1, full_name: 'Кузнецова Алина', position: 'агент' },
            { id: 2, full_name: 'Волков Тимур', position: 'агент' },
        ];
        store.search = 'вол';
        store.selectDay('2026-11-11');
        expect([...store.selectedCells]).toEqual(['2|2026-11-11']);
    });

    it('Неделя → Месяц → Неделя возвращает на ту же неделю, а после листания месяцев — на первую полную неделю', async () => {
        // Сервера в тесте нет: загрузка смен упадёт, но хранилище перехватывает ошибку (run), а период уже переключён.
        // Убираем смену из beforeEach: без несохранённых изменений confirm() не вызывается.
        store.shifts = [];
        store.periodStart = '2026-11-09';

        await store.setView('month');
        expect(store.periodStart).toBe('2026-11-01');
        await store.setView('week');
        expect(store.periodStart).toBe('2026-11-09');

        await store.setView('month');
        store.periodStart = '2027-02-01'; // как будто долистали до февраля (1 февраля 2027 — понедельник)
        await store.setView('week');
        expect(store.periodStart).toBe('2027-02-01');
    });
});
