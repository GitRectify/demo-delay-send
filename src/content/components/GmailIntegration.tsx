import React, { useEffect, useState, useRef } from "react";
import { Shield, Clock, X } from "lucide-react";
import {
  GmailSelectors,
  findElement,
  findAllElements,
  matchesAnySelector,
  GmailUtils,
} from "../utils/gmailSelectors";

interface DelayedEmail {
  id: string;
  content: string;
  recipient: string;
  subject: string;
  delayTime: number;
  startTime: number;
  element: HTMLElement;
}

const GmailIntegration: React.FC = () => {
  const [delayedEmails, setDelayedEmails] = useState<DelayedEmail[]>([]);
  const [defaultDelay, setDefaultDelay] = useState(60); // 60 seconds default
  const observerRef = useRef<MutationObserver | null>(null);

  // Initialize Gmail integration
  useEffect(() => {
    console.log("[Email Magic: SendShield] Initializing Gmail integration");

    // Load settings from storage
    chrome.storage.sync.get(["defaultDelay"], (result) => {
      if (result.defaultDelay) {
        setDefaultDelay(result.defaultDelay);
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

    const originalClick = button.onclick;
    const originalAddEventListener = button.addEventListener;

    // Override click event
    button.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Get email data
      const emailData = extractEmailData();
      if (emailData) {
        delayEmail(emailData, button);
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
            delayEmail(emailData, button);
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
      // Use the utility functions to extract data
      const recipient = GmailUtils.getRecipient();
      const subject = GmailUtils.getSubject();
      const content = GmailUtils.getEmailContent();

      return {
        recipient,
        subject,
        content,
      };
    } catch (error) {
      console.error(
        "[Email Magic: SendShield] Error extracting email data:",
        error
      );
      return null;
    }
  };

  // Delay email sending
  const delayEmail = (emailData: any, originalButton: HTMLElement) => {
    const emailId = `email-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const delayedEmail: DelayedEmail = {
      id: emailId,
      content: emailData.content,
      recipient: emailData.recipient,
      subject: emailData.subject,
      delayTime: defaultDelay,
      startTime: Date.now(),
      element: originalButton,
    };

    setDelayedEmails((prev) => [...prev, delayedEmail]);

    // Start countdown
    const countdown = setInterval(() => {
      setDelayedEmails((prev) => {
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

              return { ...email, delayTime: remaining };
            }
            return email;
          })
          .filter(Boolean) as DelayedEmail[];

        return updated;
      });
    }, 100);

    // Store interaction data
    chrome.storage.local.get(["emailStats"], (result) => {
      const stats = result.emailStats || { delayed: 0, touched: 0, edited: 0 };
      stats.delayed += 1;
      chrome.storage.local.set({ emailStats: stats });
    });
  };

  // Send the email after delay
  const sendEmail = (email: DelayedEmail, originalButton: HTMLElement) => {
    try {
      // Restore original button functionality
      delete originalButton.dataset.emailMagicIntercepted;

      // Trigger the original send action
      originalButton.click();

      console.log("[Email Magic: SendShield] Email sent after delay");
    } catch (error) {
      console.error("[Email Magic: SendShield] Error sending email:", error);
    }
  };

  // Cancel delayed email
  const cancelEmail = (emailId: string) => {
    setDelayedEmails((prev) => prev.filter((email) => email.id !== emailId));

    // Update stats
    chrome.storage.local.get(["emailStats"], (result) => {
      const stats = result.emailStats || { delayed: 0, touched: 0, edited: 0 };
      stats.touched += 1;
      chrome.storage.local.set({ emailStats: stats });
    });
  };

  // Edit delayed email
  const editEmail = (emailId: string) => {
    // This would open the compose window with the email data
    // For now, just cancel the delay
    cancelEmail(emailId);

    // Update stats
    chrome.storage.local.get(["emailStats"], (result) => {
      const stats = result.emailStats || { delayed: 0, touched: 0, edited: 0 };
      stats.edited += 1;
      chrome.storage.local.set({ emailStats: stats });
    });
  };

  const containerStyle: React.CSSProperties = {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: 10000,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const indicatorStyle: React.CSSProperties = {
    background: "white",
    border: "1px solid #e1e5e9",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    padding: "16px",
    marginBottom: "12px",
    minWidth: "280px",
    backdropFilter: "blur(10px)",
    animation: "slideIn 0.3s ease-out",
  };

  const delayContentStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  };

  const delayActionsStyle: React.CSSProperties = {
    display: "flex",
    gap: "4px",
    marginLeft: "auto",
  };

  const buttonStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    padding: "4px",
    borderRadius: "4px",
    cursor: "pointer",
    color: "#6b7280",
    transition: "all 0.2s",
  };

  const emailPreviewStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "#6b7280",
    lineHeight: 1.4,
  };

  const emailTextStyle: React.CSSProperties = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  return (
    <div style={containerStyle}>
      {delayedEmails.map((email) => (
        <div key={email.id} style={indicatorStyle}>
          <div style={delayContentStyle}>
            <Shield size={16} style={{ color: "#3b82f6" }} />
            <span
              style={{
                fontWeight: 600,
                color: "#1f2937",
                fontSize: "14px",
              }}
            >
              {Math.ceil(email.delayTime)}s
            </span>
            <div style={delayActionsStyle}>
              <button
                onClick={() => editEmail(email.id)}
                style={buttonStyle}
                title="Edit email"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f3f4f6";
                  e.currentTarget.style.color = "#3b82f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = "#6b7280";
                }}
              >
                <Clock size={14} />
              </button>
              <button
                onClick={() => cancelEmail(email.id)}
                style={buttonStyle}
                title="Cancel send"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fef2f2";
                  e.currentTarget.style.color = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = "#6b7280";
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
          <div style={emailPreviewStyle}>
            <div style={emailTextStyle}>To: {email.recipient}</div>
            <div style={emailTextStyle}>Subject: {email.subject}</div>
          </div>
        </div>
      ))}

      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default GmailIntegration;
