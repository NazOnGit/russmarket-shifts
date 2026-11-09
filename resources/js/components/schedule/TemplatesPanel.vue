<script setup lang="ts">
import BaseIcon from '../ui/BaseIcon.vue';

// 2.1: временные данные. В 2.2 шаблоны придут из GET /api/shift-templates.
const templates = [
    { name: 'Утро', time: '07:00 - 15:00 · 8 ч', border: 'border-l-[#8fa9f5]' },
    { name: 'День', time: '10:00 - 18:00 · 8 ч', border: 'border-l-[#a58cf5]' },
    { name: 'Вечер', time: '15:00 - 23:00 · 8 ч', border: 'border-l-[#6fd3c3]' },
];
</script>

<template>
    <aside class="w-80 shrink-0 rounded-2xl bg-white p-4 text-sm">
        <h3 class="mb-3">Шаблоны смен</h3>
        <ul class="flex flex-col gap-2">
            <li
                v-for="template in templates"
                :key="template.name"
                :class="['relative rounded-lg border-l-[3px] bg-page px-4 py-2.5', template.border]"
            >
                <div class="font-medium">{{ template.name }}</div>
                <div>{{ template.time }}</div>
                <span class="absolute top-2 right-2 rounded bg-white px-1.5 text-[11px]">0</span>
            </li>
        </ul>

        <h3 class="mt-7 mb-2">Своя смена</h3>
        <div class="grid grid-cols-2 gap-2">
            <label class="text-xs text-ink-muted">Начало
                <input type="time" value="09:00" class="mt-1 h-11 w-full rounded-lg bg-page px-3 text-sm text-ink" />
            </label>
            <label class="text-xs text-ink-muted">Конец
                <input type="time" value="17:00" class="mt-1 h-11 w-full rounded-lg bg-page px-3 text-sm text-ink" />
            </label>
        </div>
        <button type="button" class="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary-soft text-primary">
            <BaseIcon name="plus" :size="16" /> Поставить в выделенные
        </button>
    </aside>
</template>
