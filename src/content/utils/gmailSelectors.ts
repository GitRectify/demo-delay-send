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
    'div[role="button"][tabindex="0"][aria-label*="Send"]',
    'div[role="button"][tabindex="0"][data-tooltip*="Send"]',
    'div[role="button"][data-tooltip^="Send"]',
    'div[role="button"][aria-label^="Send"]',
    'div[role="button"][data-tooltip^="Send ‪"]',
    'div[role="button"]:has(svg)'
  ],

  saveAndCloseButton: [
    // Most common: <img ... aria-label="Save & close" ...>
    'img[aria-label="Save & close"]',
    'img[alt="Save & close"]',
    'img[data-tooltip*="Save & close"]',
    // Sometimes a <div> or <button> with aria-label
    'div[aria-label="Save & close"]',
    'button[aria-label="Save & close"]',
    // Sometimes just "Close" (older Gmail or popout)
    'img[aria-label="Close"]',
    'img[alt="Close"]',
    'div[aria-label="Close"]',
    'button[aria-label="Close"]',
    // Sometimes with data-tooltip
    'img[data-tooltip*="Save & close"]',
    'div[data-tooltip*="Save & close"]',
    'button[data-tooltip*="Save & close"]',
    'img[data-tooltip*="Close"]',
    'div[data-tooltip*="Close"]',
    'button[data-tooltip*="Close"]',
    // Fallback: class "Ha" (Gmail's close/save button)
    'img.Ha',
    'div.Ha',
    'button.Ha',
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

  getAllRecipientsByField(composeWindow: HTMLElement, field: 'to' | 'cc' | 'bcc'): string[] {
    const recipients: string[] = [];

    // 1. Chips with data-hovercard-id (most reliable)
    const chipSelector = `[data-hovercard-id][email-field="${field}"]`;
    const chips = composeWindow.querySelectorAll(chipSelector);
    chips.forEach(chip => {
      const email = chip.getAttribute('data-hovercard-id');
      if (email && email.includes('@')) recipients.push(email.trim());
    });

    // 2. New Gmail UI chips (2024+)
    // <div role="option" class="afV" email-field="to|cc|bcc"> ... <div class="akl" translate="no">email</div>
    const newChips = composeWindow.querySelectorAll(`div[role="option"].afV[email-field="${field}"]`);
    newChips.forEach(chip => {
      const emailDiv = chip.querySelector('.akl[translate="no"]');
      if (emailDiv && emailDiv.textContent) {
        const val = emailDiv.textContent.trim();
        if (val.includes('@') && !recipients.includes(val)) recipients.push(val);
      }
    });

    // 3. Classic Gmail chips
    // <span class="vN" role="listitem" email-field="to|cc|bcc"> ... <span class="g2">email</span>
    const classicChips = composeWindow.querySelectorAll(`.vN[role="listitem"][email-field="${field}"]`);
    classicChips.forEach(chip => {
      const emailSpan = chip.querySelector('.g2');
      if (emailSpan && emailSpan.textContent) {
        const val = emailSpan.textContent.trim();
        if (val.includes('@') && !recipients.includes(val)) recipients.push(val);
      } else if (chip.textContent) {
        const val = chip.textContent.trim();
        if (val.includes('@') && !recipients.includes(val)) recipients.push(val);
      }
    });

    // 4. Fallback: any element with class "akl" and translate="no" (in case Gmail changes chip container)
    const aklChips = composeWindow.querySelectorAll(`.akl[translate="no"][email-field="${field}"]`);
    aklChips.forEach(el => {
      const val = el.textContent?.trim() || '';
      if (val.includes('@') && !recipients.includes(val)) recipients.push(val);
    });

    // 5. In-progress typing (input/textarea)
    const inputSelectors = [
      `textarea[name="${field}"]`,
      `input[name="${field}"]`,
      `input[aria-label*="${field.charAt(0).toUpperCase() + field.slice(1)}"]`,
      `input[aria-label*="recipient"]`,
      `input[aria-label*="Recipients"]`,
      '.vO input'
    ];
    for (const sel of inputSelectors) {
      const input = composeWindow.querySelector(sel) as HTMLInputElement | null;
      if (input && input.value) {
        input.value.split(/[,;]/).forEach(addr => {
          const trimmed = addr.trim();
          if (trimmed && trimmed.includes('@') && !recipients.includes(trimmed)) recipients.push(trimmed);
        });
      }
    }

    // Remove duplicates and empty strings, and only keep valid emails
    return Array.from(new Set(recipients)).filter(email =>
      email && email.includes('@') && !/\s/.test(email)
    );
  },

  getRecipientsFromField(composeWindow: HTMLElement, field: 'To' | 'Cc' | 'Bcc'): string[] {
    const recipients: string[] = [];

    // Method 1: Find field container by aria-label
    const containerSelectors = [
      `div[aria-label="${field}"]`,
      `div[aria-label*="${field}"]`,
      `div[data-tooltip*="${field}"]`,
      `div[title*="${field}"]`,
      // Gmail sometimes uses different casing
      `div[aria-label="${field.toLowerCase()}"]`,
      `div[aria-label="${field.toUpperCase()}"]`,
    ];

    let container: Element | null = null;
    for (const sel of containerSelectors) {
      container = composeWindow.querySelector(sel);
      if (container) break;
    }

    // Method 2: Find by field name attribute (if container not found)
    if (!container) {
      const fieldInput = composeWindow.querySelector(`textarea[name="${field.toLowerCase()}"], input[name="${field.toLowerCase()}"]`);
      if (fieldInput) {
        container = fieldInput.closest('div') || fieldInput.parentElement;
      }
    }

    // Method 3: Find by Gmail's specific classes (fallback)
    if (!container) {
      const classSelectors = [
        '.vO', // Gmail's recipient field container
        '.aA5', // Alternative container class
        '.aA6', // Another possible container
      ];
      for (const sel of classSelectors) {
        container = composeWindow.querySelector(sel);
        if (container) break;
      }
    }

    // If no container found, search the entire compose window
    if (!container) {
      container = composeWindow;
    }

    // Extract recipients from the container
    return GmailUtils.extractRecipientsFromContainer(container as HTMLElement);
  },

  extractRecipientsFromContainer(container: HTMLElement): string[] {
    const recipients: string[] = [];

    // Method 1: Chips with data-hovercard-id (most reliable)
    const hovercardChips = container.querySelectorAll('[data-hovercard-id]');
    hovercardChips.forEach(chip => {
      const email = chip.getAttribute('data-hovercard-id');
      if (email && email.includes('@')) recipients.push(email.trim());
    });

    // Method 2: New Gmail UI chips (2024+)
    const newChips = container.querySelectorAll('div[role="option"].afV');
    newChips.forEach(chip => {
      const emailDiv = chip.querySelector('.akl[translate="no"]');
      if (emailDiv && emailDiv.textContent) {
        const val = emailDiv.textContent.trim();
        if (val.includes('@') && !recipients.includes(val)) recipients.push(val);
      }
    });

    // Method 3: Classic Gmail chips
    const classicChips = container.querySelectorAll('.vN[role="listitem"]');
    classicChips.forEach(chip => {
      const emailSpan = chip.querySelector('.g2');
      if (emailSpan && emailSpan.textContent) {
        const val = emailSpan.textContent.trim();
        if (val.includes('@') && !recipients.includes(val)) recipients.push(val);
      } else if (chip.textContent) {
        const val = chip.textContent.trim();
        if (val.includes('@') && !recipients.includes(val)) recipients.push(val);
      }
    });

    // Method 4: Any role="listitem" chips (future-proof)
    const roleListitemChips = container.querySelectorAll('[role="listitem"]');
    roleListitemChips.forEach(chip => {
      if (!chip.classList.contains('vN')) {
        const val = chip.textContent?.trim() || '';
        if (val.includes('@') && !recipients.includes(val)) recipients.push(val);
      }
    });

    // Method 5: Any role="option" chips (future-proof)
    const roleOptionChips = container.querySelectorAll('[role="option"]');
    roleOptionChips.forEach(chip => {
      if (!chip.classList.contains('afV')) {
        const val = chip.textContent?.trim() || '';
        if (val.includes('@') && !recipients.includes(val)) recipients.push(val);
      }
    });

    // Method 6: Any element with class "akl" and translate="no"
    const aklChips = container.querySelectorAll('.akl[translate="no"]');
    aklChips.forEach(el => {
      const val = el.textContent?.trim() || '';
      if (val.includes('@') && !recipients.includes(val)) recipients.push(val);
    });

    // Method 7: Any element with class "g2" (classic Gmail email class)
    const g2Chips = container.querySelectorAll('.g2');
    g2Chips.forEach(el => {
      const val = el.textContent?.trim() || '';
      if (val.includes('@') && !recipients.includes(val)) recipients.push(val);
    });

    // Method 8: Input/textarea values (for addresses being typed)
    const inputSelectors = [
      'textarea[name="to"]',
      'textarea[name="cc"]',
      'textarea[name="bcc"]',
      'input[name="to"]',
      'input[name="cc"]',
      'input[name="bcc"]',
      'input[aria-label*="To"]',
      'input[aria-label*="Cc"]',
      'input[aria-label*="Bcc"]',
      'input[aria-label*="recipient"]',
      'input[aria-label*="Recipients"]',
      '.vO input',
      '.vO textarea',
    ];
    for (const sel of inputSelectors) {
      const input = container.querySelector(sel) as HTMLInputElement | null;
      if (input && input.value) {
        input.value.split(/[,;]/).forEach(addr => {
          const trimmed = addr.trim();
          if (trimmed && trimmed.includes('@') && !recipients.includes(trimmed)) recipients.push(trimmed);
        });
      }
    }

    // Method 9: Any visible input with email-like content
    const allInputs = container.querySelectorAll('input, textarea');
    allInputs.forEach(input => {
      const val = (input as HTMLInputElement).value;
      if (val && val.includes('@')) {
        val.split(/[,;]/).forEach(addr => {
          const trimmed = addr.trim();
          if (trimmed && trimmed.includes('@') && !recipients.includes(trimmed)) recipients.push(trimmed);
        });
      }
    });

    // Method 10: Text content that looks like emails (last resort)
    const allElements = container.querySelectorAll('*');
    allElements.forEach(el => {
      const text = el.textContent?.trim() || '';
      if (text.includes('@') && text.includes('.') && !el.querySelector('*')) {
        // Only leaf elements (no children) to avoid duplicates
        if (!recipients.includes(text)) recipients.push(text);
      }
    });

    // Remove duplicates, empty strings, and invalid emails
    return Array.from(new Set(recipients)).filter(email =>
      email &&
      email.includes('@') &&
      email.includes('.') &&
      !/\s/.test(email) &&
      email.length > 5 // Basic email validation
    );
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
  },

  findSaveAndCloseButton(composeWindow: HTMLElement): HTMLElement | null {
    for (const sel of GmailSelectors.saveAndCloseButton) {
      const btn = composeWindow.querySelector(sel);
      if (btn) return btn as HTMLElement;
    }
    return null;
  }

}
