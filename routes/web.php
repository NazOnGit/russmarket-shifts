<?php

use Illuminate\Support\Facades\Route;

// Одна страница: Laravel отдаёт HTML-оболочку, дальше всё рисует Vue.
Route::view('/', 'app');
