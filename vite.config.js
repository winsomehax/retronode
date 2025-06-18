import { defineConfig, loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load .env files based on mode (e.g., .env.development, .env.production)
  // process.cwd() will be /home/gdo/Projects/retronode
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Assets in this directory are served at the root path during development
    // and copied to the root of the 'dist' directory on build.
    // e.g., a file at 'src/public/images/placeholder.png' will be accessible as '/images/placeholder.png'.
    publicDir: 'src/public',
    server: {
      // Set to true to automatically open the app in the browser on server start.
      // The actual browser used is determined by the BROWSER environment variable.
      open: true,
      port: parseInt(env.VITE_DEV_SERVER_PORT) || 5173, // Port for Vite dev server
      proxy: {
        // Proxy API requests to your Express backend
        '/api': {
          target: `http://localhost:${env.PORT || 3000}`, // Your backend server port from .env
          changeOrigin: true
        },
      },
    },
    root: process.cwd(), // Serve HTML files from the project root
    build: {
      outDir: path.resolve(process.cwd(), 'dist'),
      rollupOptions: {
        input: {
          main: 'index.html',
          platforms: 'platforms.html',
          emulators: 'emulators.html',
          settings: 'settings.html',
        },
      },
    },
  };
});