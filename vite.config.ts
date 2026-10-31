import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'og-image.png'],
            manifest: {
                name: 'ImageKit Pro',
                short_name: 'ImageKit',
                description: '20 private image tools that run entirely in your browser.',
                theme_color: '#0a0a0f',
                background_color: '#0a0a0f',
                display: 'standalone',
                start_url: '/',
                scope: '/',
                icons: [
                    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
                    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,svg,png,ico,mjs}'],
                maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
                cleanupOutdatedCaches: true,
                navigateFallback: '/index.html',
            },
        }),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) return
                    if (id.includes('react-dom') || id.includes('/react/')) return 'react'
                    if (id.includes('jspdf')) return 'jspdf'
                    if (id.includes('pdf-lib')) return 'pdf-lib'
                    if (id.includes('pdfjs-dist')) return 'pdfjs'
                    if (id.includes('tesseract.js')) return 'tesseract'
                    if (id.includes('jszip')) return 'jszip'
                    if (id.includes('three') || id.includes('@react-three')) return 'three-vendor'
                    if (id.includes('gsap') || id.includes('lenis')) return 'motion-vendor'
                },
            },
        },
    },
    optimizeDeps: {
        exclude: ['@imgly/background-removal'],
        include: ['onnxruntime-web', 'pdf-lib'],
        esbuildOptions: {
            resolveExtensions: ['.mjs', '.js']
        }
    },
    resolve: {
        alias: {
            'onnxruntime-web/webgpu': 'onnxruntime-web'
        }
    }
})