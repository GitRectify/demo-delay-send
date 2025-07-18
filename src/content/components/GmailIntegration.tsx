import React, { useEffect, useState, useRef } from "react";
import { Shield, Clock, X } from "lucide-react";
import {
  GmailSelectors,
  findElement,
  findAllElements,
  matchesAnySelector,
  GmailUtils,
} from "../utils/gmailSelectors";

interface DelayingEmail {
  id: string;
  composeWindow: HTMLElement
  recipient: string;
  subject: string;
  delayTime: number;
  remainingTime: number;
  startTime: number;
  originalButton: HTMLElement;
  noopClickHandler?: (e: Event) => void;
  delayClickHandler?: (e: Event) => void;
}

const GmailIntegration: React.FC = () => {
  const [delayingEmails, setDelayingEmails] = useState<DelayingEmail[]>([]);
  const [delayDuration, setDelayDuration] = useState(30); // 30 seconds default
  const observerRef = useRef<MutationObserver | null>(null);

  // Initialize Gmail integration
  useEffect(() => {
    // Observe compose windows and attach send interceptors
    console.log("[Email Magic: SendLock] Initializing Gmail integration");

    // Load settings from storage
    chrome.storage.local.get(["delayDuration"], (result) => {
      if (result.delayDuration) setDelayDuration(result.delayDuration);
    });

    chrome.storage.sync.get(["delayingEmails"], (result) => {
      if (result.delayingEmails) setDelayingEmails(result.delayingEmails);
    });

    observerRef.current = observeSendButtons();

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Helper: check if a button is inside a compose window
  const getParentComposeWindow = (button: HTMLElement) => {
    let el: HTMLElement | null = button;
    while (el) {
      if (
        el.matches &&
        GmailSelectors.composeWindow.some((sel) => el.matches(sel))
      ) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  };

  const observeSendButtons = (): MutationObserver => {
    const observer = new MutationObserver(() => {
      GmailSelectors.sendButton.forEach((selector) => {
        document.querySelectorAll(selector).forEach((button) => {
          if ( button instanceof HTMLElement && !button.dataset.emailMagicHandled ) {
            const parentCompose = getParentComposeWindow(button)
            if (parentCompose){
              button.dataset.emailMagicHandled = "true";
              attachDelayHandler(button);
            }
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return observer;
  };

  const attachDelayHandler = (sendButton: HTMLElement) => {
    console.log("[Email Magic: SendLock]: This is in attachDelayHandeler")

    const handler = async (e: Event) => {
      e.preventDefault();
      e.stopPropagation();

      const target = e.target as HTMLElement
      const composeWindow = getParentComposeWindow(target);
      // const replyBox = document.querySelector('div[aria-label="Message Body"]');
      if (composeWindow instanceof HTMLElement) {
        composeWindow.blur();

        const escEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          keyCode: 27,
          which: 27,
          bubbles: true,
          cancelable: true
        });

        if(!composeWindow.dispatchEvent(escEvent)){
          chrome.runtime.sendMessage({ type: 'IMPORT_DRAFT_CONTENT' }, (response) => {
            if (response && response.success) {
              // Use response.to, response.cc, response.subject, etc.
              console.log(response.bodyText);
            } else {
              alert('Failed to import draft: ' + (response?.error || 'Unknown error'));
            }
          });
          console.log("[Email Magic] Escape dispatched to compose window.");
        }
      }

      // 2. Wait for Gmail to save the draft (adjust time as needed)
      // setTimeout(() => {
      //   // 3. Now use the Gmail API to list drafts and get the latest one
      //   chrome.runtime.sendMessage({ type: 'GET_LATEST_DRAFT' }, (response) => {
      //     if (response && response.success) {
      //       // 4. Schedule/send the draft via API
      //       chrome.runtime.sendMessage({
      //         type: 'SCHEDULE_DRAFT',
      //         draftId: response.draftId,
      //         scheduledTime: Math.floor(Date.now() / 1000) + delayDuration // 1 hour from now
      //       }, (scheduleResponse) => {
      //         if (scheduleResponse && scheduleResponse.success) {
      //           alert('Draft scheduled!');
      //         } else {
      //           alert('Failed to schedule draft: ' + (scheduleResponse?.error || 'Unknown error'));
      //         }
      //       });
      //     } else {
      //       alert('Failed to get latest draft: ' + (response?.error || 'Unknown error'));
      //     }
      //   });
      // }, 2000); // Wait 2 seconds for Gmail to save the draft
    }

    const delayHandler = (e: Event) => {
      const target = e.target as HTMLElement
      const parentCompose = getParentComposeWindow(target);
      console.log("===Compose===", parentCompose)
      const emailInfo = getEmailInfo(parentCompose);
      if (emailInfo) {
        // Only handle keyboard events if they match expected keys
        if (e.type === "keydown") {
          const ke = e as KeyboardEvent;
          const isValidKey =
            ke.key === "Enter" ||
            ke.key === " " || // Space
            ke.key === "Spacebar" || // Legacy browsers
            (ke.key === "Enter" && (ke.ctrlKey || ke.metaKey));

          if (!isValidKey) return; // Don't handle other keys
        }

        e.preventDefault();
        e.stopPropagation();

        // Remove our custom click handler
        sendButton.removeEventListener("click", delayHandler, true);
        sendButton.removeEventListener("keydown", delayHandler, true);

        // Replace with empty handler to neutralize button
        const noopHandler = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
        };

        sendButton.addEventListener("click", noopHandler, true);
        sendButton.addEventListener("keydown", noopHandler, true);
        (sendButton as HTMLElement).innerText = "Delaying...";

        addDelayEmail(emailInfo, sendButton, noopHandler, delayHandler);
      }
    };

    // Mouse click
    sendButton.addEventListener("click", handler, true);
    // Keyboard: Enter, Space, Ctrl+Enter
    sendButton.addEventListener("keydown", handler, true);
  };

  const getEmailInfo = (parentCompose: HTMLElement) => {
    console.log("[Email Magic: SendLock]: This is in getEmailInfo")
    try {

      let recipients = GmailUtils.getRecipientsFromField(parentCompose, 'To')

      // Subject
      // let subject = GmailUtils.getSubject()
      let subject = '';
      for (const sel of GmailSelectors.subjectInput) {
        const el = parentCompose.querySelector(sel);
        if (el) {
          subject = (el as HTMLInputElement).value || el.textContent || '';
          if (subject && subject !== '') break;
        }
      }

      // Content (HTML)
      let content = '';
      for (const sel of GmailSelectors.emailContent) {
        const el = parentCompose.querySelector(sel);
        if (el) {
          content = (el as HTMLElement).innerHTML || el.textContent || '';
          if (content) break;
        }
      }
      console.log(`===recipient===${recipients}\n===subject===${subject}`)
      return { parentCompose, recipient: recipients.join(', '), subject, content };
    } catch (error) {
      console.error("[Email Magic: SendLock] Error extracting email data:", error);
      return null;
    }
  };

  const getEmailData = (composeWindow: HTMLElement) => {
    // To
    const toInput = composeWindow.querySelector('textarea[name="to"]') as HTMLInputElement | null;
    const to = toInput?.value || '';

    // CC
    const ccInput = composeWindow.querySelector('textarea[name="cc"]') as HTMLInputElement | null;
    const cc = ccInput?.value || '';

    // BCC
    const bccInput = composeWindow.querySelector('textarea[name="bcc"]') as HTMLInputElement | null;
    const bcc = bccInput?.value || '';

    // Subject
    const subjectInput = composeWindow.querySelector('input[name="subjectbox"]') as HTMLInputElement | null;
    const subject = subjectInput?.value || '';

    // Body (HTML)
    const bodyDiv = composeWindow.querySelector('[aria-label="Message Body"]') as HTMLElement | null;
    const body = bodyDiv?.innerHTML || '';

    return { to, cc, bcc, subject, body };
  };

  const addDelayEmail = ( emailInfo: any, originalButton: HTMLElement, noopHandler: EventListener, delayHandler: EventListener ) => {
    console.log("[Email Magic: SendLock]: This is in addDelayEmail")

    // // When user hits send, instead of simulating a click:
    // const emailData = getEmailData(emailInfo.composeWindow)
    // const scheduledTime = Math.floor(Date.now() / 1000) + delayDuration; // Unix timestamp

    // chrome.runtime.sendMessage(
    //   { type: 'SCHEDULE_EMAIL', emailData, scheduledTime },
    //   (response) => {
    //     if (response && response.success) {
    //       // Show premium toast/snackbar
    //       // showToast('Email scheduled for ' + new Date(scheduledTime * 1000).toLocaleTimeString());
    //       // Optionally, add to Outbox UI
    //     } else {
    //       // Show error toast
    //       // showToast('Failed to schedule email: ' + (response?.error || 'Unknown error'), 'error');
    //     }
    //   }
    // );

    const emailId = `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    const delayingEmail: DelayingEmail = {
      id: emailId,
      composeWindow: emailInfo.composeWindow,
      recipient: emailInfo.recipient,
      subject: emailInfo.subject,
      delayTime: delayDuration,
      remainingTime: delayDuration,
      startTime: startTime,
      originalButton: originalButton,
      noopClickHandler: noopHandler,
      delayClickHandler: delayHandler,
    };

    setDelayingEmails((prev) => [...prev, delayingEmail]);

    chrome.storage.sync.set({ delayingEmails: delayingEmails });

    const countdown = setInterval(() => {
      setDelayingEmails((prev) => {
        const updated = prev
          .map((email) => {
            if (email.id === emailId) {
              const elapsed = (Date.now() - email.startTime) / 1000;
              const remaining = delayDuration - elapsed;
              if (remaining <= 0) {
                clearInterval(countdown);
                sendEmail(email);
                return null;
              }
              return { ...email, remainingTime: remaining };
            }
            return email;
          })
          .filter(Boolean) as DelayingEmail[];
        return updated;
      });
    }, 100);
  };

  const sendEmail = (email: DelayingEmail) => {
    console.log("[Email Magic: SendLock]: This is in sendEmail")
    try {
      // Remove our handler so we don't intercept our own send
      if (email.noopClickHandler) {
        email.originalButton.removeEventListener("click", email.noopClickHandler, true);
        email.originalButton.removeEventListener("keydown", email.noopClickHandler, true);
      }
      delete email.originalButton.dataset.emailMagicHandled;

      // Dispatch a real click event
      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      email.originalButton.dispatchEvent(clickEvent);

      email.originalButton.innerText = "Send";

      // Stats, etc...
      chrome.storage.sync.get(["emailStats"], (result) => {
        const stats = result.emailStats || { delayed: 0, canceled: 0, edited: 0 };
        stats.delayed += 1;
        chrome.storage.sync.set({ emailStats: stats });
      });

      console.log("[Email Magic: SendLock] Email sent after delay");
    } catch (error) {
      console.error("[Email Magic: SendLock] Error sending email:", error);
    }
  };

  const cancelEmail = (email: DelayingEmail) => {
    console.log("[SendLock: SendLock]: This is in cancelEmail")
    try {
      if (email.noopClickHandler) {
        email.originalButton.removeEventListener("click", email.noopClickHandler, true);
        email.originalButton.removeEventListener("keydown", email.noopClickHandler, true);
      }
      if (email.delayClickHandler) {
        email.originalButton.addEventListener("click", email.delayClickHandler, true);
        email.originalButton.addEventListener("keydown", email.delayClickHandler, true);
      }
      email.originalButton.innerText = "Send";

      setDelayingEmails((prev) =>
        prev.filter((dEmail) => dEmail.id !== email.id)
      );

      chrome.storage.sync.get(["emailStats"], (result) => {
      const stats = result.emailStats || { delayed: 0, canceled: 0, edited: 0 };
        stats.canceled += 1;
        chrome.storage.sync.set({ emailStats: stats });
      });
    } catch (error) {
      console.error("[Email Magic: SendLock] Error canceling email:", error);
    }
  };

  const editEmail = (email: DelayingEmail) => {
    console.log("[Email Magic: SendLock]: This is in editEmail")
    try {
      if (email.noopClickHandler) {
        email.originalButton.removeEventListener("click", email.noopClickHandler, true);
        email.originalButton.removeEventListener("keydown", email.noopClickHandler, true);
      }
      if (email.delayClickHandler) {
        email.originalButton.addEventListener("click", email.delayClickHandler, true);
        email.originalButton.addEventListener("keydown", email.delayClickHandler, true);
      }
      email.originalButton.innerText = "Send";

      setDelayingEmails((prev) =>
        prev.filter((dEmail) => dEmail.id !== email.id)
      );

      chrome.storage.sync.get(["emailStats"], (result) => {
      const stats = result.emailStats || { delayed: 0, canceled: 0, edited: 0 };
        stats.edited += 1;
        chrome.storage.sync.set({ emailStats: stats });
      });
    } catch (error) {
      console.error("[Email Magic: SendLock] Error editing email:", error);
    }
  };

  return (
    <div className="container">
      {delayingEmails.map((email) => (
        <div key={email.id} className="indicator">
          <div className="delay-content">
            <Shield size={16} style={{ color: "#3b82f6" }} />
            <span style={{ fontWeight: 600, color: "#1f2937", fontSize: "14px" }}>
              {Math.ceil(email.remainingTime)}s
            </span>
            <div className="delay-actions">
              <button onClick={() => editEmail(email)} className="button edit" title="Edit email">
                <Clock size={14} />
              </button>
              <button onClick={() => cancelEmail(email)} className="button cancel" title="Cancel send">
                <X size={14} />
              </button>
            </div>
          </div>
          <div className="email-preview">
            <div className="email-text">To: {email.recipient}</div>
            <div className="email-text">Subject: {email.subject}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GmailIntegration;
