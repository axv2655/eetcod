import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Base path config:
// - Use '/<repo>/' when hosting at https://<user>.github.io/<repo>/
// - Use '/' when hosting at a user/org page or custom domain root
// GitHub Pages deploy: set base to '/warmup/' or '/' depending on your repo setup
export default defineConfig({
  base: '/',
  plugins: [
    tailwindcss(),
    react(),
  ],
})
