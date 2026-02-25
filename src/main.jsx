import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initI18n } from './i18n/i18n'
import { hasSeenGuideSync } from './lib/checkOnboarding'
import { registerSW } from 'virtual:pwa-register'

const needsGuide = !hasSeenGuideSync()

function scheduleSW() {
  const updateSW = registerSW({
    immediate: false,
    onNeedRefresh() {
      updateSW(true)
    },
  })
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => updateSW(), { timeout: 2000 })
  } else {
    setTimeout(() => updateSW(), 500)
  }
}

function LoadingRoot() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
      }}
    >
      Loading…
    </div>
  )
}

initI18n().then(() => {
  const root = createRoot(document.getElementById('root'))
  root.render(<LoadingRoot />)

  // Always prioritize the main app for first paint.
  // On first visit, the Guide is loaded lazily *after* the app is mounted (see App.jsx).
  import('./App.jsx').then(({ default: App }) => {
    root.render(
      <React.StrictMode>
        <App needsGuide={needsGuide} />
      </React.StrictMode>,
    )
    scheduleSW()
  })
})
