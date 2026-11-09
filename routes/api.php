<?php

use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\ShiftController;
use App\Http\Controllers\Api\ShiftTemplateController;
use Illuminate\Support\Facades\Route;

// Все маршруты здесь автоматически получают префикс /api (см. bootstrap/app.php)
Route::get('/employees', [EmployeeController::class, 'index']);
Route::get('/shift-templates', [ShiftTemplateController::class, 'index']);
Route::get('/shifts', [ShiftController::class, 'index']);
Route::put('/shifts', [ShiftController::class, 'sync']);
Route::post('/shifts/publish', [ShiftController::class, 'publish']);
