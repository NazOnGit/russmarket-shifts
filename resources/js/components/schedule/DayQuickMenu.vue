<script setup lang="ts">
// ЗА ЧТО ОТВЕЧАЕТ ЭТОТ КОМПОНЕНТ?
//
// «Быстрое назначение» из задания: при нажатии на дату в шапке таблицы открывается меню быстрого выбора смены.
//
// Как работает:
//   клик по «вт 10» в ScheduleGrid.vue → store.selectDay("2026-11-10") — выделяется весь столбец этого дня
//   → открывается это меню → выбор шаблона → store.applyTemplate(id) — та же функция, что у панели «Выделено»
//   → смены появляются у всех сотрудников в этом столбце.
// Поэтому быстрое назначение работает с теми же данными, что и остальные способы.
import { useScheduleStore } from '../../stores/schedule';
import type { CalendarDay } from '../../utils/dates';
import { shiftColors } from '../../utils/shiftColors';
import { plural } from '../../utils/plural';

defineProps<{ day: CalendarDay; alignRight: boolean }>();
// defineEmits — события, которые компонент сообщает родителю. Здесь одно: «закройте меня».
const emit = defineEmits<{ close: [] }>();

const store = useScheduleStore();

function choose(templateId: number): void {
    store.applyTemplate(templateId);
    emit('close');
}

function clearDay(): void {
    store.clearSelectedShifts();
    emit('close');
}

function cancel(): void {
    store.clearSelection();
    emit('close');
}
</script>

<template>
    <!-- Прозрачный слой на весь экран: клик мимо меню закрывает его и снимает выделение столбца -->
    <div class="fixed inset-0 z-30 cursor-default" @click.stop="cancel"></div>

    <div
        :class="['absolute top-full z-40 mt-1 w-64 rounded-xl bg-white p-2 text-left text-sm font-normal text-ink shadow-lg ring-1 ring-line', alignRight ? 'right-0' : 'left-0']"
        @mousedown.stop
        @click.stop
    >
        <div class="px-2 pt-1 pb-2">
            <div class="font-medium">Быстрое назначение · {{ day.weekday }} {{ day.dayOfMonth }}</div>
            <div class="text-xs text-ink-muted">
                {{ store.selectionSummary.cells }} {{ plural(store.selectionSummary.cells, ['сотрудник', 'сотрудника', 'сотрудников']) }} в этот день
            </div>
        </div>

        <button
            v-for="template in store.templates"
            :key="template.id"
            type="button"
            :class="['mb-1 w-full rounded-lg border-l-[3px] bg-page px-3 py-2 text-left hover:ring-2 hover:ring-primary/40', shiftColors[template.color].border]"
            @click="choose(template.id)"
        >
            <span class="font-medium">{{ template.name }}</span>
            <span class="ml-2 text-ink-muted">{{ template.start_time }} – {{ template.end_time }}</span>
        </button>

        <button type="button" class="mt-1 w-full rounded-lg px-3 py-2 text-left text-danger hover:bg-danger-soft" @click="clearDay">
            Очистить день
        </button>
    </div>
</template>
