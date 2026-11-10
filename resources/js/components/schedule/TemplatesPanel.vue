<script setup lang="ts">
// ЗА ЧТО ОТВЕЧАЕТ ЭТОТ КОМПОНЕНТ?
//
// Правая панель:
// 1) «Шаблоны смен» — карточки из store.templates (GET /api/shift-templates).
//    Цифра в углу = store.templateUsage: сколько раз шаблон стоит в видимом периоде.
//    Клик по карточке → store.applyTemplate(id) → шаблон ставится во все выделенные ячейки.
//    Карточку можно перетащить на ячейку таблицы (этап 2.7) → ScheduleGrid.vue → store.dropTemplate().
// 2) «Своя смена» — произвольное время начала и конца.
//    «Поставить в выделенные» → store.assignToSelected(начало, конец, null) — null значит «без шаблона».
//
// Оба способа вызывают одну и ту же функцию хранилища, поэтому работают с общими данными.
import { computed, ref } from 'vue';
import { useScheduleStore } from '../../stores/schedule';
import { shiftColors } from '../../utils/shiftColors';
import { formatHours, hoursBetween, isValidTime } from '../../utils/time';
import BaseIcon from '../ui/BaseIcon.vue';
import TimeInput from '../ui/TimeInput.vue';

const store = useScheduleStore();

const hasSelection = computed(() => store.selectionSummary.cells > 0);

// Значения полей «Начало» и «Конец». Время остаётся в полях после назначения,
// поэтому ту же «свою смену» можно сразу поставить другим сотрудникам (требование задания).
const customStart = ref('09:00');
const customEnd = ref('17:00');

// Текст ошибки под полями или null, если всё в порядке
const customError = computed<string | null>(() => {
    if (!isValidTime(customStart.value) || !isValidTime(customEnd.value)) {
        return 'Введите время в формате ЧЧ:ММ, например 09:00';
    }
    if (customStart.value === customEnd.value) {
        return 'Начало и конец не должны совпадать';
    }
    return null;
});

// Подсказка под полями: «8 ч» или «8 ч, через полночь» для 22:00–06:00
const customHint = computed(() => {
    if (customError.value) {
        return '';
    }
    const overnight = customEnd.value < customStart.value ? ', через полночь' : '';
    return formatHours(hoursBetween(customStart.value, customEnd.value)) + overnight;
});

// Начали тянуть карточку шаблона: кладём в dataTransfer, какой шаблон тянем.
// Ячейка таблицы прочитает это в onCellDrop() (ScheduleGrid.vue).
function onTemplateDragStart(event: DragEvent, templateId: number): void {
    event.dataTransfer?.setData('text/plain', JSON.stringify({ kind: 'template', templateId }));
    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'copy';
    }
}

function applyCustom(): void {
    if (customError.value === null) {
        store.assignToSelected(customStart.value, customEnd.value, null);
    }
}
</script>

<template>
    <aside class="w-80 shrink-0 rounded-2xl bg-white p-4 text-sm">
        <h3 class="mb-3">Шаблоны смен</h3>
        <ul class="flex flex-col gap-2">
            <!-- Карточка — блок с role="button", а не <button>: из <button> некоторые браузеры не начинают перетаскивание.
                 Клик (или Enter) при выделенных ячейках ставит шаблон; карточку всегда можно перетащить на ячейку. -->
            <li v-for="template in store.templates" :key="template.id">
                <div
                    role="button"
                    tabindex="0"
                    draggable="true"
                    :title="hasSelection ? 'Нажмите, чтобы поставить в выделенные ячейки, или перетащите на ячейку' : 'Перетащите на ячейку таблицы или сначала выделите ячейки'"
                    :class="[
                        'relative cursor-grab rounded-lg border-l-[3px] bg-page px-4 py-2.5 text-left transition select-none active:cursor-grabbing',
                        shiftColors[template.color].border,
                        hasSelection && 'hover:ring-2 hover:ring-primary/40',
                    ]"
                    @click="hasSelection && store.applyTemplate(template.id)"
                    @keydown.enter.prevent="hasSelection && store.applyTemplate(template.id)"
                    @dragstart="onTemplateDragStart($event, template.id)"
                >
                    <div class="font-medium">{{ template.name }}</div>
                    <div>{{ template.start_time }} - {{ template.end_time }} · {{ formatHours(template.hours) }}</div>
                    <span class="absolute top-2 right-2 rounded bg-white px-1.5 text-[11px]">{{ store.templateUsage[template.id] ?? 0 }}</span>
                </div>
            </li>
        </ul>
        <p class="mt-2 text-xs text-ink-muted">
            {{ hasSelection ? 'Нажмите на шаблон, чтобы поставить его в выделенные ячейки' : 'Выделите ячейки и выберите шаблон или перетащите шаблон на ячейку' }}
        </p>

        <h3 class="mt-6 mb-2">Своя смена</h3>
        <div class="grid grid-cols-2 gap-2">
            <label class="text-xs text-ink-muted">Начало
                <TimeInput v-model="customStart" />
            </label>
            <label class="text-xs text-ink-muted">Конец
                <TimeInput v-model="customEnd" />
            </label>
        </div>
        <p :class="['mt-1.5 min-h-4 text-xs', customError ? 'text-danger' : 'text-ink-muted']">{{ customError ?? customHint }}</p>

        <button
            type="button"
            :disabled="!hasSelection || customError !== null"
            class="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary-soft text-primary transition enabled:hover:bg-primary enabled:hover:text-white disabled:opacity-50"
            @click="applyCustom"
        >
            <BaseIcon name="plus" :size="16" /> Поставить в выделенные
        </button>
    </aside>
</template>
