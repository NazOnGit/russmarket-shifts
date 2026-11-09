<?php

namespace Tests\Unit;

use App\Models\Shift;
use PHPUnit\Framework\TestCase;

class ShiftHoursTest extends TestCase
{
    public function test_hours_for_regular_and_overnight_shifts(): void
    {
        $this->assertSame(8.0, Shift::hoursBetween('07:00', '15:00'));
        $this->assertSame(13.0, Shift::hoursBetween('10:00', '23:00'));
        $this->assertSame(8.5, Shift::hoursBetween('09:30', '18:00'));
        $this->assertSame(8.0, Shift::hoursBetween('22:00', '06:00')); // через полночь
    }
}
