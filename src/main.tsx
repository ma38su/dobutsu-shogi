import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Launcher from './Launcher.tsx'
import Rules from './Rules.tsx'

const pathParts = window.location.pathname.split('/').filter(Boolean)
const route = pathParts.at(-1)
const rulesVariant = route === 'rules' && pathParts.at(-2) === 'okashi' ? 'okashi' : route === 'rules' && pathParts.at(-2) === 'samurai' ? 'samurai' : null
const content = rulesVariant
  ? <Rules variant={rulesVariant} />
  : route === 'okashi'
  ? <App variant="okashi" />
  : route === 'samurai'
    ? <App variant="samurai" />
    : <Launcher />

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {content}
  </StrictMode>,
)

if ((route === 'okashi' || route === 'samurai' || route === 'rules') && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('../sw.js').then(async (rootRegistration) => {
      const gameScope = new URL('./', window.location.href).href
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(
        registrations
          .filter(registration =>
            registration.scope === gameScope && registration.scope !== rootRegistration.scope,
          )
          .map(registration => registration.unregister()),
      )
    }).catch(() => undefined)
  })
}
