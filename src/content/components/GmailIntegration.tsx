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
  content: string;
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
    console.log("[Email Magic: SendLock] Initializing Gmail integration");

    // Load settings from storage
    chrome.storage.local.get(["delayDuration"], (result) => {
      if (result.delayDuration) setDelayDuration(result.delayDuration);
    });

    chrome.storage.sync.get(["delayingEmails"], (result) => {
      if (result.delayingEmails) setDelayingEmails(result.delayingEmails);
    });

    observerRef.current = observeSendButtons();

    return () => observerRef.current?.disconnect();
  }, []);

  // Helper: check if a button is inside a compose window
  const isInsideComposeWindow = (button: HTMLElement): boolean => {
    let el: HTMLElement | null = button;
    while (el) {
      if (
        el.matches &&
        GmailSelectors.composeWindow.some((sel) => el.matches(sel))
      ) {
        return true;
      }
      el = el.parentElement;
    }
    return false;
  };

  const observeSendButtons = (): MutationObserver => {
    const observer = new MutationObserver(() => {
      GmailSelectors.sendButton.forEach((selector) => {
        document.querySelectorAll(selector).forEach((button) => {
          if (
            button instanceof HTMLElement &&
            isInsideComposeWindow(button) &&
            !button.dataset.Email MagicHandled
          ) {
            button.dataset.Email MagicHandled = "true";
            attachDelayHandler(button);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return observer;
  };

  const attachDelayHandler = (button: HTMLElement) => {
    const delayHandler = (e: Event) => {
      const emailData = extractEmailData();
      if (emailData) {
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
        button.removeEventListener("click", delayHandler, true);
        button.removeEventListener("keydown", delayHandler, true);

        // Replace with empty handler to neutralize button
        const noopHandler = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
        };

        button.addEventListener("click", noopHandler, true);
        button.addEventListener("keydown", noopHandler, true);
        button.innerText = "Delaying...";

        addDelayEmail(emailData, button, noopHandler, delayHandler);
      }
    };

    // Mouse click
    button.addEventListener("click", delayHandler, true);
    // Keyboard: Enter, Space, Ctrl+Enter
    button.addEventListener("keydown", delayHandler, true);
  };

  const extractEmailData = () => {
    try {
      const recipient = GmailUtils.getRecipient();
      const subject = GmailUtils.getSubject();
      const content = GmailUtils.getEmailContent();
      return { recipient, subject, content };
    } catch (error) {
      console.error("[Email Magic] Error extracting email data:", error);
      return null;
    }
  };

  const addDelayEmail = (
    emailData: any,
    originalButton: HTMLElement,
    noopHandler: EventListener,
    delayHandler: EventListener
  ) => {
    const emailId = `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    const delayingEmail: DelayingEmail = {
      id: emailId,
      content: emailData.content,
      recipient: emailData.recipient,
      subject: emailData.subject,
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
    try {
      // Remove our handler so we don't intercept our own send
      if (email.noopClickHandler) {
        email.originalButton.removeEventListener("click", email.noopClickHandler, true);
        email.originalButton.removeEventListener("keydown", email.noopClickHandler, true);
      }
      delete email.originalButton.dataset.Email MagicHandled;

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

      console.log("[Email Magic] Email sent after delay");
    } catch (error) {
      console.error("[Email Magic] Error sending email:", error);
    }
  };

  const cancelEmail = (email: DelayingEmail) => {
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
      console.error("[Email Magic] Error canceling email:", error);
    }
  };

  const editEmail = (email: DelayingEmail) => {
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
      console.error("[Email Magic] Error editing email:", error);
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
