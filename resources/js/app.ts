import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

// Точка входа фронтенда: создаём Vue-приложение, подключаем Pinia (хранилище состояния)
// и монтируем его в <div id="app"> из resources/views/app.blade.php.
createApp(App).use(createPinia()).mount('#app');
