// Gmail selectors for different UI elements
export const GmailSelectors = {
  // Send button selectors (multiple variations)
  sendButton: [
    '[aria-label="Send"]',
    '[data-tooltip="Send"]',
    'div[role="button"][aria-label*="Send"]',
    'button[aria-label*="Send"]',
    '[data-tooltip*="Send"]',
    'div[role="button"][data-tooltip*="Send"]',
    // Gmail's specific send button classes
    '.T-I.T-I-KE.L3',
    '.T-I.T-I-KE',
    // More specific selectors
    'div[role="button"][tabindex="0"][aria-label*="Send"]',
    'div[role="button"][tabindex="0"][data-tooltip*="Send"]'
  ],

  // Compose window selectors
  composeWindow: [
    '[role="dialog"]',
    '.Am.Al.editable',
    '.aH9',
    '.aH9.aH8',
    // Gmail's compose container
    'div[role="dialog"][aria-label*="Compose"]',
    'div[role="dialog"][aria-label*="New Message"]'
  ],

  // Recipient input selectors
  recipientInput: [
    'input[aria-label*="recipient"]',
    'input[aria-label*="To"]',
    'input[name="to"]',
    '.vO',
    '.vO input',
    // Gmail's recipient field
    'input[aria-label*="Recipients"]'
  ],

  // Subject input selectors
  subjectInput: [
    'input[aria-label*="subject"]',
    'input[name="subjectbox"]',
    'input[name="subject"]',
    '.aoT',
    '.aoT input',
    // Gmail's subject field
    'input[aria-label*="Subject"]'
  ],

  // Email content selectors
  emailContent: [
    '[contenteditable="true"]',
    '.Am.Al.editable',
    '.Am.Al',
    // Gmail's content area
    'div[role="textbox"]',
    'div[contenteditable="true"][aria-label*="Message Body"]'
  ],

  // Undo send button (if available)
  undoSend: [
    '[aria-label*="Undo"]',
    '[data-tooltip*="Undo"]',
    '.bAq'
  ]
}

// Helper function to find elements using multiple selectors
export function findElement(selectors: string[], context: Document | Element = document): Element | null {
  for (const selector of selectors) {
    const element = context.querySelector(selector)
    if (element) {
      return element
    }
  }
  return null
}

// Helper function to find all elements using multiple selectors
export function findAllElements(selectors: string[], context: Document | Element = document): Element[] {
  const elements: Element[] = []
  for (const selector of selectors) {
    const found = context.querySelectorAll(selector)
    elements.push(...Array.from(found))
  }
  return elements
}

// Helper function to check if an element matches any of the selectors
export function matchesAnySelector(element: Element, selectors: string[]): boolean {
  return selectors.some(selector => element.matches(selector))
}

// Gmail-specific utility functions
export const GmailUtils = {
  // Check if we're in a Gmail compose window
  isInComposeWindow(): boolean {
    return findElement(GmailSelectors.composeWindow) !== null
  },

  // Get the current compose window
  getComposeWindow(): Element | null {
    return findElement(GmailSelectors.composeWindow)
  },

  // Get recipient information
  getRecipient(): string {
    const input = findElement(GmailSelectors.recipientInput)
    return input ? (input as HTMLInputElement).value : ''
  },

  // Get subject information
  getSubject(): string {
    const input = findElement(GmailSelectors.subjectInput)
    return input ? (input as HTMLInputElement).value : ''
  },

  // Get email content
  getEmailContent(): string {
    const content = findElement(GmailSelectors.emailContent)
    if (content) {
      return content.textContent || (content as HTMLElement).innerText || ''
    }
    return ''
  },

  // Check if undo send is available
  hasUndoSend(): boolean {
    return findElement(GmailSelectors.undoSend) !== null
  }
}