<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\Shift;
use App\Models\ShiftTemplate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShiftApiTest extends TestCase
{
    use RefreshDatabase;

    private Employee $employee;

    private ShiftTemplate $template;

    protected function setUp(): void
    {
        parent::setUp();

        $this->employee = Employee::create(['full_name' => 'Кузнецова Алина']);
        $this->template = ShiftTemplate::create(['name' => 'Утро', 'start_time' => '07:00', 'end_time' => '15:00']);
    }

    private function makeShift(string $date): Shift
    {
        return Shift::create([
            'employee_id' => $this->employee->id,
            'date' => $date,
            'start_time' => '07:00',
            'end_time' => '15:00',
            'shift_template_id' => $this->template->id,
        ]);
    }

    public function test_index_returns_only_shifts_inside_period(): void
    {
        $this->makeShift('2026-11-10');
        $this->makeShift('2026-11-20');

        $this->getJson('/api/shifts?from=2026-11-09&to=2026-11-15')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.date', '2026-11-10')
            ->assertJsonPath('data.0.hours', 8);
    }

    public function test_sync_replaces_shifts_of_period_and_keeps_other_periods(): void
    {
        $this->makeShift('2026-11-10');          // будет удалена: её нет в запросе
        $outside = $this->makeShift('2026-11-20'); // вне периода — не трогаем

        $this->putJson('/api/shifts', [
            'from' => '2026-11-09',
            'to' => '2026-11-15',
            'shifts' => [
                // своя смена через полночь
                ['employee_id' => $this->employee->id, 'date' => '2026-11-11', 'start_time' => '22:00', 'end_time' => '06:00', 'shift_template_id' => null],
            ],
        ])
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.hours', 8);

        $this->assertDatabaseMissing('shifts', ['date' => '2026-11-10']);
        $this->assertDatabaseHas('shifts', ['id' => $outside->id]);
    }

    public function test_sync_rejects_invalid_shifts(): void
    {
        $this->putJson('/api/shifts', [
            'from' => '2026-11-09',
            'to' => '2026-11-15',
            'shifts' => [
                ['employee_id' => $this->employee->id, 'date' => '2026-11-10', 'start_time' => '09:00', 'end_time' => '09:00'],
                ['employee_id' => $this->employee->id, 'date' => '2026-11-10', 'start_time' => '25:00', 'end_time' => '18:00'],
                ['employee_id' => 999, 'date' => '2026-12-01', 'start_time' => '09:00', 'end_time' => '18:00'],
            ],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'shifts.0.end_time',    // начало = конец
                'shifts.1.start_time',  // неверное время
                'shifts.1.date',        // вторая смена в той же ячейке
                'shifts.2.employee_id', // нет такого сотрудника
                'shifts.2.date',        // дата вне периода
            ]);

        $this->assertDatabaseCount('shifts', 0);
    }

    public function test_publish_marks_shifts_of_period_as_published(): void
    {
        $this->makeShift('2026-11-10');
        $later = $this->makeShift('2026-11-20');

        $this->postJson('/api/shifts/publish', ['from' => '2026-11-09', 'to' => '2026-11-15'])
            ->assertOk()
            ->assertJson(['published' => 1]);

        $this->getJson('/api/shifts?from=2026-11-09&to=2026-11-15')
            ->assertJsonPath('data.0.is_published', true);
        $this->assertNull($later->fresh()->published_at);
    }

    public function test_period_is_validated(): void
    {
        $this->getJson('/api/shifts?from=2026-11-15&to=2026-11-09')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['to']);
    }
}
