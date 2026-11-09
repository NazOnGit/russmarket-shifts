<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ShiftTemplateResource;
use App\Models\ShiftTemplate;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ShiftTemplateController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return ShiftTemplateResource::collection(ShiftTemplate::orderBy('start_time')->get());
    }
}
