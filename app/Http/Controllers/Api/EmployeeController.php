<?php

// ЗА ЧТО ОТВЕЧАЕТ ЭТОТ КОНТРОЛЛЕР?
//
// Отдаёт фронтенду список сотрудников для левой колонки таблицы «График».
// Laravel вызывает его, когда находит совпадение в routes/api.php:
// GET /api/employees → EmployeeController::index()

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EmployeeResource;
use App\Models\Employee;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EmployeeController extends Controller
{
    /**
     * Route: GET /api/employees → EmployeeController::index()
     *
     * Request не нужен: браузер ничего не отправляет, только просит список.
     */
    public function index(): AnonymousResourceCollection
    {
        // Employee:: — модель таблицы employees («хочу работать с этой таблицей»).
        // orderBy('id') — сортировать по id, чтобы порядок строк в таблице не прыгал.
        // get() — выполнить запрос: SELECT * FROM employees ORDER BY id
        // Результат — коллекция объектов Employee, по одному на строку:
        //   id | full_name        | position
        //   1  | Кузнецова Алина  | агент
        //   2  | Волков Тимур     | агент
        $employees = Employee::orderBy('id')->get();

        // EmployeeResource::collection() превращает каждый объект в массив только с нужными полями,
        // а Laravel отдаёт это как JSON: { "data": [ { "id": 1, "full_name": "Кузнецова Алина", "position": "агент" }, ... ] }
        return EmployeeResource::collection($employees);
    }
}
