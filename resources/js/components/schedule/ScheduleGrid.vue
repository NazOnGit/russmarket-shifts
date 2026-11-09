<script setup lang="ts">
import { useScheduleStore } from '../../stores/schedule';
import { formatHours } from '../../utils/time';
import ShiftCard from './ShiftCard.vue';

// Таблица графика. Своих данных у компонента нет — всё читается из хранилища.
const store = useScheduleStore();

// "Кузнецова Алина" -> "КА" для аватара
function initials(fullName: string): string {
    return fullName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2);
}
</script>

<template>
    <!-- Обычная <table>: строки = сотрудники, колонки = дни. Таблица сама выравнивает колонки по ширине.
         Шапка (thead) и строка «Покрытие» (tfoot) — sticky: остаются на месте при прокрутке списка. -->
    <div class="max-h-[600px] overflow-auto">
        <table class="w-full border-separate border-spacing-0 text-sm">
            <thead class="sticky top-0 z-10 bg-white">
                <tr class="text-ink-muted">
                    <th class="w-56 min-w-56 py-3 pl-3 text-left font-normal">Сотрудник</th>
                    <th v-for="day in store.days" :key="day.iso" class="min-w-18 py-3 font-normal whitespace-nowrap">
                        {{ day.weekday }} {{ day.dayOfMonth }}
                    </th>
                </tr>
            </thead>

            <tbody>
                <tr
                    v-for="(employee, index) in store.employees"
                    :key="employee.id"
                    :class="index % 2 === 1 ? 'bg-[#f7f7f9]' : ''"
                >
                    <td class="py-1.5 pl-3">
                        <div class="flex items-center gap-2.5">
                            <span class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#7aa2ff] to-[#5b7cf0] text-xs font-medium text-white">
                                {{ initials(employee.full_name) }}
                            </span>
                            <div>
                                <div>{{ employee.full_name }}</div>
                                <div class="text-xs text-ink-muted">
                                    {{ employee.position }} · {{ formatHours(store.hoursByEmployee[employee.id] ?? 0) }}
                                </div>
                            </div>
                        </div>
                    </td>

                    <!-- Ячейка на пересечении сотрудника и даты: смена или пустая пунктирная рамка -->
                    <td v-for="day in store.days" :key="day.iso" class="p-1">
                        <div class="h-14">
                            <ShiftCard v-if="store.shiftAt(employee.id, day.iso)" :shift="store.shiftAt(employee.id, day.iso)!" />
                            <div v-else class="h-full rounded-lg border border-dashed border-line"></div>
                        </div>
                    </td>
                </tr>
            </tbody>

            <!-- Покрытие: число смен на дату. 0 — розовый (исходное состояние), больше 0 — голубой.
                 Пересчитывается само (computed в хранилище), когда меняется список смен. -->
            <tfoot class="sticky bottom-0 bg-white">
                <tr>
                    <td class="py-3 pl-3 text-ink-muted">Покрытие</td>
                    <td
                        v-for="day in store.days"
                        :key="day.iso"
                        :class="[
                            'py-3 text-center',
                            store.coverageByDate[day.iso] ? 'bg-primary-soft text-primary' : 'bg-danger-soft text-danger',
                        ]"
                    >
                        {{ store.coverageByDate[day.iso] ?? 0 }}
                    </td>
                </tr>
            </tfoot>
        </table>
    </div>
</template>
