import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  appType: 'custom',
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
  ],
  build: {
    outDir: 'dist/server/public',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/client/index.tsx',
      output: {
        entryFileNames: 'main.js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
});
