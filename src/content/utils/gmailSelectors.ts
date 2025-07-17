// Gmail selectors for different UI elements
export const GmailSelectors = {
  // Send button selectors (comprehensive)
  sendButton: [
    '[aria-label="Send"]',
    '[data-tooltip="Send"]',
    'div[role="button"][aria-label*="Send"]',
    'button[aria-label*="Send"]',
    '[data-tooltip*="Send"]',
    'div[role="button"][data-tooltip*="Send"]',
    // Gmail's specific send button classes
    // '.T-I.T-I-KE.L3',
    // '.T-I.T-I-KE',
    // More specific selectors
    'div[role="button"][tabindex="0"][aria-label*="Send"]',
    'div[role="button"][tabindex="0"][data-tooltip*="Send"]',
    'div[role="button"][data-tooltip^="Send"]',
    'div[role="button"][aria-label^="Send"]',
    'div[role="button"][data-tooltip^="Send ‪"]',
    'div[role="button"]:has(svg)'
  ],

  // Compose window selectors (broader coverage)
  composeWindow: [
    '[role="dialog"]',
    '.Am.Al.editable',
    '.aH9',
    '.aH9.aH8',
    // Gmail's compose container
    'div[role="dialog"][aria-label*="Compose"]',
    'div[role="dialog"][aria-label*="New Message"]',
    'div[role="dialog"][aria-label*="Reply"]',
    'div[role="dialog"][aria-label*="Forward"]',
    '.nH.Hd',
    'td.I5',
    '.Ap', // fallback legacy
    '.AD',        // Full-size compose window
    '.a3s',       // Inline reply area (body container)
    '.adn'        // Inline reply wrapper
  ],

  // Recipient input selectors (expanded)
  recipientInput: [
    'textarea[name="to"]',
    'input[name="to"]',
    'input[aria-label*="To"]',
    'input[aria-label*="recipient"]',
    'input[aria-label*="Recipients"]',
    '.vO input'
  ],

  // Subject input selectors (more robust)
  subjectInput: [
    'input[aria-label*="subject"]',
    'input[name="subjectbox"]',
    'input[name="subject"]',
    '.aoT',
    '.aoT input',
    // Gmail's subject field
    'input[aria-label*="Subject"]'
  ],

  // Email content selectors (unified and fallback)
  emailContent: [
    '[contenteditable="true"]',
    '.Am.Al.editable',
    '.Am.Al',
    // Gmail's content area
    'div[role="textbox"]',
    'div[contenteditable="true"][aria-label*="Message Body"]',
    'div.editable.LW-avf.tS-tW'
  ],

  // Undo send button (if available)
  undoSend: [
    '[aria-label*="Undo"]',
    '[data-tooltip*="Undo"]',
    '.bAq',
    'span:contains("Undo")',
    'button:contains("Undo")'
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

  getAllRecipients(composeWindow: HTMLElement): string[] {
    const recipients: string[] = [];

    // 1. New Gmail UI chips (2024+)
    // <div role="option" class="afV"> ... <div class="akl" translate="no">email</div>
    const newChips = composeWindow.querySelectorAll('div[role="option"].afV');
    newChips.forEach(chip => {
      const emailDiv = chip.querySelector('.akl[translate="no"]');
      if (emailDiv && emailDiv.textContent) {
        recipients.push(emailDiv.textContent.trim());
      }
    });

    // 2. Classic Gmail chips
    // <span class="vN" role="listitem"> ... <span class="g2">email</span>
    const classicChips = composeWindow.querySelectorAll('.vN[role="listitem"]');
    classicChips.forEach(chip => {
      const emailSpan = chip.querySelector('.g2');
      if (emailSpan && emailSpan.textContent) {
        recipients.push(emailSpan.textContent.trim());
      } else if (chip.textContent) {
        recipients.push(chip.textContent.trim());
      }
    });

    // 3. Chips with role="listitem" (future-proof, any class)
    const roleListitemChips = composeWindow.querySelectorAll('[role="listitem"]');
    roleListitemChips.forEach(chip => {
      // Avoid duplicates from classicChips
      if (!chip.classList.contains('vN')) {
        if (chip.textContent) recipients.push(chip.textContent.trim());
      }
    });

    // 4. Chips with role="option" (future-proof, any class)
    const roleOptionChips = composeWindow.querySelectorAll('[role="option"]');
    roleOptionChips.forEach(chip => {
      // Avoid duplicates from newChips
      if (!chip.classList.contains('afV')) {
        if (chip.textContent) recipients.push(chip.textContent.trim());
      }
    });

    // 5. Any element with data-hovercard-id (Gmail sometimes uses this for chips)
    const hovercardChips = composeWindow.querySelectorAll('[data-hovercard-id]');
    hovercardChips.forEach(chip => {
    const email = chip.getAttribute('data-hovercard-id');
    if (email && email.includes('@')) { // Only real emails
      recipients.push(email.trim());
    }
  });

    // 6. Any visible "To" input/textarea (for addresses being typed but not yet chipped)
    for (const sel of GmailSelectors.recipientInput) {
      const input = composeWindow.querySelector(sel) as HTMLInputElement | null;
      if (input && input.value) {
        input.value.split(/[,;]/).forEach(addr => {
          const trimmed = addr.trim();
          if (trimmed) recipients.push(trimmed);
        });
      }
    }

    // 7. Fallback: any element with class "akl" and translate="no" (in case Gmail changes chip container)
    const aklChips = composeWindow.querySelectorAll('.akl[translate="no"]');
    aklChips.forEach(el => {
      if (el.textContent) recipients.push(el.textContent.trim());
    });

    // Remove duplicates and empty strings
    return Array.from(new Set(recipients)).filter(Boolean).filter(recipient => recipient.includes('@'));
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
