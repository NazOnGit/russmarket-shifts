<script setup lang="ts">
// Корневой компонент страницы «График». Он только раскладывает блоки по местам (сайдбар, шапка,
// таблица, панель шаблонов); логика и данные живут в самих компонентах и в хранилище Pinia.
import AppSidebar from './components/layout/AppSidebar.vue';
import BaseIcon from './components/ui/BaseIcon.vue';
import ScheduleGrid from './components/schedule/ScheduleGrid.vue';
import ScheduleToolbar from './components/schedule/ScheduleToolbar.vue';
import TemplatesPanel from './components/schedule/TemplatesPanel.vue';
import { onMounted } from 'vue';
import { useScheduleStore } from './stores/schedule';

const store = useScheduleStore();

// onMounted — «когда компонент появился на странице»: тогда и загружаем данные из API.
// store.init() → три запроса к Laravel (сотрудники, шаблоны, смены недели) → данные в хранилище → таблица рисуется.
onMounted(() => store.init());
</script>

<template>
    <div class="flex min-h-screen">
        <AppSidebar />

        <main class="min-w-0 flex-1 px-8 py-5">
            <div class="flex items-center gap-3 text-sm">
                <button type="button" class="flex size-9 items-center justify-center rounded-full bg-white">
                    <BaseIcon name="chevronLeft" :size="16" />
                </button>
                Графики смен
            </div>

            <header class="mt-5 mb-5 flex items-center justify-between">
                <h1 class="text-3xl">График</h1>
                <div class="flex gap-2 text-sm font-medium">
                    <button type="button" class="h-11 rounded-lg bg-primary-soft px-4 text-primary">Опубликовать</button>
                    <button type="button" class="h-11 rounded-lg bg-primary px-4 text-white">Сохранить</button>
                </div>
            </header>

            <div class="flex items-start gap-3">
                <section class="min-w-0 flex-1 rounded-2xl bg-white p-3">
                    <ScheduleToolbar />
                    <p v-if="store.error" class="mt-3 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
                        Не удалось загрузить данные: {{ store.error }}
                    </p>
                    <p v-else-if="store.loading && store.employees.length === 0" class="mt-3 px-3 text-sm text-ink-muted">Загрузка…</p>
                    <div class="mt-3">
                        <ScheduleGrid />
                    </div>
                </section>
                <TemplatesPanel />
            </div>
        </main>
    </div>
</template>
