import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import GmailIntegration from './components/GmailIntegration'

console.log('[Email Magic: Delay Send] Gmail integration loaded')

// Initialize the Gmail integration component
const container = document.createElement('div')
container.id = 'email-magic-delay-send'
document.body.appendChild(container)

createRoot(container).render(
  <StrictMode>
    <GmailIntegration />
  </StrictMode>,
)