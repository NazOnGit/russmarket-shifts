<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Период календаря: неделя или месяц. Используется для загрузки и публикации смен.
 */
class PeriodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'from' => ['required', 'date_format:Y-m-d'],
            'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from'],
        ];

        // Не больше ~2 месяцев за раз, чтобы не грузить лишнее
        $from = \DateTimeImmutable::createFromFormat('!Y-m-d', (string) $this->input('from'));
        if ($from !== false) {
            $rules['to'][] = 'before_or_equal:'.$from->modify('+62 days')->format('Y-m-d');
        }

        return $rules;
    }
}
