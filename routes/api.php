<?php

// ЗА ЧТО ОТВЕЧАЕТ ЭТОТ ФАЙЛ?
//
// Здесь перечислены все адреса JSON API, к которым обращается фронтенд (resources/js/api.ts).
// Маршрут сам ничего не считает и не читает из базы: он только принимает HTTP-запрос
// и передаёт его нужному методу контроллера.
//
// Префикс /api Laravel добавляет сам (подключено в bootstrap/app.php, строка с api:),
// поэтому Route::get('/employees') отвечает по адресу http://127.0.0.1:8000/api/employees.
//
// Общий путь любого запроса:
// браузер (fetch в api.ts) → этот файл → метод контроллера → (FormRequest проверяет данные)
// → модель Eloquent читает/пишет таблицу → Resource превращает строки в JSON → ответ браузеру.

use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\ShiftController;
use App\Http\Controllers\Api\ShiftTemplateController;
use Illuminate\Support\Facades\Route;

// Список сотрудников (левая колонка таблицы).
// GET /api/employees → EmployeeController::index() → таблица employees → EmployeeResource
// Ответ: { "data": [ { "id": 1, "full_name": "Кузнецова Алина", "position": "агент" }, ... ] }
Route::get('/employees', [EmployeeController::class, 'index']);

// Шаблоны смен (правая панель: Утро, День, Вечер).
// GET /api/shift-templates → ShiftTemplateController::index() → таблица shift_templates → ShiftTemplateResource
// Ответ: { "data": [ { "id": 1, "name": "Утро", "start_time": "07:00", "end_time": "15:00", "hours": 8, "color": "blue" }, ... ] }
Route::get('/shift-templates', [ShiftTemplateController::class, 'index']);

// Смены за период, который сейчас виден на экране (неделя или месяц).
// Что отправляет браузер: GET /api/shifts?from=2026-11-09&to=2026-11-15
// from и to — это query-параметры (после знака ?), а не плейсхолдеры {..} в адресе.
// PeriodRequest проверяет их ДО того, как вызовется ShiftController::index().
// Если проверка не прошла — Laravel сам вернёт 422 с текстом ошибки, контроллер не вызывается.
Route::get('/shifts', [ShiftController::class, 'index']);

// Кнопка «Сохранить».
// Браузер отправляет PUT /api/shifts с телом JSON:
// { "from": "2026-11-09", "to": "2026-11-15", "shifts": [ { "employee_id": 1, "date": "2026-11-10", ... }, ... ] }
// SyncShiftsRequest проверяет каждую смену → ShiftController::sync() заменяет смены этого периода в базе.
// PUT (а не POST), потому что мы не добавляем новую запись, а ЗАМЕНЯЕМ содержимое периода целиком.
Route::put('/shifts', [ShiftController::class, 'sync']);

// Кнопка «Опубликовать».
// POST /api/shifts/publish с телом { "from": "2026-11-09", "to": "2026-11-15" }
// → ShiftController::publish() ставит дату публикации всем сменам периода.
Route::post('/shifts/publish', [ShiftController::class, 'publish']);
