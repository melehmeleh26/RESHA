
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8080
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        background: path.resolve(__dirname, 'public/js/background.js'),
        content: path.resolve(__dirname, 'public/js/content.js')
      },
      output: {
        entryFileNames: (assetInfo) => {
          return assetInfo.name === 'background' || assetInfo.name === 'content'
            ? 'js/[name].js'
            : 'js/[name]-[hash].js';
        },
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `icons/[name][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    emptyOutDir: true,
    sourcemap: true,
  }
})
