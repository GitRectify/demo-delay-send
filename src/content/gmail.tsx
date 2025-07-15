import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import GmailIntegration from './components/GmailIntegration'
import "./Content.css"

console.log('[Email Magic: SendLock] Gmail integration loaded')

// Initialize the Gmail integration component
const container = document.createElement('div')
container.id = 'email-magic-delay-send'
document.body.appendChild(container)

createRoot(container).render(
  <StrictMode>
    <GmailIntegration />
  </StrictMode>,
)