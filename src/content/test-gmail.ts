// Test script for Gmail integration
// This can be run in the browser console on mail.google.com to test selectors

import { GmailSelectors, findElement, findAllElements, matchesAnySelector, GmailUtils } from './utils/gmailSelectors'

console.log('[Email Magic: SendLock] Running Gmail integration tests...')

// Test 1: Check if we can find send buttons
const sendButtons = findAllElements(GmailSelectors.sendButton)
console.log(`Found ${sendButtons.length} send buttons:`, sendButtons)

// Test 2: Check if we can find compose window
const composeWindow = findElement(GmailSelectors.composeWindow)
console.log('Compose window found:', !!composeWindow)

// Test 3: Test email data extraction
if (composeWindow) {
  const recipient = GmailUtils.getRecipient()
  const subject = GmailUtils.getSubject()
  const content = GmailUtils.getEmailContent()
  
  console.log('Email data extraction test:')
  console.log('- Recipient:', recipient)
  console.log('- Subject:', subject)
  console.log('- Content length:', content.length)
}

// Test 4: Check for undo send functionality
const hasUndoSend = GmailUtils.hasUndoSend()
console.log('Undo send available:', hasUndoSend)

// Test 5: Test selector matching
const testElement = document.querySelector('[aria-label="Send"]')
if (testElement) {
  const matches = matchesAnySelector(testElement, GmailSelectors.sendButton)
  console.log('Test element matches send button selector:', matches)
}

console.log('[Email Magic: SendLock] Gmail integration tests completed!') 