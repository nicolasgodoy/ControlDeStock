import { defineConfig } from 'vite';

export default defineConfig({
    // Vite procesará automáticamente tu archivo .env
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: 'index.html',
        },
    },
    server: {
        port: 3000,
    }
});
