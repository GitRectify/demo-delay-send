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
}

const GmailIntegration: React.FC = () => {
  const [delayingEmails, setDelayingEmails] = useState<DelayingEmail[]>([]);
  const [delayDuration, setDelayDuration] = useState(60); // 60 seconds default
  const observerRef = useRef<MutationObserver | null>(null);

  // Initialize Gmail integration
  useEffect(() => {
    console.log("[Email Magic: Delay Send] Initializing Gmail integration");

    // Load settings from storage
    chrome.storage.local.get(["delayDuration"], (result) => {
      if (result.delayDuration) {
        setDelayDuration(result.delayDuration);
      }
    });

    chrome.storage.sync.get(["delayingEmails"], (result) => {
      if (result.delayingEmails) {
        setDelayingEmails(result.delayingEmails);
      }
    });

    // Start observing DOM changes
    startObserving();

    // Cleanup on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Start observing DOM changes to detect new send buttons
  const startObserving = () => {
    observerRef.current = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              // Check if the added element is a send button
              GmailSelectors.sendButton.forEach((selector) => {
                const sendButton =
                  element.querySelector(selector) ||
                  (element.matches(selector) ? element : null);
                if (sendButton) {
                  interceptSendButton(sendButton as HTMLElement);
                }
              });
            }
          });
        }
      });
    });

    // Start observing
    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also check for existing send buttons
    GmailSelectors.sendButton.forEach((selector) => {
      const existingButtons = document.querySelectorAll(selector);
      existingButtons.forEach((button) => {
        interceptSendButton(button as HTMLElement);
      });
    });
  };

  // Intercept send button clicks
  const interceptSendButton = (button: HTMLElement) => {
    if (button.dataset.emailMagicIntercepted) return;

    button.dataset.emailMagicIntercepted = "true";

    const originalOnClick = button.onclick;
    const originalAddEventListener = button.addEventListener;

    // Override click event
    button.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Get email data
      const emailData = extractEmailData();
      if (emailData) {
        addDelayEmail(emailData, button);
      } else {
        // If empty, allow default send (or do nothing)
        if (originalOnClick) originalOnClick.call(button, e);
      }
      return false;
    };

    // Also override addEventListener for click events
    const originalAddEventListenerBound = originalAddEventListener.bind(button);
    button.addEventListener = (type, listener, options) => {
      if (type === "click") {
        const wrappedListener = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();

          const emailData = extractEmailData();
          if (emailData) {
            addDelayEmail(emailData, button);
          }

          return false;
        };
        return originalAddEventListenerBound(type, wrappedListener, options);
      }
      return originalAddEventListenerBound(type, listener, options);
    };
  };

  // Extract email data from Gmail compose window
  const extractEmailData = () => {
    try {
      const recipient = GmailUtils.getRecipient();
      const subject = GmailUtils.getSubject();
      const content = GmailUtils.getEmailContent();
      // If all fields are empty, treat as empty compose
      // if (!recipient) return null;
      // if (!subject && !content) return null;
      return {
        recipient,
        subject,
        content,
      };
    } catch (error) {
      console.error(
        "[Email Magic: Delay Send] Error extracting email data:",
        error
      );
      return null;
    }
  };

  // Delay email sending
  const addDelayEmail = (emailData: any, originalButton: HTMLElement) => {
    const emailId = `email-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const delayingEmail: DelayingEmail = {
      id: emailId,
      content: emailData.content,
      recipient: emailData.recipient,
      subject: emailData.subject,
      delayTime: delayDuration,
      remainingTime: delayDuration,
      startTime: Date.now(),
      originalButton: originalButton,
    };

    setDelayingEmails((prev) => [...prev, delayingEmail]); // React gives `prev` = current delayingEmails

    // Start countdown
    const countdown = setInterval(() => {
      setDelayingEmails((prev) => {
        const updated = prev
          .map((email) => {
            if (email.id === emailId) {
              const elapsed = (Date.now() - email.startTime) / 1000;
              const remaining = email.delayTime - elapsed;

              if (remaining <= 0) {
                // Time's up, send the email
                sendEmail(email, originalButton);
                clearInterval(countdown);
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

  // Send the email after delay
  const sendEmail = (trueEmail: DelayingEmail, originalButton: HTMLElement) => {
    try {
      // Restore original button functionality
      delete trueEmail.originalButton.dataset.emailMagicIntercepted;

      // Trigger the original send action
      trueEmail.originalButton.click();

      // Update stats
      chrome.storage.sync.get(["emailStats"], (result) => {
        const stats = result.emailStats || { delayed: 0, canceled: 0, edited: 0 };
        stats.delayed += 1;
        chrome.storage.sync.set({ emailStats: stats });
      });

      console.log("[Email Magic: Delay Send] Email sent after delay");
    } catch (error) {
      console.error("[Email Magic: Delay Send] Error sending email:", error);
    }
  };

  // Cancel delayed email
  const cancelEmail = (emailId: string) => {
    setDelayingEmails((prev) => prev.filter((email) => email.id !== emailId));

    // Update stats
    chrome.storage.sync.get(["emailStats"], (result) => {
      const stats = result.emailStats || { delayed: 0, canceled: 0, edited: 0 };
      stats.canceled += 1;
      chrome.storage.sync.set({ emailStats: stats });
    });
  };

  // Edit delayed email
  const editEmail = (emailId: string) => {
    // This would open the compose window with the email data
    // For now, just cancel the delay
    cancelEmail(emailId);

    // Update stats
    chrome.storage.sync.get(["emailStats"], (result) => {
      const stats = result.emailStats || { delayed: 0, canceled: 0, edited: 0 };
      stats.edited += 1;
      chrome.storage.sync.set({ emailStats: stats });
    });
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
              <button
                onClick={() => editEmail(email.id)}
                className="button edit"
                title="Edit email"
              >
                <Clock size={14} />
              </button>
              <button
                onClick={() => cancelEmail(email.id)}
                className="button cancel"
                title="Cancel send"
              >
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
