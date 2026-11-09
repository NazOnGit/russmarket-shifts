<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            // null = «своя смена» с произвольным временем
            $table->foreignId('shift_template_id')->nullable()->constrained()->nullOnDelete();
            // null = черновик, дата = опубликовано
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            // Одна смена на сотрудника в день (одна ячейка календаря)
            $table->unique(['employee_id', 'date']);
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};
