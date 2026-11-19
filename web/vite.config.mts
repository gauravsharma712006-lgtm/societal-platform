import { defineConfig, loadEnv } from 'vite';
import { resolveApiUrl } from './src/services/config.ts';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ command, mode }) => {
    const clientEnv = loadEnv(mode, process.cwd(), 'VITE_');
    if (command === 'build') resolveApiUrl(clientEnv.VITE_API_URL, true);
    if (clientEnv.VITE_AI_ENABLED && !['true', 'false'].includes(clientEnv.VITE_AI_ENABLED)) {
        throw new Error('VITE_AI_ENABLED must be true or false');
    }
    return {
    plugins: [
        react(),
        tailwindcss(),
    ],

    server: {
        port: 5173,
    },
    };
});
