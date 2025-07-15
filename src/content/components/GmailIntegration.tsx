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
  const [delayDuration, setDelayDuration] = useState(30); // 60 seconds default
  const observerRef = useRef<MutationObserver | null>(null);

  // Initialize Gmail integration
  useEffect(() => {
    console.log("[Email Magic: Delay Send] Initializing Gmail integration");

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

  const observeSendButtons = (): MutationObserver => {
    const observer = new MutationObserver(() => {
      GmailSelectors.sendButton.forEach((selector) => {
        document.querySelectorAll(selector).forEach((button) => {
          if (button instanceof HTMLElement && !button.dataset.emailMagicHandled) {
            button.dataset.emailMagicHandled = "true";
            attachDelayHandler(button);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return observer;
  };

  const attachDelayHandler = (button: HTMLElement) => {
    const handler = async (e: MouseEvent) => {
      const emailData = extractEmailData();

      if (emailData) {
        e.preventDefault();
        e.stopPropagation();
        console.log(button.click())
        addDelayEmail(emailData, button);
      }
    };

    button.addEventListener("click", handler, { capture: true });
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

  const addDelayEmail = (emailData: any, originalButton: HTMLElement) => {
    const emailId = `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    const delayingEmail: DelayingEmail = {
      id: emailId,
      content: emailData.content,
      recipient: emailData.recipient,
      subject: emailData.subject,
      delayTime: delayDuration,
      remainingTime: delayDuration,
      startTime,
      originalButton,
    };

    setDelayingEmails((prev) => [...prev, delayingEmail]);

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
      delete email.originalButton.dataset.emailMagicHandled;
      console.log(      email.originalButton.click())

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

  const cancelEmail = (emailId: string) => {
    setDelayingEmails((prev) => prev.filter((email) => email.id !== emailId));

    chrome.storage.sync.get(["emailStats"], (result) => {
      const stats = result.emailStats || { delayed: 0, canceled: 0, edited: 0 };
      stats.canceled += 1;
      chrome.storage.sync.set({ emailStats: stats });
    });
  };

  const editEmail = (emailId: string) => {
    cancelEmail(emailId);

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
              <button onClick={() => editEmail(email.id)} className="button edit" title="Edit email">
                <Clock size={14} />
              </button>
              <button onClick={() => cancelEmail(email.id)} className="button cancel" title="Cancel send">
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
