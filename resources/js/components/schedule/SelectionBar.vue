<script setup lang="ts">
// ЗА ЧТО ОТВЕЧАЕТ ЭТОТ КОМПОНЕНТ?
//
// Тёмная панель, которая появляется вместо поиска, когда выделена хотя бы одна ячейка (макет, кадры 5 и 9):
//   «Выделено: [4 ячейки] 2 сотрудника(-ов) · 2 дн.»   Применить шаблон · Очистить · Снять
//
// Числа берутся из store.selectionSummary (computed в хранилище), поэтому меняются сразу при выделении.
//   «Применить шаблон» → открывает список шаблонов → store.applyTemplate(id)
//   «Очистить»         → store.clearSelectedShifts(): удаляет смены в выделенных ячейках
//   «Снять»            → store.clearSelection(): только снимает выделение, смены не трогает
import { ref } from 'vue';
import { useScheduleStore } from '../../stores/schedule';
import { shiftColors } from '../../utils/shiftColors';
import { plural } from '../../utils/plural';
import BaseIcon from '../ui/BaseIcon.vue';

const store = useScheduleStore();

// Открыт ли выпадающий список шаблонов. Это состояние нужно только этой панели,
// поэтому оно хранится в компоненте, а не в общем хранилище.
const menuOpen = ref(false);

function choose(templateId: number): void {
    menuOpen.value = false;
    store.applyTemplate(templateId); // смены появятся в таблице, выделение снимется, панель исчезнет
}
</script>

<template>
    <div class="relative flex h-11 items-center gap-3 rounded-xl bg-dark px-4 text-sm text-white">
        <span class="text-white/70">Выделено:</span>
        <span class="rounded-full bg-white/15 px-2.5 py-0.5">
            {{ store.selectionSummary.cells }} {{ plural(store.selectionSummary.cells, ['ячейка', 'ячейки', 'ячеек']) }}
        </span>
        <span>{{ store.selectionSummary.employees }} сотрудника(-ов) · {{ store.selectionSummary.days }} дн.</span>

        <div class="ml-auto flex items-center gap-4">
            <button type="button" class="flex items-center gap-1.5 hover:text-white/80" @click="menuOpen = !menuOpen">
                <BaseIcon name="grid" :size="14" /> Применить шаблон
            </button>
            <button type="button" class="flex items-center gap-1.5 hover:text-white/80" @click="store.clearSelectedShifts()">
                <BaseIcon name="trash" :size="14" /> Очистить
            </button>
            <button type="button" class="flex items-center gap-1.5 hover:text-white/80" @click="store.clearSelection()">
                <BaseIcon name="x" :size="14" /> Снять
            </button>
        </div>

        <!-- Выпадающий список шаблонов. Прозрачный слой под ним закрывает меню при клике мимо. -->
        <template v-if="menuOpen">
            <div class="fixed inset-0 z-30" @click="menuOpen = false"></div>
            <ul class="absolute top-12 right-24 z-40 w-64 rounded-xl bg-white p-1.5 text-ink shadow-lg ring-1 ring-line">
                <li v-for="template in store.templates" :key="template.id">
                    <button
                        type="button"
                        :class="['w-full rounded-lg border-l-[3px] px-3 py-2 text-left hover:bg-page', shiftColors[template.color].border]"
                        @click="choose(template.id)"
                    >
                        <span class="font-medium">{{ template.name }}</span>
                        <span class="ml-2 text-ink-muted">{{ template.start_time }} – {{ template.end_time }}</span>
                    </button>
                </li>
            </ul>
        </template>
    </div>
</template>
