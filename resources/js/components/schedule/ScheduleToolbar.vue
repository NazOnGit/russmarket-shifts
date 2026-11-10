<script setup lang="ts">
// ЗА ЧТО ОТВЕЧАЕТ ЭТОТ КОМПОНЕНТ?
//
// Панель над таблицей:
// - поле «Поиск по ФИО»      → пишет текст в store.search, таблица показывает store.visibleEmployees
// - переключатель «Месяц / Неделя» → store.setView('month' | 'week')
// - стрелки ‹ › и «Сегодня»  → store.move(-1 | 1), store.goToday()
// - подпись периода          → store.periodLabel («9 – 15 ноября 2026» или «Ноябрь 2026»)
//
// Сам компонент ничего не хранит и не считает: он только передаёт действия пользователя в хранилище.
import { useScheduleStore } from '../../stores/schedule';
import BaseIcon from '../ui/BaseIcon.vue';

const store = useScheduleStore();

// Варианты переключателя. as const — TypeScript запоминает точные значения 'month' и 'week',
// поэтому store.setView(option.value) принимает их без ошибки типа.
const viewOptions = [
    { value: 'month', label: 'Месяц' },
    { value: 'week', label: 'Неделя' },
] as const;
</script>

<template>
    <div class="flex flex-wrap items-center gap-3 xl:flex-nowrap">
        <!-- v-model — двусторонняя связь: каждая нажатая буква сразу записывается в store.search,
             а если store.search поменять из кода, текст в поле тоже поменяется.
             Пример: ввели «вол» → store.search = "вол" → visibleEmployees = [Волков Тимур] → в таблице одна строка. -->
        <label class="flex h-11 min-w-44 flex-1 basis-56 max-w-72 items-center gap-2 rounded-xl bg-page px-4 text-sm">
            <BaseIcon name="search" :size="16" class="text-ink-muted" />
            <input
                v-model="store.search"
                type="search"
                placeholder="Поиск по ФИО"
                class="w-full bg-transparent outline-none placeholder:text-ink-muted"
            />
        </label>

        <!-- Переключатель вида. Тёмная кнопка — активный режим (сравниваем с store.view). -->
        <div class="flex h-11 shrink-0 rounded-xl bg-page p-0.5 text-sm font-medium">
            <button
                v-for="option in viewOptions"
                :key="option.value"
                type="button"
                :class="['w-28 rounded-[10px] transition-colors', store.view === option.value ? 'bg-dark text-white' : 'hover:bg-line/60']"
                @click="store.setView(option.value)"
            >
                {{ option.label }}
            </button>
        </div>

        <!-- Навигация по датам. @click — обработчик нажатия (как onclick в HTML). -->
        <div class="ml-auto flex items-center gap-1 text-sm">
            <button type="button" class="flex size-9 items-center justify-center rounded-lg hover:bg-page" title="Назад" @click="store.move(-1)">
                <BaseIcon name="chevronLeft" :size="16" />
            </button>
            <span class="min-w-40 text-center font-medium whitespace-nowrap">{{ store.periodLabel }}</span>
            <button type="button" class="flex size-9 items-center justify-center rounded-lg hover:bg-page" title="Вперёд" @click="store.move(1)">
                <BaseIcon name="chevronRight" :size="16" />
            </button>
            <button type="button" class="ml-1 h-9 rounded-lg bg-page px-3 hover:bg-line/60" @click="store.goToday()">Сегодня</button>
        </div>
    </div>
</template>
