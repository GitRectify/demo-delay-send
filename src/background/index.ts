// src/background/index.ts

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SCHEDULE_EMAIL') {
        scheduleEmailViaGmailApi(message.emailData, message.scheduledTime)
            .then((result) => sendResponse({ success: true, result }))
            .catch((error) => sendResponse({ success: false, error: error.toString() }));
        return true; // Indicates async response
    }
});

async function getOAuthToken(interactive = true) {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive }, (token) => {
            if (chrome.runtime.lastError || !token || typeof token !== 'string') {
                reject(chrome.runtime.lastError || 'No token');
            } else {
                resolve(token);
            }
        });
    });
}

function buildMimeMessage({ to, cc, bcc, subject, body }) {
    let headers = '';
    if (to) headers += `To: ${to}\r\n`;
    if (cc) headers += `Cc: ${cc}\r\n`;
    if (bcc) headers += `Bcc: ${bcc}\r\n`;
    headers += `Subject: ${subject}\r\n`;
    headers += 'Content-Type: text/html; charset=UTF-8\r\n';
    headers += '\r\n';
    return headers + body;
}

// Schedules an email using Gmail API (requires 'scheduledTime' in seconds since epoch)
async function scheduleEmailViaGmailApi(emailData, scheduledTime) {
    const token = await getOAuthToken();
    const mime = buildMimeMessage(emailData);
    const base64Encoded = btoa(unescape(encodeURIComponent(mime)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    // Create the draft
    const draftRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: { raw: base64Encoded } }),
    });
    if (!draftRes.ok) throw new Error('Failed to create draft: ' + (await draftRes.text()));
    const draft = await draftRes.json();

    // Schedule the draft
    const sendRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts/${draft.id}/send`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            sendAt: scheduledTime, // seconds since epoch
            // Optionally, you may need to use 'scheduledTime' or 'scheduleTime' depending on API version
        }),
    });
    if (!sendRes.ok) throw new Error('Failed to schedule email: ' + (await sendRes.text()));
    return sendRes.json();
}