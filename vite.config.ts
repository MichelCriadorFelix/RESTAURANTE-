import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: {
          id: '/',
          name: 'Sensação Gourmet',
          short_name: 'Sensação Gourmet',
          description: 'Sistema de Pedidos - Sensação Gourmet',
          theme_color: '#c2410c',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          // Icons are pinned to a fixed GitHub commit (not the `main` branch)
          // so AI Studio's binary-write bug, which has repeatedly corrupted
          // these files locally, can never affect what's actually served —
          // raw.githubusercontent.com serves the exact bytes of that commit
          // forever, regardless of what happens to the repo afterwards.
          icons: [
            {
              src: 'https://raw.githubusercontent.com/MichelCriadorFelix/RESTAURANTE-/1975716dd80f7c608f07a4d6ebb4628f6da7d780/public/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'https://raw.githubusercontent.com/MichelCriadorFelix/RESTAURANTE-/1975716dd80f7c608f07a4d6ebb4628f6da7d780/public/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ],
          shortcuts: [
            {
              name: 'Painel Admin',
              short_name: 'Admin',
              url: '/admin',
              icons: [{ src: 'https://raw.githubusercontent.com/MichelCriadorFelix/RESTAURANTE-/1975716dd80f7c608f07a4d6ebb4628f6da7d780/public/icon-192.png', sizes: '192x192' }]
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true, maximumFileSizeToCacheInBytes: 5000000
        },
        devOptions: {
          enabled: true
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      strictPort: true,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
