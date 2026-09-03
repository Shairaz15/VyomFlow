import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const SARVAM_API_KEY = 'sk_ijjzfhen_Cwenf03H9l469NGfqjTeHSad';

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
      "@": "/src",
    },
  },
})
