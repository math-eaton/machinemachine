import { defineConfig } from 'vite';

export default defineConfig({
  base: '/www/nsider/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      // output: {
      //   manualChunks: {
      //     'three': ['three'],
      //     'tone': ['tone'],
      //   }
      // }
    },
    chunkSizeWarningLimit: 1000,
  },
  // server: {
  //   proxy: {
  //     '/api': {
  //       target: 'http://localhost:8080',
  //       changeOrigin: true,
  //       secure: false,
  //     },
  //   },
  // },
});
