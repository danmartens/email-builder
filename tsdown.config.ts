import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: 'src/index.ts',
  deps: {
    neverBundle: ['fsevents', 'vite', '@vitejs/plugin-react', 'sharp'],
  },
});
