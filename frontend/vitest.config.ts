import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    // Bajo ejecución paralela, las pruebas basadas en interacción (user-event)
    // y las de propiedad (fast-check) compiten por CPU y pueden exceder el
    // timeout por defecto de 5 s. Se eleva el timeout global para evitar
    // expiraciones espurias sin relajar las aserciones; las PBT más pesadas
    // mantienen además su propio timeout explícito.
    testTimeout: 30000,
  },
});
