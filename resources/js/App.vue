<script setup lang="ts">
import { ref } from 'vue';

const title = ref<string>('График');
</script>

<template>
    <main class="p-8">
        <h1 class="text-3xl">{{ title }}</h1>
        <p class="text-gray-500">Vue 3 + TypeScript подключены.</p>
    </main>
</template>
