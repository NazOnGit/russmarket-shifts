<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Shift extends Model
{
    protected $fillable = ['employee_id', 'date', 'start_time', 'end_time', 'shift_template_id', 'published_at'];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'published_at' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(ShiftTemplate::class, 'shift_template_id');
    }

    /**
     * Длительность смены в часах. Если конец раньше начала (22:00 - 06:00),
     * смена переходит через полночь, поэтому добавляем 24 часа.
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
