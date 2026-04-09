import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const TENANT    = process.env.VITE_TENANT || 'tenant'
const PORT      = parseInt(process.env.VITE_PORT  || '5173')
const BASE_HOST = process.env.VITE_BASE_HOST || 'hmmbird.xyz'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    reporters: ['default', 'junit'],
    outputFile: { junit: './test-results/junit.xml' },
  },
  server: {
    port: PORT,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('X-Forwarded-Host', `${TENANT}.${BASE_HOST}`)
          })
        },
      },
    },
  },
})
