<?php

namespace App\Http\Resources;

use App\Models\Shift;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShiftTemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            // В MySQL time приходит как 07:00:00, в SQLite — как сохранили. Отдаём всегда HH:MM.
            'start_time' => substr($this->start_time, 0, 5),
            'end_time' => substr($this->end_time, 0, 5),
            'hours' => Shift::hoursBetween($this->start_time, $this->end_time),
            'color' => $this->color,
        ];
    }
}
