<?php

// ЗА ЧТО ОТВЕЧАЕТ ЭТОТ КЛАСС?
//
// Проверяет период календаря: from (первый день) и to (последний день).
// Используется в ShiftController::index() (загрузка смен) и ShiftController::publish().
//
// Как это работает: в методе контроллера написано PeriodRequest $request.
// Laravel видит это, создаёт объект PeriodRequest из входящего запроса и запускает rules().
// Если правило не выполнено — Laravel сразу отвечает 422 с ошибками, контроллер НЕ вызывается:
// { "message": "...", "errors": { "to": ["The to field must be a date after or equal to from."] } }

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PeriodRequest extends FormRequest
{
    /**
     * Можно ли этому пользователю делать запрос. Авторизации в задании нет — разрешаем всем.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            // required — поле обязательно; date_format:Y-m-d — строго вид "2026-11-09"
            'from' => ['required', 'date_format:Y-m-d'],
            // after_or_equal:from — to не раньше from (неделя 15.11–09.11 не имеет смысла)
            'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from'],
        ];

        // Ограничение: не больше 62 дней за один запрос (месяц с запасом),
        // чтобы нельзя было одним запросом выгрузить или удалить смены за годы.
        // Пример: from = 2026-11-01 → to должен быть не позже 2027-01-02.
        // createFromFormat вернёт false, если from пришёл в неверном виде — тогда ошибку уже даст правило выше.
        $from = \DateTimeImmutable::createFromFormat('!Y-m-d', (string) $this->input('from'));
        if ($from !== false) {
            $rules['to'][] = 'before_or_equal:'.$from->modify('+62 days')->format('Y-m-d');
        }

        return $rules;
    }
}
