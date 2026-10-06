import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// In development, /api requests are proxied to the Flask server so the browser
// sees a single origin and no CORS configuration is needed.
// Override the target with API_URL=http://host:port npm run dev
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': { target: env.API_URL || 'http://localhost:5000', changeOrigin: true, rewrite: (path) => path.replace(/^\/api/, ''),},
      },
    },
  }
})
