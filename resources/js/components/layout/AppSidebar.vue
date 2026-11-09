<script setup lang="ts">
import BaseIcon from '../ui/BaseIcon.vue';
</script>

<template>
    <aside class="flex w-64 shrink-0 flex-col border-r border-line bg-page px-3 py-5">
        <div class="mb-6 flex items-center justify-between px-2">
            <span class="text-lg font-medium">CRM</span>
            <BaseIcon name="bell" class="text-ink-muted" />
        </div>

        <nav class="flex flex-col gap-1 text-sm">
            <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white">
                <BaseIcon name="home" /> Главная
            </a>
            <a href="#" class="flex items-center gap-3 rounded-lg bg-white px-3 py-2">
                <BaseIcon name="calendar" /> Смены
            </a>
        </nav>

        <button type="button" class="mt-auto flex items-center gap-3 px-3 py-2 text-sm">
            <BaseIcon name="sidebar" /> Свернуть меню
        </button>
    </aside>
</template>
