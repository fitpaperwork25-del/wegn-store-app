import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AuthGate from './AuthGate.tsx'

// Interactive Guide is a standalone module (own routing, own storage,
// no shared business logic) — mounted instead of the main app only
// when explicitly requested, so it never affects normal app startup.
const isGuide = new URLSearchParams(window.location.search).get('module') === 'guide'

async function bootstrap() {
  if (isGuide) {
    const { default: GuideApp } = await import('./guide/GuideApp.tsx')
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <GuideApp />
      </StrictMode>,
    )
    return
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AuthGate />
    </StrictMode>,
  )
}

bootstrap()
