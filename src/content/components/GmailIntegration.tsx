import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { getComposeWindows, getSendButton, extractEmailData, observeComposeWindows } from '../utils/gmailSelectors';
import { sendEmailViaGmailApi } from '../utils/gmailApi';

const DELAY_MS = 30000; // 10 seconds default delay

function DelayBanner({ onCancel, secondsLeft }: { onCancel: () => void; secondsLeft: number }) {
  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, background: '#fffbe6', border: '1px solid #f5c518', padding: 16, zIndex: 9999, borderRadius: 8 }}>
      <b>Email will be sent in {secondsLeft} seconds.</b>
      <button style={{ marginLeft: 16 }} onClick={onCancel}>Cancel</button>
    </div>
  );
}

const GmailIntegration: React.FC = () => {
  const [pending, setPending] = useState<null | { emailData: any; timer: any; secondsLeft: number }>(null);

  useEffect(() => {
    // Observe compose windows and attach send interceptors
    const seen = new WeakSet();
    const attachToCompose = (compose: HTMLElement) => {
      if (seen.has(compose)) return;
      seen.add(compose);
      const sendBtn = getSendButton(compose);
      if (sendBtn) {
        sendBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          handleInterceptSend(compose);
        }, true);
      }
      // Keyboard shortcut (Ctrl+Enter)
      compose.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          handleInterceptSend(compose);
        }
      }, true);
    };
    const observer = observeComposeWindows(attachToCompose);
    return () => observer.disconnect();
    // eslint-disable-next-line
  }, []);

  // Intercept send: hold email, show UI, send after delay
  const handleInterceptSend = (compose: HTMLElement) => {
    if (pending) return; // Only one at a time
    const emailData = extractEmailData(compose);
    let secondsLeft = DELAY_MS / 1000;
    const timer = setInterval(() => {
      secondsLeft--;
      setPending((p) => p ? { ...p, secondsLeft } : null);
      if (secondsLeft <= 0) {
        clearInterval(timer);
        setPending(null);
        sendEmailViaGmailApi(emailData).catch(alert);
      }
    }, 1000);
    setPending({ emailData, timer, secondsLeft });
  };

  // Cancel send
  const handleCancel = () => {
    if (pending) {
      clearInterval(pending.timer);
      setPending(null);
    }
  };

  return pending ? <DelayBanner onCancel={handleCancel} secondsLeft={pending.secondsLeft} /> : null;
};

// Inject the React component into Gmail
(function inject() {
  const id = 'sendlock-root';
  if (document.getElementById(id)) return;
  const div = document.createElement('div');
  div.id = id;
  document.body.appendChild(div);
  createRoot(div).render(<GmailIntegration />);
})();

export default GmailIntegration;
