<script setup lang="ts">
// Корневой компонент страницы «График». Он только раскладывает блоки по местам (сайдбар, шапка,
// таблица, панель шаблонов); логика и данные живут в самих компонентах и в хранилище Pinia.
import AppSidebar from './components/layout/AppSidebar.vue';
import BaseIcon from './components/ui/BaseIcon.vue';
import ScheduleGrid from './components/schedule/ScheduleGrid.vue';
import ScheduleToolbar from './components/schedule/ScheduleToolbar.vue';
import SelectionBar from './components/schedule/SelectionBar.vue';
import TemplatesPanel from './components/schedule/TemplatesPanel.vue';
import { onBeforeUnmount, onMounted } from 'vue';
import { useScheduleStore } from './stores/schedule';

const store = useScheduleStore();

// onMounted — «когда компонент появился на странице»: тогда и загружаем данные из API.
// store.init() → три запроса к Laravel (сотрудники, шаблоны, смены недели) → данные в хранилище → таблица рисуется.
onMounted(() => store.init());

// Предупреждение браузера при закрытии вкладки или перезагрузке, если есть несохранённые изменения.
// beforeunload — событие «страницу сейчас закроют»; preventDefault() заставляет браузер спросить пользователя.
function warnBeforeLeaving(event: BeforeUnloadEvent): void {
    if (store.isDirty) {
        event.preventDefault();
    }
}
onMounted(() => window.addEventListener('beforeunload', warnBeforeLeaving));
onBeforeUnmount(() => window.removeEventListener('beforeunload', warnBeforeLeaving));
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

            <header class="mt-5 mb-5 flex items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <h1 class="text-3xl">График</h1>
                    <!-- Статус периода. Стиль — Badge из UI-кита: синий = опубликовано, тёмный = черновик -->
                    <span
                        v-if="!store.loading || store.employees.length > 0"
                        :class="['rounded-full px-3 py-0.5 text-sm text-white', store.isPublished && !store.isDirty ? 'bg-primary' : 'bg-dark']"
                    >
                        {{ store.isPublished && !store.isDirty ? 'Опубликовано' : 'Черновик' }}
                    </span>
                    <span v-if="store.isDirty" class="text-sm text-[#d97706]">● Есть несохранённые изменения</span>
                </div>

                <!-- «Сохранить» → store.save() → PUT /api/shifts.  «Опубликовать» → store.publish() → сохранить + POST /api/shifts/publish.
                     :disabled — кнопка неактивна, пока идёт запрос; «Сохранить» — ещё и когда нечего сохранять. -->
                <div class="flex gap-2 text-sm font-medium">
                    <button
                        type="button"
                        class="h-11 rounded-lg bg-primary-soft px-4 text-primary transition enabled:hover:bg-[#dde5fc] disabled:opacity-50"
                        :disabled="store.saving"
                        @click="store.publish()"
                    >
                        Опубликовать
                    </button>
                    <button
                        type="button"
                        class="h-11 rounded-lg bg-primary px-4 text-white transition enabled:hover:bg-[#4a6be6] disabled:opacity-50"
                        :disabled="store.saving || !store.isDirty"
                        :title="store.isDirty ? '' : 'Нет несохранённых изменений'"
                        @click="store.save()"
                    >
                        {{ store.saving ? 'Сохранение…' : 'Сохранить' }}
                    </button>
                </div>
            </header>

            <div class="flex items-start gap-3">
                <section class="min-w-0 flex-1 overflow-hidden rounded-2xl bg-white p-3">
                    <!-- Есть выделенные ячейки → тёмная панель действий, иначе → поиск и навигация (как в макете) -->
                    <SelectionBar v-if="store.selectionSummary.cells > 0" />
                    <ScheduleToolbar v-else />
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

        <!-- Короткое сообщение о результате: «Изменения сохранены», «Опубликовано смен: 8» или ошибка API.
             Исчезает само через несколько секунд (таймер в store.showNotice). -->
        <div
            v-if="store.notice"
            :class="[
                'fixed right-6 bottom-6 z-50 rounded-xl px-4 py-3 text-sm text-white shadow-lg',
                store.notice.type === 'success' ? 'bg-dark' : 'bg-danger',
            ]"
            role="status"
        >
            {{ store.notice.text }}
        </div>
    </div>
</template>
