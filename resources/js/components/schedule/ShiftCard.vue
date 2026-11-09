<script setup lang="ts">
import { computed } from 'vue';
import { useScheduleStore } from '../../stores/schedule';
import type { Shift } from '../../types';
import { shiftColors } from '../../utils/shiftColors';
import { formatHours, hoursBetween, shortRange } from '../../utils/time';

// Одна назначенная смена внутри ячейки таблицы.
// compact = true в режиме «Месяц»: ячейка узкая, поэтому как в макете показываем только часы («8 ч»),
// а в режиме «Неделя» — время и часы («10 - 18» / «8 ч»).
const props = defineProps<{ shift: Shift; compact?: boolean }>();

const store = useScheduleStore();

// Цвет берём из шаблона; у «своей смены» шаблона нет — отдельный синий цвет
const colors = computed(() => {
    const template = props.shift.shift_template_id === null ? undefined : store.templateById.get(props.shift.shift_template_id);
    return shiftColors[template?.color ?? 'custom'];
});
</script>

<template>
    <div :class="['flex h-full flex-col items-center justify-center rounded-lg', colors.cell]" :title="`${shift.start_time} – ${shift.end_time}`">
        <template v-if="compact">
            <span :class="['text-[13px] whitespace-nowrap', colors.hours]">{{ formatHours(hoursBetween(shift.start_time, shift.end_time)) }}</span>
        </template>
        <template v-else>
            <span class="text-[15px] leading-tight whitespace-nowrap">{{ shortRange(shift.start_time, shift.end_time) }}</span>
            <span :class="['text-[11px]', colors.hours]">{{ formatHours(hoursBetween(shift.start_time, shift.end_time)) }}</span>
        </template>
    </div>
</template>
