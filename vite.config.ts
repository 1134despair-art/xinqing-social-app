import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/xinqing-social-app/',
  plugins: [
    uni(),
  ],
  publicDir: 'static',
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __UNI_FEATURE_RPX__: true
  },
  server: {
    port: 3001,
    host: '127.0.0.1',
    open: false,
    hmr: true,
    proxy: {
      '/backend-api': {
        target: 'http://117.72.185.92:19500',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/backend-api/, '')
      }
    }
  },
  build: {
    target: 'es6',
    cssTarget: 'chrome61',
    rollupOptions: {
      external: []
    }
  },
})
