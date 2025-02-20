import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import ElementPlus from 'unplugin-element-plus/vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/online-mermaid',
  server: {
    port: 3888,
  },
  plugins: [vue(), ElementPlus()],
});
