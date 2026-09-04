import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || process.env.VITE_SARVAM_API_KEY || 'sk_jyptjv87_fsK6fkisYocrdYabftZOapZl';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    watch: {
      ignored: ['**/venv/**', '**/training/**', '**/public/models/**']
    },
    proxy: {
      '/api/sarvam-ws': {
        target: 'wss://api.sarvam.ai',
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sarvam-ws/, '/speech-to-text/ws'),
        headers: {
          'Api-Subscription-Key': SARVAM_API_KEY,
        },
      },
      '/api/sarvam-stt': {
        target: 'https://api.sarvam.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sarvam-stt/, '/speech-to-text'),
        headers: {
          'api-subscription-key': SARVAM_API_KEY,
        },
      },
      '/api/sarvam-tts': {
        target: 'https://api.sarvam.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sarvam-tts/, '/text-to-speech'),
        headers: {
          'api-subscription-key': SARVAM_API_KEY,
        },
      },
      '/api/tts': {
        target: 'https://api.sarvam.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tts/, '/text-to-speech'),
        headers: {
          'api-subscription-key': SARVAM_API_KEY,
        },
      },
      '/api/sarvam-translate': {
        target: 'https://api.sarvam.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sarvam-translate/, '/translate'),
        headers: {
          'api-subscription-key': SARVAM_API_KEY,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
