// Тесты чистых функций: время, даты, склонение. Запуск: npm test
import { describe, expect, it } from 'vitest';
import { addMonths, daysBetween, endOfMonth, startOfWeek, weekLabel } from '../utils/dates';
import { plural } from '../utils/plural';
import { formatHours, hoursBetween, isValidTime, shortRange } from '../utils/time';

describe('time', () => {
    it('считает часы, в том числе через полночь (как Shift::hoursBetween на бэкенде)', () => {
        expect(hoursBetween('07:00', '15:00')).toBe(8);
        expect(hoursBetween('10:00', '23:00')).toBe(13);
        expect(hoursBetween('22:00', '06:00')).toBe(8);
        expect(hoursBetween('09:30', '18:00')).toBe(8.5);
    });

    it('форматирует как в макете', () => {
        expect(formatHours(8.5)).toBe('8,5 ч');
        expect(shortRange('08:00', '18:00')).toBe('08 - 18');
        expect(shortRange('08:30', '18:00')).toBe('08:30 - 18');
    });

    it('принимает только 24-часовое время ЧЧ:ММ', () => {
        expect(isValidTime('09:00')).toBe(true);
        expect(isValidTime('23:59')).toBe(true);
        expect(isValidTime('24:00')).toBe(false);
        expect(isValidTime('9:00')).toBe(false);
        expect(isValidTime('12:60')).toBe(false);
    });
});

describe('dates', () => {
    it('находит понедельник и строит неделю', () => {
        expect(startOfWeek('2026-11-12')).toBe('2026-11-09'); // четверг → понедельник
        expect(startOfWeek('2026-11-15')).toBe('2026-11-09'); // воскресенье → понедельник той же недели
        expect(daysBetween('2026-11-09', '2026-11-15').map((d) => d.weekday)).toEqual(['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']);
    });

    it('считает границы месяца и подписи', () => {
        expect(endOfMonth('2026-02-10')).toBe('2026-02-28');
        expect(addMonths('2026-12-15', 1)).toBe('2027-01-01');
        expect(weekLabel('2026-11-09', '2026-11-15')).toBe('9 – 15 ноября 2026');
        expect(weekLabel('2026-11-30', '2026-12-06')).toBe('30 ноября – 6 декабря 2026');
    });
});

describe('plural', () => {
    it('склоняет «ячейка»', () => {
        const forms: [string, string, string] = ['ячейка', 'ячейки', 'ячеек'];
        expect(plural(1, forms)).toBe('ячейка');
        expect(plural(3, forms)).toBe('ячейки');
        expect(plural(8, forms)).toBe('ячеек');
        expect(plural(11, forms)).toBe('ячеек');
        expect(plural(21, forms)).toBe('ячейка');
    });
});
