<script setup lang="ts">
import BaseIcon from '../ui/BaseIcon.vue';
</script>

<template>
    <div class="flex items-center gap-3">
        <label class="flex h-11 w-full max-w-96 items-center gap-2 rounded-xl bg-page px-4 text-sm">
            <BaseIcon name="search" :size="16" class="text-ink-muted" />
            <input type="search" placeholder="Поиск по ФИО" class="w-full bg-transparent outline-none placeholder:text-ink-muted" />
        </label>

        <div class="flex h-11 shrink-0 rounded-xl bg-page p-0.5 text-sm font-medium">
            <button type="button" class="w-36 rounded-[10px]">Месяц</button>
            <button type="button" class="w-36 rounded-[10px] bg-dark text-white">Неделя</button>
        </div>
    </div>
</template>
