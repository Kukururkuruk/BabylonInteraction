import { defineConfig } from 'vite';
import fs from 'fs';

export default defineConfig({
  server: {
    port: 5174,
    host: '0.0.0.0',  // Чтобы сервер был доступен для всех интерфейсов
    https: {
      key: fs.readFileSync('/etc/letsencrypt/live/edu-3d.avtodor-eng.ru/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/edu-3d.avtodor-eng.ru/fullchain.pem'),
    },
    hmr: {
      protocol: 'wss',
      host: 'edu-3d.avtodor-eng.ru',
      port: 5174,
    },
  },
});

