import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

// Vite собирает фронтенд: превращает .vue и .ts в обычный JS/CSS для браузера.
// npm run dev  — сервер разработки с автообновлением страницы при сохранении файла;
// npm run build — готовые файлы в public/build (их отдаёт Laravel на продакшене).
export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.ts'],
            refresh: true,
        }),
        vue(), // учит Vite понимать однофайловые компоненты .vue
        tailwindcss(), // генерирует CSS только для классов, которые реально используются в коде
    ],
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
