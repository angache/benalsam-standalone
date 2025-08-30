import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initPerformanceTracking } from './utils/performance'
import { initializeSentry } from './config/sentry'

// Initialize Sentry
initializeSentry();

// Initialize performance tracking
initPerformanceTracking();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
