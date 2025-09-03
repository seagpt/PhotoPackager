import { defineConfig } from 'vite'

export default defineConfig({
  // Development server config
  server: {
    port: 3000,
    open: true,
    host: true
  },
  
  // Build config
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'jszip': ['jszip']
        }
      }
    }
  },
  
  // Base path for deployment
  base: './',
  
  // Asset handling
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.gif', '**/*.svg', '**/*.ico'],
  
  // Optimizations
  optimizeDeps: {
    include: ['jszip']
  }
})