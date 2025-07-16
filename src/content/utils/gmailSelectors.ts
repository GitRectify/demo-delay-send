// Utility functions for Gmail DOM interaction

// Returns all open compose windows
export function getComposeWindows(): HTMLElement[] {
  return Array.from(document.querySelectorAll('div[role="dialog"]')) as HTMLElement[];
}

// Returns the send button within a compose window
export function getSendButton(composeWindow: HTMLElement): HTMLButtonElement | null {
  return composeWindow.querySelector('div[role="button"][data-tooltip^="Send"]') as HTMLButtonElement | null;
}

// Returns the subject input within a compose window
export function getSubjectInput(composeWindow: HTMLElement): HTMLInputElement | null {
  return composeWindow.querySelector('input[name="subjectbox"]') as HTMLInputElement | null;
}

// Returns the body contenteditable div within a compose window
export function getBodyDiv(composeWindow: HTMLElement): HTMLElement | null {
  return composeWindow.querySelector('div[aria-label="Message Body"]') as HTMLElement | null;
}

// Returns the recipient input(s) within a compose window
export function getRecipientInputs(composeWindow: HTMLElement): HTMLInputElement[] {
  return Array.from(composeWindow.querySelectorAll('textarea[name="to"], textarea[name="cc"], textarea[name="bcc"]')) as HTMLInputElement[];
}

// Extracts email data from a compose window
export function extractEmailData(composeWindow: HTMLElement) {
  const subject = getSubjectInput(composeWindow)?.value || '';
  const body = getBodyDiv(composeWindow)?.innerHTML || '';
  const to = (composeWindow.querySelector('textarea[name="to"]') as HTMLInputElement)?.value || '';
  const cc = (composeWindow.querySelector('textarea[name="cc"]') as HTMLInputElement)?.value || '';
  const bcc = (composeWindow.querySelector('textarea[name="bcc"]') as HTMLInputElement)?.value || '';
  return { to, cc, bcc, subject, body };
}

// Observe for new compose windows
export function observeComposeWindows(callback: (composeWindow: HTMLElement) => void) {
  const observer = new MutationObserver(() => {
    getComposeWindows().forEach(callback);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  // Initial call
  getComposeWindows().forEach(callback);
  return observer;
}