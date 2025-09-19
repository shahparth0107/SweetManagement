import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // all /api calls go to your backend (default localhost:6000)
      '/api': {
        target: process.env.BACKEND_ORIGIN || 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
})