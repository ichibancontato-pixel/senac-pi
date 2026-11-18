import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Endereço do backend. O front chama /api e o Vite repassa para cá,
  // assim o navegador não esbarra em CORS (o backend não envia esses cabeçalhos).
  const backend = env.BACKEND_URL || 'http://localhost:3000'
  const proxy = { '/api': { target: backend, changeOrigin: true } }

  return {
    plugins: [react()],
    server: { host: '127.0.0.1', port: 5173, proxy },
    preview: { host: '127.0.0.1', port: 4173, proxy },
  }
})
