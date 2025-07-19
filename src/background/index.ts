chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'IMPORT_DRAFT_CONTENT') {
        (async () => {
            try {
                const draftId = await getLatestDraftId();
                const message = await getDraftContent(draftId);
                const { to, cc, bcc, subject, bodyHtml, bodyText, attachments, messageId } = parseDraftMessage(message);

                // Optionally fetch attachment data
                for (const att of attachments) {
                    att.data = await getAttachment(messageId, att.data);
                }

                sendResponse({ success: true, to, cc, bcc, subject, bodyHtml, bodyText, attachments });
            } catch (error) {
                sendResponse({ success: false, error: error.toString() });
            }
        })();
        return true; // Indicates async response
    }

    if (message.type === 'GET_LATEST_DRAFT_ID') {
        (async () => {
            try {
                const draftId = await getLatestDraftId();
                sendResponse({ success: true, draftId });
            } catch (error) {
                sendResponse({ success: false, error: error.toString() });
            }
        })();
        return true; // Indicates async response
    }

    if (message.type === 'SEND_DRAFT') {
        (async () => {
            try {
                const result = await sendDraft(message.draftId);
                sendResponse({ success: true, result });
            } catch (error) {
                sendResponse({ success: false, error: error.toString() });
            }
        })();
        return true; // Indicates async response
    }
});

async function getLatestDraftId() {
    const token = await getOAuthToken();
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts?maxResults=1', {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to list drafts: ' + (await res.text()));
    const data = await res.json();
    if (!data.drafts || !data.drafts.length) throw new Error('No drafts found');
    return data.drafts[0].id;
}

async function getDraftContent(draftId: string) {
    const token = await getOAuthToken();
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts/${draftId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch draft: ' + (await res.text()));
    const draft = await res.json();
    return draft.message; // This contains the full email content in MIME format
}

function parseDraftMessage(message: any) {
    // --- Headers ---
    const headers = message.payload.headers;
    const getHeader = (name: string) => {
        const h = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
        return h ? h.value : '';
    };
    const to = getHeader('To');
    const cc = getHeader('Cc');
    const bcc = getHeader('Bcc');
    const subject = getHeader('Subject');

    // --- Body (HTML and plain text) ---
    let bodyHtml = '';
    let bodyText = '';
    let attachments: { filename: string, mimeType: string, data: string }[] = [];

    function walkParts(parts: any[]) {
        for (const part of parts) {
            if (part.parts) {
                walkParts(part.parts);
            } else if (part.mimeType === 'text/html') {
                bodyHtml = decodeBase64Url(part.body.data);
            } else if (part.mimeType === 'text/plain') {
                bodyText = decodeBase64Url(part.body.data);
            } else if (part.filename && part.body && part.body.attachmentId) {
                // Attachment
                attachments.push({
                    filename: part.filename,
                    mimeType: part.mimeType,
                    data: part.body.attachmentId, // You need to fetch the actual data separately (see below)
                });
            }
        }
    }

    if (message.payload.parts) {
        walkParts(message.payload.parts);
    } else if (message.payload.body && message.payload.body.data) {
        // Simple message (no parts)
        if (message.payload.mimeType === 'text/html') {
            bodyHtml = decodeBase64Url(message.payload.body.data);
        } else {
            bodyText = decodeBase64Url(message.payload.body.data);
        }
    }

    return { to, cc, bcc, subject, bodyHtml, bodyText, attachments, messageId: message.id };
}

function decodeBase64Url(data: string) {
    data = data.replace(/-/g, '+').replace(/_/g, '/');
    while (data.length % 4) data += '=';
    return atob(data);
}

async function getAttachment(messageId: string, attachmentId: string) {
    const token = await getOAuthToken();
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch attachment: ' + (await res.text()));
    const data = await res.json();
    return decodeBase64Url(data.data); // This is the raw file content (base64-decoded)
}

async function sendDraft(draftId: string) {
    const token = await getOAuthToken();
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts/${draftId}/send`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    if (!res.ok) throw new Error('Failed to send draft: ' + (await res.text()));
    return await res.json();
}

async function scheduleDraft(draftId: string, scheduledTime: number) {
    const token = await getOAuthToken();
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts/${draftId}/send`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sendAt: scheduledTime }),
    });
    if (!res.ok) throw new Error('Failed to schedule draft: ' + (await res.text()));
    return await res.json();
}

async function getOAuthToken(interactive = true): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!chrome.identity) {
            reject('chrome.identity API not available');
            return;
        }
        chrome.identity.getAuthToken({ interactive }, (token) => {
            if (chrome.runtime.lastError || !token || typeof token !== 'string') {
                reject(chrome.runtime.lastError?.message || 'No token');
            } else {
                resolve(token);
            }
        });
    });
}