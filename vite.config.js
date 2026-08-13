import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'src/data/constituencies.geojson',
          dest: 'data'
        },
        {
          src: 'src/data/india_assembly.geojson',
          dest: 'data'
        }
      ]
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/myneta': {
        target: 'https://nish.space',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/myneta/, '/my_neta')
      }
    }
  }
})
