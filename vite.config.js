import { defineConfig, loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load .env files based on mode (e.g., .env.development, .env.production)
  // process.cwd() will be /home/gdo/Projects/retronode
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      // Set to true to automatically open the app in the browser on server start.
      // The actual browser used is determined by the BROWSER environment variable.
      open: true,
      port: parseInt(env.VITE_DEV_SERVER_PORT) || 5173, // Port for Vite dev server
      proxy: {
        // Proxy API requests to your Express backend
        '/api': {
          target: `http://localhost:${env.PORT || 3000}`, // Your backend server port from .env
          changeOrigin: true,
          secure: false,
        },
      },
    },
    root: process.cwd(), // Serve HTML files from the project root
    build: {
      outDir: path.resolve(process.cwd(), 'dist'),
      rollupOptions: {
        input: {
          main: path.resolve(process.cwd(), 'index.html'),
          platforms: path.resolve(process.cwd(), 'platforms.html'),
          emulators: path.resolve(process.cwd(), 'emulators.html'),
          settings: path.resolve(process.cwd(), 'settings.html'),
        },
      },
    },
  };
});