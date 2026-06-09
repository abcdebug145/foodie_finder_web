import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const required = (key) => {
    if (!env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
    return env[key];
  };

  return {
    plugins: [react()],
    server: {
      port: Number(required('VITE_DEV_SERVER_PORT')),
      open: required('VITE_DEV_SERVER_OPEN') === 'true',
      proxy: {
        '/api': {
          target: required('VITE_API_PROXY_TARGET'),
          changeOrigin: true,
        }
      }
    }
  };
});
