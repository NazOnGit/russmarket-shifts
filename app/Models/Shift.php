<?php

// ЗА ЧТО ОТВЕЧАЕТ ЭТА МОДЕЛЬ?
//
// Shift — класс для таблицы shifts. Одна строка = одна смена = одна ячейка календаря
// на пересечении сотрудника и даты:
//   id | employee_id | date       | start_time | end_time | shift_template_id | published_at
//   1  | 1           | 2026-11-10 | 10:00      | 18:00    | 2 (День)          | null (черновик)
//   9  | 5           | 2026-11-13 | 10:00      | 23:00    | null (своя смена) | null

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Shift extends Model
{
    // $fillable — какие колонки разрешено заполнять через Shift::create([...]).
    // Остальные поля (например id) из массива будут проигнорированы — защита от «лишних» данных.
    protected $fillable = ['employee_id', 'date', 'start_time', 'end_time', 'shift_template_id', 'published_at'];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'published_at' => 'datetime',
        ];
    }

    // Связь: смена принадлежит сотруднику. $shift->employee → объект Employee по shifts.employee_id = employees.id
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(ShiftTemplate::class, 'shift_template_id');
    }

    /**
     * Длительность смены в часах.
     *
     * Переводим время в минуты от начала суток: "07:00" → 420, "15:00" → 900.
     * 900 - 420 = 480 минут = 8 часов.
     *
     * Ночная смена: "22:00" → 1320, "06:00" → 360. 360 - 1320 = -960 (отрицательно —
     * значит конец уже на следующий день) → добавляем 24 часа (1440 минут): -960 + 1440 = 480 = 8 часов.
     *
     * static — вызывается без объекта: Shift::hoursBetween('07:00', '15:00').
     * Нужна и для смен, и для шаблонов (ShiftTemplateResource).
     */
    public static function hoursBetween(string $start, string $end): float
    {
        $toMinutes = fn (string $time): int => (int) substr($time, 0, 2) * 60 + (int) substr($time, 3, 2);

        $minutes = $toMinutes($end) - $toMinutes($start);
        if ($minutes <= 0) {
            $minutes += 24 * 60;
        }

        return round($minutes / 60, 2);
    }

    public function hours(): float
    {
        return self::hoursBetween($this->start_time, $this->end_time);
    }
}
