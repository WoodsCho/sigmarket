import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React 코어 — 항상 필요
          'react-vendor': ['react', 'react-dom'],
          // React Router — 항상 필요
          'router': ['react-router-dom'],
          // AWS Amplify — 무거우므로 분리 (비동기 로드)
          'amplify': ['aws-amplify'],
          // 차트 라이브러리 — IndicatorDetailPage에서만 사용
          'charts': ['lightweight-charts'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
})
