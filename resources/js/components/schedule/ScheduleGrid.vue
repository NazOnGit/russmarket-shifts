<script setup lang="ts">
// ЗА ЧТО ОТВЕЧАЕТ ЭТОТ КОМПОНЕНТ?
//
// Рисует таблицу графика: строки = сотрудники, колонки = дни, внизу строка «Покрытие».
// Своих данных у компонента нет — всё читается из хранилища (stores/schedule.ts):
//   store.days             → колонки: 7 дней («пн 9») или все дни месяца («пн» над «9»)
//   store.visibleEmployees → строки: сотрудники, подходящие под поиск по ФИО
//   store.shiftAt(id, д.)  → смена в ячейке или undefined (тогда пустая пунктирная рамка)
//   store.coverageByDate   → числа в строке «Покрытие»
//   store.view             → 'week' или 'month': от него зависит ширина ячеек и вид смены
import { computed } from 'vue';
import { useScheduleStore } from '../../stores/schedule';
import { formatHours } from '../../utils/time';
import ShiftCard from './ShiftCard.vue';

const store = useScheduleStore();

const isMonth = computed(() => store.view === 'month');

// "Кузнецова Алина" -> "КА" для аватара
function initials(fullName: string): string {
    return fullName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2);
}

// Чередование фона строк, как в макете: каждая вторая строка серая.
// Фон ставим и на ячейку с именем, потому что в режиме месяца она «прилипает» слева (sticky)
// и без своего фона сквозь неё просвечивали бы прокручиваемые ячейки.
function rowBackground(index: number): string {
    return index % 2 === 1 ? 'bg-[#f7f7f9]' : 'bg-white';
}
</script>

<template>
    <!-- Обычная <table>: строки = сотрудники, колонки = дни. Таблица сама выравнивает колонки по ширине.
         Шапка (thead) и строка «Покрытие» (tfoot) — sticky: остаются на месте при прокрутке списка вниз.
         Колонка «Сотрудник» — sticky слева: остаётся на месте, когда месяц прокручивают вправо.
         overflow-auto — если колонки не помещаются (месяц = 30 колонок), появляется горизонтальная прокрутка. -->
    <div class="max-h-[600px] overflow-auto">
        <table class="w-full border-separate border-spacing-0 text-sm">
            <thead class="sticky top-0 z-20 bg-white">
                <tr class="text-ink-muted">
                    <th class="sticky left-0 z-10 w-56 min-w-56 bg-white py-3 pl-3 text-left font-normal">Сотрудник</th>
                    <th
                        v-for="day in store.days"
                        :key="day.iso"
                        :class="['py-3 font-normal whitespace-nowrap', isMonth ? 'min-w-14 text-xs leading-tight' : 'min-w-18']"
                    >
                        <!-- Неделя: «пн 9» в одну строку. Месяц: «пн» над «9», как в макете (кадр 12). -->
                        <template v-if="isMonth">{{ day.weekday }}<br />{{ day.dayOfMonth }}</template>
                        <template v-else>{{ day.weekday }} {{ day.dayOfMonth }}</template>
                    </th>
                </tr>
            </thead>

            <tbody>
                <tr v-for="(employee, index) in store.visibleEmployees" :key="employee.id" :class="rowBackground(index)">
                    <td :class="['sticky left-0 z-10 py-1.5 pl-3', rowBackground(index)]">
                        <div class="flex items-center gap-2.5">
                            <span class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#7aa2ff] to-[#5b7cf0] text-xs font-medium text-white">
                                {{ initials(employee.full_name) }}
                            </span>
                            <div>
                                <div class="whitespace-nowrap">{{ employee.full_name }}</div>
                                <!-- Часы за ВИДИМЫЙ период: в режиме недели — за неделю, в режиме месяца — за месяц -->
                                <div class="text-xs text-ink-muted">
                                    {{ employee.position }} · {{ formatHours(store.hoursByEmployee[employee.id] ?? 0) }}
                                </div>
                            </div>
                        </div>
                    </td>

                    <!-- Ячейка на пересечении сотрудника и даты.
                         Пример: employee.id = 1, day.iso = "2026-11-10" → store.shiftAt(1, "2026-11-10")
                         нашла смену 10:00–18:00 → v-if истинно → рисуем ShiftCard (фиолетовая карточка «10 - 18 / 8 ч»).
                         Не нашла → v-else → пустая пунктирная рамка. -->
                    <td v-for="day in store.days" :key="day.iso" class="p-1">
                        <div class="h-14">
                            <ShiftCard
                                v-if="store.shiftAt(employee.id, day.iso)"
                                :shift="store.shiftAt(employee.id, day.iso)!"
                                :compact="isMonth"
                            />
                            <div v-else class="h-full rounded-lg border border-dashed border-line"></div>
                        </div>
                    </td>
                </tr>

                <!-- Поиск ничего не нашёл -->
                <tr v-if="store.visibleEmployees.length === 0 && store.employees.length > 0">
                    <td :colspan="store.days.length + 1" class="py-10 text-center text-ink-muted">
                        Никого не найдено по запросу «{{ store.search }}»
                    </td>
                </tr>
            </tbody>

            <!-- Покрытие: число смен на дату. 0 — розовый (исходное состояние), больше 0 — голубой.
                 Пересчитывается само (computed в хранилище), когда меняется список смен.
                 Считается по ВСЕМ сотрудникам, а не только по найденным поиском: поиск меняет то, что видно,
                 а не то, кто реально работает в этот день. -->
            <tfoot class="sticky bottom-0 z-20 bg-white">
                <tr>
                    <td class="sticky left-0 z-10 bg-white py-3 pl-3 text-ink-muted">Покрытие</td>
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
