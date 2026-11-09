<?php

// ЗА ЧТО ОТВЕЧАЕТ ЭТА МОДЕЛЬ?
//
// Employee — PHP-класс для таблицы employees. Employee::orderBy('id')->get() читает строки таблицы,
// и каждая строка становится объектом Employee: $employee->full_name = "Кузнецова Алина".

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    protected $fillable = ['full_name', 'position'];

    // Связь: у сотрудника много смен. $employee->shifts → все строки shifts, где shifts.employee_id = employees.id
    public function shifts(): HasMany
    {
        return $this->hasMany(Shift::class);
    }
}
