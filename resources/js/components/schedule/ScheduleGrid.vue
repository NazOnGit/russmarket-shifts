<script setup lang="ts">
// 2.1: только вёрстка. Временные данные для вида — в 2.2 их заменят данные из API.
const days = ['пн 9', 'вт 10', 'ср 11', 'чт 12', 'пт 13', 'сб 14', 'вс 15'];
const employees = ['Кузнецова Алина', 'Волков Тимур', 'Морозова Виктория', 'Соколов Артём', 'Лебедева Полина', 'Новиков Кирилл', 'Ерохина Дарья', 'Гаврилов Егор'];
</script>

<template>
    <!-- Обычная <table>: строки = сотрудники, колонки = дни. Таблица сама выравнивает колонки по ширине.
         Шапка (thead) и строка «Покрытие» (tfoot) — sticky: остаются на месте при прокрутке списка. -->
    <div class="max-h-[600px] overflow-auto">
        <table class="w-full border-separate border-spacing-0 text-sm">
            <thead class="sticky top-0 z-10 bg-white">
                <tr class="text-ink-muted">
                    <th class="w-56 py-3 pl-3 text-left font-normal">Сотрудник</th>
                    <th v-for="day in days" :key="day" class="py-3 font-normal">{{ day }}</th>
                </tr>
            </thead>

            <tbody>
                <tr v-for="(name, index) in employees" :key="name" :class="index % 2 === 1 ? 'bg-[#f7f7f9]' : ''">
                    <td class="py-1.5 pl-3">
                        <div class="flex items-center gap-2.5">
                            <span class="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#7aa2ff] to-[#5b7cf0] text-xs font-medium text-white">
                                {{ name.split(' ').map((part) => part[0]).join('') }}
                            </span>
                            <div>
                                <div>{{ name }}</div>
                                <div class="text-xs text-ink-muted">агент · 0 ч</div>
                            </div>
                        </div>
                    </td>
                    <td v-for="day in days" :key="day" class="p-1">
                        <div class="h-14 rounded-lg border border-dashed border-line"></div>
                    </td>
                </tr>
            </tbody>

            <tfoot class="sticky bottom-0 bg-white">
                <tr>
                    <td class="py-3 pl-3 text-ink-muted">Покрытие</td>
                    <td v-for="day in days" :key="day" class="bg-danger-soft py-3 text-center text-danger">0</td>
                </tr>
            </tfoot>
        </table>
    </div>
</template>
