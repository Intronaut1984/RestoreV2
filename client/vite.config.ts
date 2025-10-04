import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  server: {
    port: 3000,
    https: true,  // porque o backend usa HTTPS
    proxy: {
      '/api': {
        target: 'https://localhost:5001', // porta correta e HTTPS
        changeOrigin: true,
        secure: false, // necessário se o certificado self-signed
      }
    }
  },
  plugins: [react(), mkcert()],
})
