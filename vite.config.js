import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: 'client',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: [
      '.sandbox.novita.ai',
      'localhost',
      '127.0.0.1'
    ],
    hmr: {
      clientPort: 5173
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/public': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src')
    }
  }
})
