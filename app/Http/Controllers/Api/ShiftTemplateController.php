<?php

// ЗА ЧТО ОТВЕЧАЕТ ЭТОТ КОНТРОЛЛЕР?
//
// Отдаёт шаблоны смен для правой панели «Шаблоны смен» (Утро, День, Вечер).
// GET /api/shift-templates → ShiftTemplateController::index()

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ShiftTemplateResource;
use App\Models\ShiftTemplate;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ShiftTemplateController extends Controller
{
    /**
     * Route: GET /api/shift-templates → ShiftTemplateController::index()
     */
    public function index(): AnonymousResourceCollection
    {
        // SELECT * FROM shift_templates ORDER BY start_time
        // Сортировка по времени начала, чтобы в панели было: Утро (07:00), День (10:00), Вечер (15:00).
        $templates = ShiftTemplate::orderBy('start_time')->get();

        // ShiftTemplateResource добавляет к каждому шаблону посчитанные часы (hours) и приводит время к виду "07:00".
        return ShiftTemplateResource::collection($templates);
    }
}
