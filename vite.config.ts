import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',  // Assurez-vous que le build sort dans le répertoire dist
    rollupOptions: {
      input: 'index.html',  // Le fichier d'entrée principal
    },
  },
});
