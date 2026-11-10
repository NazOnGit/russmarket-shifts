<script setup lang="ts">
// ЗА ЧТО ОТВЕЧАЕТ ЭТОТ КОМПОНЕНТ?
//
// Тёмная панель, которая появляется вместо поиска, когда выделена хотя бы одна ячейка (макет, кадры 5 и 9):
//   «Выделено: [4 ячейки] 2 сотрудника(-ов) · 2 дн.»   Применить шаблон · Очистить · Снять
//
// Числа берутся из store.selectionSummary (computed в хранилище), поэтому меняются сразу при выделении.
// «Снять» — снимает выделение (этап 2.4).
// «Применить шаблон» и «Очистить» — назначение и удаление смен (этап 2.5).
import { useScheduleStore } from '../../stores/schedule';
import { plural } from '../../utils/plural';
import BaseIcon from '../ui/BaseIcon.vue';

const store = useScheduleStore();
</script>

<template>
    <div class="flex h-11 items-center gap-3 rounded-xl bg-dark px-4 text-sm text-white">
        <span class="text-white/70">Выделено:</span>
        <span class="rounded-full bg-white/15 px-2.5 py-0.5">
            {{ store.selectionSummary.cells }} {{ plural(store.selectionSummary.cells, ['ячейка', 'ячейки', 'ячеек']) }}
        </span>
        <span>{{ store.selectionSummary.employees }} сотрудника(-ов) · {{ store.selectionSummary.days }} дн.</span>

        <div class="ml-auto flex items-center gap-4">
            <!-- Этап 2.5: откроет список шаблонов -->
            <button type="button" class="flex items-center gap-1.5 opacity-50" disabled title="Будет на следующем этапе">
                <BaseIcon name="grid" :size="14" /> Применить шаблон
            </button>
            <!-- Этап 2.5: удалит смены в выделенных ячейках -->
            <button type="button" class="flex items-center gap-1.5 opacity-50" disabled title="Будет на следующем этапе">
                <BaseIcon name="trash" :size="14" /> Очистить
            </button>
            <button type="button" class="flex items-center gap-1.5 hover:text-white/80" @click="store.clearSelection()">
                <BaseIcon name="x" :size="14" /> Снять
            </button>
        </div>
    </div>
</template>
