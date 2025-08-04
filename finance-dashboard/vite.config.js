import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      }
    }
  },
  // Copy Netlify configuration files to dist during build
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: './index.html'
    },
    // Copy additional files
    copyPublicDir: true
  }
})
