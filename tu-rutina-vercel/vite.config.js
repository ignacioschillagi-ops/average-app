import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-180.png'],
      manifest: {
        name: "Tu rutina · Average Joe's",
        short_name: 'Tu rutina',
        start_url: '.',
        display: 'standalone',
        lang: 'es',
        background_color: '#17181B',
        theme_color: '#17181B',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Precachea el shell de la app (HTML/JS/CSS/íconos) para que funcione sin conexión
        // una vez que se abrió al menos una vez. El chat con Joe's sigue necesitando
        // internet siempre, porque habla en vivo con la API de Groq (no se cachea).
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
});
