<script setup lang="ts">
// ЗА ЧТО ОТВЕЧАЕТ ЭТОТ КОМПОНЕНТ?
//
// Поле ввода времени всегда в 24-часовом формате «ЧЧ:ММ».
// Встроенный <input type="time"> показывает «09:00 AM / 05:00 PM», если на компьютере
// английские региональные настройки, а в макете и в России привычно «09:00 / 17:00».
//
// Использование: <TimeInput v-model="start" />
// defineModel() — значение, связанное с v-model родителя: изменили здесь → изменилось у родителя.
const model = defineModel<string>({ required: true });

// Пользователь печатает только цифры, двоеточие ставим сами:
// "1" → "1", "10" → "10", "100" → "10:0", "1000" → "10:00"
function onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 4);
    const formatted = digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
    input.value = formatted;
    model.value = formatted;
}
</script>

<template>
    <input
        :value="model"
        type="text"
        inputmode="numeric"
        maxlength="5"
        placeholder="ЧЧ:ММ"
        class="mt-1 h-11 w-full rounded-lg bg-page px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-primary/40"
        @input="onInput"
    />
</template>
