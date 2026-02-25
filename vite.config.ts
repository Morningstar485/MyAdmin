import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    base: env.GITHUB_ACTIONS || env.VERCEL_GITHUB_DEPLOYMENT ? '/MyAdmin/' : '/',
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }
              if (id.includes('framer-motion')) {
                return 'vendor-animation';
              }
              return 'vendor'; // Keeps React, React-Dom, Lucide, etc. together
            }
          }
        }
      }
    }
  }
})

