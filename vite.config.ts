import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.GITHUB_ACTIONS || env.VERCEL_GITHUB_DEPLOYMENT ? '/MyAdmin/' : '/';

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png'],
        manifest: {
          name: 'MyAdmin Dashboard',
          short_name: 'MyAdmin',
          description: 'Personal productivity and task management dashboard',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          start_url: base,
          icons: [
            {
              src: 'favicon.png',
              sizes: '180x180',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'favicon.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'favicon.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'favicon.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: 'favicon.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        }
      })
    ],
    base: base,
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

