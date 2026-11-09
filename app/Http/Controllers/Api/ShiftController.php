<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PeriodRequest;
use App\Http\Requests\SyncShiftsRequest;
use App\Http\Resources\ShiftResource;
use App\Models\Shift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ShiftController extends Controller
{
    /** GET /api/shifts?from=2026-11-09&to=2026-11-15 — смены за период */
    public function index(PeriodRequest $request): AnonymousResourceCollection
    {
        return ShiftResource::collection($this->shiftsInPeriod($request->from, $request->to));
    }

    /**
     * PUT /api/shifts — «Сохранить».
     * В транзакции удаляем смены периода и создаём присланные: так одним запросом
     * сохраняются и новые, и изменённые, и удалённые смены. Любое сохранение
     * переводит период в черновик, пока его снова не опубликуют.
     */
    public function sync(SyncShiftsRequest $request): AnonymousResourceCollection
    {
        $data = $request->validated();

        DB::transaction(function () use ($data) {
            Shift::whereBetween('date', [$data['from'], $data['to']])->delete();

            foreach ($data['shifts'] as $shift) {
                Shift::create($shift);
            }
        });

        return ShiftResource::collection($this->shiftsInPeriod($data['from'], $data['to']));
    }

    /** POST /api/shifts/publish — «Опубликовать» смены периода */
    public function publish(PeriodRequest $request): JsonResponse
    {
        $count = Shift::whereBetween('date', [$request->from, $request->to])
            ->update(['published_at' => now()]);

        return response()->json(['published' => $count]);
    }

    private function shiftsInPeriod(string $from, string $to)
    {
        return Shift::whereBetween('date', [$from, $to])->orderBy('date')->get();
    }
}
