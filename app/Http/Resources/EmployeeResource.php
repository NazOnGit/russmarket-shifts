<?php

// ЗА ЧТО ОТВЕЧАЕТ ЭТОТ КЛАСС?
//
// Решает, какие поля сотрудника уйдут фронтенду в JSON. created_at/updated_at фронтенду не нужны — не отдаём.
// Объект Employee → { "id": 1, "full_name": "Кузнецова Алина", "position": "агент" }

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'position' => $this->position,
        ];
    }
}
