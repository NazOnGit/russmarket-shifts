<?php

// ЗА ЧТО ОТВЕЧАЕТ ЭТОТ КЛАСС?
//
// Превращает строку таблицы shifts в JSON для фронтенда:
// { "id": 1, "employee_id": 1, "date": "2026-11-10", "start_time": "10:00", "end_time": "18:00",
//   "shift_template_id": 2, "hours": 8, "is_published": false }
// hours и is_published — вычисляемые поля, в таблице их нет.

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShiftResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            // $this->date — объект даты (каст 'date' в модели Shift); toDateString() → "2026-11-10"
            'date' => $this->date->toDateString(),
            // substr(..., 0, 5): "10:00:00" (так время хранит MySQL) → "10:00". В SQLite уже "10:00" — не меняется.
            'start_time' => substr($this->start_time, 0, 5),
            'end_time' => substr($this->end_time, 0, 5),
            'shift_template_id' => $this->shift_template_id,
            'hours' => $this->hours(),
            // published_at = null → false (черновик); есть дата → true (опубликовано)
            'is_published' => $this->published_at !== null,
        ];
    }
}
