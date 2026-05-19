import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
            manifest: {
                name: 'Serrated Claws',
                short_name: 'Serrated Claws',
                description: 'Lance Management System',
                theme_color: '#0d0c0a',
                background_color: '#0d0c0a',
                display: 'standalone',
                orientation: 'portrait',
                icons: [
                    { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
                    { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
                        handler: 'NetworkFirst',
                        options: { cacheName: 'supabase-api', networkTimeoutSeconds: 10 }
                    }
                ]
            }
        })
    ],
    resolve: {
        alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
    }
});
