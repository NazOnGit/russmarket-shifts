<?php

// ЗА ЧТО ОТВЕЧАЕТ ЭТА МОДЕЛЬ?
//
// ShiftTemplate — класс для таблицы shift_templates (Утро 07:00–15:00, День 10:00–18:00, Вечер 15:00–23:00).
// Шаблон — это только «заготовка» времени. При назначении время КОПИРУЕТСЯ в смену,
// поэтому смена хранит свои start_time/end_time и ссылку shift_template_id (для цвета и счётчика).

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShiftTemplate extends Model
{
    protected $fillable = ['name', 'start_time', 'end_time', 'color'];
}
