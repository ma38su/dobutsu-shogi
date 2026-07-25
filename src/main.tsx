import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Launcher from './Launcher.tsx'

const pathParts = window.location.pathname.split('/').filter(Boolean)
const route = pathParts.at(-1)
const content = route === 'okashi'
  ? <App variant="okashi" />
  : route === 'samurai'
    ? <App variant="samurai" />
    : <Launcher />

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {content}
  </StrictMode>,
)

if ((route === 'okashi' || route === 'samurai') && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('./sw.js').then(async () => {
      const legacyScope = new URL('../', window.location.href).href
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(
        registrations
          .filter(registration => registration.scope === legacyScope)
          .map(registration => registration.unregister()),
      )
    })
  })
}
