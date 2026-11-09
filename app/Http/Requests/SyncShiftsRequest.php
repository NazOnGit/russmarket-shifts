<?php

// ЗА ЧТО ОТВЕЧАЕТ ЭТОТ КЛАСС?
//
// Проверяет данные кнопки «Сохранить» (PUT /api/shifts) ДО того, как ShiftController::sync()
// начнёт что-то удалять или записывать в базу.
//
// extends PeriodRequest — берём правила для from и to из родителя и добавляем правила для каждой смены.
// Если хоть одна смена неверная — в базе ничего не меняется, фронтенд получает 422 со списком ошибок.

namespace App\Http\Requests;

use Illuminate\Validation\Validator;

class SyncShiftsRequest extends PeriodRequest
{
    public function rules(): array
    {
        // parent::rules() — правила from/to из PeriodRequest; «+» добавляет к ним новые ключи.
        return parent::rules() + [
            // present — ключ shifts обязан быть в запросе, но может быть пустым массивом []
            // (пустой массив = «на этой неделе смен нет», то есть удалить все смены периода).
            'shifts' => ['present', 'array'],

            // shifts.* — «для каждого элемента массива shifts».
            // shifts.0.employee_id, shifts.1.employee_id ... проверяются одинаково.

            // exists:employees,id — в таблице employees должна быть строка с таким id
            'shifts.*.employee_id' => ['required', 'integer', 'exists:employees,id'],

            // Дата смены должна лежать внутри периода: нельзя через «неделю 9–15 ноября» записать смену на декабрь
            'shifts.*.date' => ['required', 'date_format:Y-m-d', 'after_or_equal:from', 'before_or_equal:to'],

            // H:i — часы и минуты: "07:00", "23:30". "25:00" или "7" не пройдут.
            'shifts.*.start_time' => ['required', 'date_format:H:i'],

            // different — конец не может совпадать с началом (смена 09:00–09:00 = 0 часов).
            // Конец МОЖЕТ быть раньше начала: 22:00–06:00 — это ночная смена через полночь.
            'shifts.*.end_time' => ['required', 'date_format:H:i', 'different:shifts.*.start_time'],

            // nullable — может быть null («своя смена» без шаблона); если не null — такой шаблон должен существовать
            'shifts.*.shift_template_id' => ['nullable', 'integer', 'exists:shift_templates,id'],
        ];
    }

    /**
     * Проверка, которую нельзя записать одним правилом: в одной ячейке (сотрудник + дата) только одна смена.
     * after() запускается после rules().
     *
     * Пример неверного запроса:
     *   shifts.0 = { employee_id: 1, date: "2026-11-10", ... }
     *   shifts.1 = { employee_id: 1, date: "2026-11-10", ... }   ← та же ячейка
     * Ключ "1|2026-11-10" встречается второй раз → ошибка на shifts.1.date.
     *
     * Это же правило закреплено в базе уникальным индексом (employee_id, date) в миграции shifts,
     * но там пользователь получил бы ошибку 500; здесь — понятное сообщение 422.
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                $seen = [];
                foreach ($this->input('shifts', []) as $index => $shift) {
                    $key = ($shift['employee_id'] ?? '').'|'.($shift['date'] ?? '');
                    if (isset($seen[$key])) {
                        $validator->errors()->add("shifts.$index.date", 'У сотрудника уже есть смена на эту дату.');
                    }
                    $seen[$key] = true;
                }
            },
        ];
    }

    /**
     * Свои тексты ошибок на русском для самых частых случаев.
     */
    public function messages(): array
    {
        return [
            'shifts.*.end_time.different' => 'Время окончания должно отличаться от времени начала.',
            'shifts.*.date.after_or_equal' => 'Дата смены вне выбранного периода.',
            'shifts.*.date.before_or_equal' => 'Дата смены вне выбранного периода.',
        ];
    }
}
