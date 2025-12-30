import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import { TimerProvider } from './contexts/TimerContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WorkspaceProvider>
      <TimerProvider>
        <App />
      </TimerProvider>
    </WorkspaceProvider>
  </StrictMode>,
)
