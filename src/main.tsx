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

if (route === 'okashi' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
  })
}
