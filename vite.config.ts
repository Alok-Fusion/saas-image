import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [react()],
    optimizeDeps: {
        exclude: ['@imgly/background-removal'],
        include: ['onnxruntime-web', 'pako', 'fast-png', 'pdf-lib'],
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