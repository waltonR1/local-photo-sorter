import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    mode === 'development' ? vueDevTools() : undefined,
  ].filter(Boolean),
  build: {
    chunkSizeWarningLimit: 1500,
    rolldownOptions: {
      onLog(level, log, handler) {
        if (
          level === 'warn' &&
          log.code === 'INVALID_ANNOTATION' &&
          log.id?.includes('@vueuse/core')
        ) {
          return
        }

        handler(level, log)
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
}))
