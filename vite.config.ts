import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'fs';

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(version),
  },
  plugins: [
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  test: {
    environment: 'node',         // ไม่ต้องการ browser — engine เป็น pure logic
    include: ['src/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'], // แสดงผลใน terminal และ html
      include: ['src/engines/**'],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:    ['react', 'react-dom', 'react-router-dom'],
          reactflow: ['reactflow'],
          firebase:  ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
});
