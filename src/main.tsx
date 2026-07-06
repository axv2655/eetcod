import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Self-hosted fonts — spec §2: no runtime CDN dependency, works offline
import '@fontsource/ibm-plex-mono'
import '@fontsource/ibm-plex-sans'

import './index.css'
import App from './App.tsx'

// Apply persisted theme before first paint (avoid flash)
const storedTheme = localStorage.getItem('theme') ?? 'dark'
document.documentElement.classList.toggle('dark', storedTheme === 'dark')
document.documentElement.classList.toggle('light', storedTheme === 'light')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
