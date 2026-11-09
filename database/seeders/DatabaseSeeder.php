<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\Shift;
use App\Models\ShiftTemplate;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $names = [
            'Кузнецова Алина', 'Волков Тимур', 'Морозова Виктория', 'Соколов Артём',
            'Лебедева Полина', 'Новиков Кирилл', 'Ерохина Дарья', 'Гаврилов Егор',
        ];
        $employees = collect($names)->map(fn (string $name) => Employee::create(['full_name' => $name]));

        $morning = ShiftTemplate::create(['name' => 'Утро', 'start_time' => '07:00', 'end_time' => '15:00', 'color' => 'blue']);
        $day = ShiftTemplate::create(['name' => 'День', 'start_time' => '10:00', 'end_time' => '18:00', 'color' => 'violet']);
        ShiftTemplate::create(['name' => 'Вечер', 'start_time' => '15:00', 'end_time' => '23:00', 'color' => 'teal']);

        // Немного смен на текущую неделю, чтобы календарь не был пустым при первом запуске
        $monday = Carbon::now()->startOfWeek();
        $demo = [
            [0, 1, $day], [0, 2, $day], [1, 1, $day], [1, 2, $day],
            [2, 3, $day], [3, 3, $day], [4, 1, $morning], [4, 3, $day],
        ];
        foreach ($demo as [$employeeIndex, $dayOffset, $template]) {
            Shift::create([
                'employee_id' => $employees[$employeeIndex]->id,
                'date' => $monday->copy()->addDays($dayOffset)->toDateString(),
                'start_time' => $template->start_time,
                'end_time' => $template->end_time,
                'shift_template_id' => $template->id,
            ]);
        }
    }
}
