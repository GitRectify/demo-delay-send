// Gmail API and OAuth2 helpers

// Get OAuth2 token from Chrome Identity API
export async function getOAuthToken(interactive = true): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!chrome.identity) {
      reject('chrome.identity API not available');
      return;
    }
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError || !token || typeof token !== 'string') {
        reject(chrome.runtime.lastError || 'No token');
      } else {
        resolve(token as string);
      }
    });
  });
}

// Build a simple MIME message
export function buildMimeMessage({ to, cc, bcc, subject, body }: { to: string; cc?: string; bcc?: string; subject: string; body: string; }) {
  let headers = '';
  if (to) headers += `To: ${to}\r\n`;
  if (cc) headers += `Cc: ${cc}\r\n`;
  if (bcc) headers += `Bcc: ${bcc}\r\n`;
  headers += `Subject: ${subject}\r\n`;
  headers += 'Content-Type: text/html; charset=UTF-8\r\n';
  headers += '\r\n';
  return headers + body;
}

// Send email via Gmail API
export async function sendEmailViaGmailApi(emailData: { to: string; cc?: string; bcc?: string; subject: string; body: string; }) {
  const token = await getOAuthToken();
  const mime = buildMimeMessage(emailData);
  const base64Encoded = btoa(unescape(encodeURIComponent(mime))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: base64Encoded }),
  });
  if (!res.ok) {
    throw new Error('Failed to send email: ' + (await res.text()));
  }
  return res.json();
}