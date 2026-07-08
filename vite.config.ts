import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Base path config:
// - GitHub Pages repo page (https://<user>.github.io/<repo>/): use '/<repo>/'
// - GitHub Pages user/org page (https://<user>.github.io/) or custom domain: use '/'
//
// Change to '/' if you set up a custom domain (add public/CNAME and update DNS).
export default defineConfig({
  base: '/eetcod/', // Change to '/' for custom domain
  plugins: [
    tailwindcss(),
    react(),
  ],
})
