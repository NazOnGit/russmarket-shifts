<?php

// ЗА ЧТО ОТВЕЧАЕТ ЭТОТ КОНТРОЛЛЕР?
//
// Всё, что связано со сменами:
// - загрузить смены видимого периода (index),
// - кнопка «Сохранить» — заменить смены периода тем, что прислал фронтенд (sync),
// - кнопка «Опубликовать» — отметить смены периода опубликованными (publish).
//
// Laravel вызывает эти методы после совпадения маршрута в routes/api.php.
// Проверку входящих данных делают классы FormRequest (PeriodRequest, SyncShiftsRequest):
// если данные неверные, Laravel сам отвечает 422 и метод контроллера даже не запускается.

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PeriodRequest;
use App\Http\Requests\SyncShiftsRequest;
use App\Http\Resources\ShiftResource;
use App\Models\Shift;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ShiftController extends Controller
{
    /**
     * Route: GET /api/shifts?from=2026-11-09&to=2026-11-15 → ShiftController::index()
     *
     * Вызывается, когда страница открылась или пользователь переключил неделю/месяц.
     *
     * PeriodRequest $request — Laravel создаёт этот объект из запроса и проверяет from и to
     * по правилам из app/Http/Requests/PeriodRequest.php ещё до входа в метод.
     * $request->from = "2026-11-09", $request->to = "2026-11-15" — значения из адреса после «?».
     */
    public function index(PeriodRequest $request): AnonymousResourceCollection
    {
        $shifts = $this->shiftsInPeriod($request->from, $request->to);

        // Ответ: { "data": [ { "id": 1, "employee_id": 1, "date": "2026-11-10", "start_time": "10:00",
        //                      "end_time": "18:00", "shift_template_id": 2, "hours": 8, "is_published": false }, ... ] }
        return ShiftResource::collection($shifts);
    }

    /**
     * Route: PUT /api/shifts → ShiftController::sync()      (кнопка «Сохранить»)
     *
     * Что присылает фронтенд — ВСЕ смены видимого периода в их текущем виде:
     * {
     *   "from": "2026-11-09", "to": "2026-11-15",
     *   "shifts": [
     *     { "employee_id": 1, "date": "2026-11-10", "start_time": "10:00", "end_time": "18:00", "shift_template_id": 2 },
     *     { "employee_id": 5, "date": "2026-11-13", "start_time": "10:00", "end_time": "23:00", "shift_template_id": null }
     *   ]
     * }
     *
     * Идея: вместо отдельных запросов «создать / изменить / удалить» для каждой смены
     * мы стираем смены этого периода и записываем присланные. Так одним запросом сохраняются
     * и новые, и изменённые, и удалённые смены.
     *
     * Пример: в базе на неделе 3 смены, пользователь удалил одну и добавил две →
     * фронтенд пришлёт 4 смены → после sync() в базе на этой неделе ровно эти 4 смены.
     * Смены других недель не трогаются (удаляем только whereBetween from..to).
     */
    public function sync(SyncShiftsRequest $request): AnonymousResourceCollection
    {
        // validated() — только проверенные поля (from, to, shifts). Лишние поля из запроса сюда не попадут.
        $data = $request->validated();

        // DB::transaction — всё внутри выполняется как одно целое.
        // Если на любой смене произойдёт ошибка, Laravel откатит и удаление, и вставки:
        // в базе останется старое состояние, а не «половина недели удалена».
        DB::transaction(function () use ($data) {
            // DELETE FROM shifts WHERE date BETWEEN '2026-11-09' AND '2026-11-15'
            Shift::whereBetween('date', [$data['from'], $data['to']])->delete();

            // INSERT по одной строке на каждую присланную смену.
            // Shift::create() принимает только поля из $fillable в app/Models/Shift.php.
            foreach ($data['shifts'] as $shift) {
                Shift::create($shift);
            }
        });

        // Возвращаем то, что теперь лежит в базе, чтобы фронтенд видел результат сохранения.
        // Новые строки без published_at → период снова «черновик», пока его не опубликуют.
        return ShiftResource::collection($this->shiftsInPeriod($data['from'], $data['to']));
    }

    /**
     * Route: POST /api/shifts/publish → ShiftController::publish()      (кнопка «Опубликовать»)
     *
     * Тело запроса: { "from": "2026-11-09", "to": "2026-11-15" }
     * Ставит текущее время в колонку published_at всем сменам периода.
     * published_at = null → черновик, published_at = дата → опубликовано.
     */
    public function publish(PeriodRequest $request): JsonResponse
    {
        // UPDATE shifts SET published_at = NOW() WHERE date BETWEEN from AND to
        // update() возвращает количество изменённых строк, например 8.
        $count = Shift::whereBetween('date', [$request->from, $request->to])
            ->update(['published_at' => now()]);

        // Ответ: { "published": 8 }
        return response()->json(['published' => $count]);
    }

    /**
     * Общий запрос для index() и sync():
     * SELECT * FROM shifts WHERE date BETWEEN from AND to ORDER BY date
     */
    private function shiftsInPeriod(string $from, string $to): Collection
    {
        return Shift::whereBetween('date', [$from, $to])->orderBy('date')->get();
    }
}
