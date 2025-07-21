chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_DRAFT_CONTENT') {
        (async () => {
            try {
                const draftDetails = await getDraft(message.draftId);
                const { to, cc, bcc, subject, bodyHtml, bodyText, attachments, messageId } = parseDraftMessage(draftDetails.message);

                // Optionally fetch attachment data
                for (const att of attachments) {
                    att.data = await getAttachment(messageId, att.data);
                }

                // Move draft to SendLock label and not remove from Drafts
                await moveDraftToSendLock(messageId)

                sendResponse({ success: true, to, cc, bcc, subject, bodyHtml, bodyText, attachments });
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

    if (message.type === 'GET_LIST_DRAFT') {
        (async () => {
            try {
                const result = await listDrafts();
                sendResponse({ success: true, result });
            } catch (error) {
                sendResponse({ success: false, error: error.toString() });
            }
        })();
        return true; // Indicates async response
    }
});

async function listDrafts() {
    const oauthToken = await getOAuthToken();
    const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/drafts',
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${oauthToken}`,
                'Accept': 'application/json'
            }
        }
    );
    if (!response.ok) {
        throw new Error('Failed to list drafts: ' + response.statusText);
    }
    const data = await response.json();
    // Returns an array of draft objects (id, message)
    return data.drafts || [];
}

// What does listDrafts() return?
// [
//     {
//         "id": "r-1234567890abcdef",
//         "message": {
//             "id": "1234567890abcdef",
//             "threadId": "abcdef1234567890"
//         }
//     },
//     ...
// ]
// The message object here is partial—it usually only contains id and threadId, not the full message content, headers, or body.

// What does getDraft(draftId) return?
// {
//     "id": "r-1234567890abcdef",
//     "message": {
//         "id": "1234567890abcdef",
//         "threadId": "abcdef1234567890",
//         "labelIds": [...],
//         "snippet": "...",
//         "historyId": "...",
//         "internalDate": "...",
//         "payload": { ... }, // full MIME structure
//         "sizeEstimate": 1234
//     }
// }

// Use Case	                           listDrafts()	getDraft(draftId)
// Get draft IDs	                        ✅	        ❌
// Get threadId	                            ✅	        ✅
// Get subject, to, cc, body, etc.	        ❌	        ✅
// Get attachments	                        ❌	        ✅

async function getDraft(draftId) {
    const oauthToken = await getOAuthToken();
    const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/drafts/${draftId}`,
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${oauthToken}`,
                'Accept': 'application/json'
            }
        }
    );
    if (!response.ok) {
        throw new Error('Failed to get draft: ' + response.statusText);
    }
    const data = await response.json();
    // Returns the draft object with message and threadId
    return data;
}

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

// All Gmail users (both Google Workspace and personal @gmail.com accounts) can use this endpoint to send drafts immediately.
async function sendDraft(draftId: string) {
    const token = await getOAuthToken();
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts/send`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: draftId
        })
    });
    if (!res.ok) throw new Error('Failed to send draft: ' + (await res.text()));
    return await res.json();
}

// The sendAt parameter for scheduling emails via the Gmail API is only available for Google Workspace (paid business/education) accounts.
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

// Create a label if it doesn't exist
async function ensureSendLockLabel(): Promise<string> {
    const token = await getOAuthToken();
    // Get all labels
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch labels: ' + (await res.text()));
    const data = await res.json();
    const existing = data.labels.find((l: any) => l.name === 'SendLock');
    if (existing) return existing.id;
    // Create label
    const createRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: 'SendLock',
            labelListVisibility: 'labelShow',
            messageListVisibility: 'show',
        }),
    });
    if (!createRes.ok) throw new Error('Failed to create SendLock label: ' + (await createRes.text()));
    const label = await createRes.json();
    return label.id;
}

// Move a draft to SendLock label and not remove from Drafts
async function moveDraftToSendLock(messageId: string): Promise<void> {
    const token = await getOAuthToken();
    const sendLockLabelId = await ensureSendLockLabel();
    // Remove DRAFT label, add SendLock
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            addLabelIds: [sendLockLabelId],
            // removeLabelIds: ['DRAFT'],
        }),
    });
    if (!res.ok) throw new Error('Failed to move draft to SendLock: ' + (await res.text()));
}