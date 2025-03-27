import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  server: {
    host: '0.0.0.0',  // Это позволяет серверу слушать на всех интерфейсах (IPv4 и IPv6)
    port: 5174,
    hmr: {
      protocol: 'wss',  // Используем защищенный WebSocket
      host: 'edu-3d.avtodor-eng.ru', // Указываем нужный хост
      port: 5174,  // Убедитесь, что это тот же порт, что и на сервере
      clientPort: 5174,  // Указываем порт для клиента, если он отличается от сервера
      path: '/', // Путь, по которому сервер принимает HMR-соединения
    },
    allowedHosts: [
      'edu-3d.avtodor-eng.ru', // Разрешаем подключения с этого хоста
    ],
    proxy: {
      '/ws': {
        target: 'wss://edu-3d.avtodor-eng.ru',
        ws: true,  // Включаем поддержку WebSocket
      },
    },
    // Логирование всех запросов
    watch: {
      usePolling: true, // Включаем polling для отслеживания изменений на сервере
    },
  },
  plugins: [
    {
      name: 'vite-plugin-logger',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          console.log(`Request URL: ${req.url}`);
          next();
        });
      }
    }
  ]
});
