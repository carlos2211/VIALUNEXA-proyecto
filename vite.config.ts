import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Commit que se está compilando: Render entrega RENDER_GIT_COMMIT; GitHub Actions / Docker, GIT_COMMIT
const commit = (process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || '').slice(0, 7)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Dentro de Docker (docker compose --profile dev) los cambios se detectan por sondeo
  server: process.env.VITE_USE_POLLING ? { watch: { usePolling: true, interval: 300 } } : undefined,
  define: {
    __APP_COMMIT__: JSON.stringify(commit),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
})
