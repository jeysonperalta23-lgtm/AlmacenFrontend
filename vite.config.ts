import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { networkInterfaces } from 'node:os'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), {
    name: 'demo-network-addresses',
    configureServer(server) {
      server.middlewares.use('/__demo/network', (_req, res) => {
        const addresses = Object.entries(networkInterfaces()).flatMap(([name, entries]) =>
          (entries || []).filter(entry => entry.family === 'IPv4' && !entry.internal)
            .map(entry => ({ name, address: entry.address })))
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        res.end(JSON.stringify(addresses))
      })
    },
  }],
  server: {
    host: '0.0.0.0',
    proxy: { '/demo-api': { target: 'http://127.0.0.1', changeOrigin: true, rewrite: path => path.replace(/^\/demo-api/, '/ALMACEN/api/demo.php') } },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
