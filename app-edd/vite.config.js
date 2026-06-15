import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBase = env.VITE_API_BASE_URL || 'https://ialta.sandbox.alloy.com/'

  return {
    base: env.VITE_BASE || '/',
    plugins: [react()],
    server: {
      proxy: {
        '/api/alloy': {
          target: apiBase,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/alloy/, ''),
          headers: {
            'Authorization': 'Basic ' + Buffer.from(
              `${env.VITE_WORKFLOW_TOKEN}:${env.VITE_WORKFLOW_SECRET}`
            ).toString('base64'),
          },
        },
      },
    },
  }
})
