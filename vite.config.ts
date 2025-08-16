// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Ensure a single instance of React/DOM across the app
    dedupe: ['react', 'react-dom'],
    alias: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  },
  optimizeDeps: {
    // Pre-bundle these so Vite doesn't “outdated optimize dep” them
    include: [
      'react',
      'react-dom',
      'recharts',
      'quill',         // <-- for the plain Quill editor wrapper
      'react-select',  // <-- for selects on the portal
    ],
    // Make Vite re-check and rebuild the dep cache each dev start
    force: true,
  },
});
