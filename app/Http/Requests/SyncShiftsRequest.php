<?php

namespace App\Http\Requests;

use Illuminate\Validation\Validator;

/**
 * «Сохранить»: фронтенд присылает период и ВСЕ смены этого периода.
 * Сервер заменяет смены периода на присланные (создание, изменение и удаление за один запрос).
 */
class SyncShiftsRequest extends PeriodRequest
{
    public function rules(): array
    {
        return parent::rules() + [
            'shifts' => ['present', 'array'],
            'shifts.*.employee_id' => ['required', 'integer', 'exists:employees,id'],
            'shifts.*.date' => ['required', 'date_format:Y-m-d', 'after_or_equal:from', 'before_or_equal:to'],
            'shifts.*.start_time' => ['required', 'date_format:H:i'],
            'shifts.*.end_time' => ['required', 'date_format:H:i', 'different:shifts.*.start_time'],
            'shifts.*.shift_template_id' => ['nullable', 'integer', 'exists:shift_templates,id'],
        ];
    }

    /**
     * Дополнительная проверка: в одной ячейке (сотрудник + дата) может быть только одна смена.
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

    public function messages(): array
    {
        return [
            'shifts.*.end_time.different' => 'Время окончания должно отличаться от времени начала.',
            'shifts.*.date.after_or_equal' => 'Дата смены вне выбранного периода.',
            'shifts.*.date.before_or_equal' => 'Дата смены вне выбранного периода.',
        ];
    }
}
