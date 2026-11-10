import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['icon.svg','icon-192.png','icon-512.png'],
    manifest: { name: 'Formula — физика ЕГЭ', short_name: 'Formula', description: 'Тренажёр формул ЕГЭ по физике', lang: 'ru', theme_color: '#101827', background_color: '#101827', display: 'standalone', icons: [{src:'/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any maskable'},{src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}] },
    workbox: { navigateFallback: '/index.html', globPatterns: ['**/*.{js,css,html,svg,woff2,json}'] }
  })],
  test: { environment: 'node' }
});
