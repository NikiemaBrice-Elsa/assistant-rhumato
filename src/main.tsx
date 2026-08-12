import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Register service worker with auto-update
const updateSW = registerSW({
  onNeedRefresh() {
    // New content available - will update automatically
    updateSW(true)
  },
  onOfflineReady() {
    console.log('Assistant Rhumato disponible hors connexion')
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
