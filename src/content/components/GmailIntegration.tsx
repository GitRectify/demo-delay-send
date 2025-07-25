import React, { useEffect, useState, useRef } from "react";
import { Shield, Clock, X } from "lucide-react";
import ReactDOM from "react-dom/client";

import {
  GmailSelectors,
  findElement,
  findAllElements,
  matchesAnySelector,
  GmailUtils,
} from "../utils/gmailSelectors";
import NotificationBanner from "./NotificationBanner";
import ComposeOverlaysPortal from "./ComposeOverlaysPortal";

export interface DelayingEmail {
  draftId: string;
  delayTime: number;
  remainingTime: number;
  startTime: number;
}

const GmailIntegration: React.FC = () => {
  const [delayingEmails, setDelayingEmails] = useState<DelayingEmail[]>([]);
  const sendButtonObserverRef = useRef<MutationObserver | null>(null);

  // Initialize Gmail integration
  useEffect(() => {
    // Observe compose windows and attach send interceptors
    console.log("[Email Magic: SendLock] Initializing Gmail integration");

    // Load settings from storage
    chrome.storage.local.get(["delayingEmails"], (result) => {
      if (result.delayingEmails) setDelayingEmails(result.delayingEmails);
    });

    const updaterDelayingEmails = setInterval(() => {
      setDelayingEmails((prev) => {
        const updatedDelayingEmails = prev.map((email) => {
            const elapsed = (Date.now() - email.startTime) / 1000;
            const remainingTime = email.delayTime - elapsed;
            if (remainingTime <= 0) {
              sendEmail(email);
              return null;
            }
            return { ...email, remainingTime: remainingTime };
          }).filter(Boolean) as DelayingEmail[];
        return updatedDelayingEmails;
      });
    }, 100);

    sendButtonObserverRef.current = observeSendButtons();

    return () => {
      sendButtonObserverRef.current?.disconnect();
      clearInterval(updaterDelayingEmails)
    };
  }, []);

  // Update delaying emails
  useEffect(() => {
    chrome.storage.local.set({ delayingEmails });
  }, [delayingEmails]);

  // Helper: check if a button is inside a compose window
  const getParentComposeWindow = (button: HTMLElement) => {
    let el: HTMLElement | null = button;
    while (el) {
      if (el.matches && GmailSelectors.composeWindow.some((sel) => el.matches(sel))) return el;
      el = el.parentElement;
    }
    return null;
  };

  const observeSendButtons = (): MutationObserver => {
    const observer = new MutationObserver(() => {
      GmailSelectors.sendButton.forEach((selector) => {
        document.querySelectorAll(selector).forEach((button) => {
          if ( button instanceof HTMLElement && !button.dataset.emailMagicHandled ) {
            const parentCompose = getParentComposeWindow(button);
            if (parentCompose) {
              button.dataset.emailMagicHandled = "true";
              attachDelayHandler(parentCompose, button);
            }
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return observer;
  };

  const attachDelayHandler = (parentCompose: HTMLElement, sendButton: HTMLElement) => {
    const sendLockHandler = (e: Event) => {
      const eventTarget = e.target as HTMLElement;
      const composeWindow = getParentComposeWindow(eventTarget);
      const emailInfo = getEmailInfo(composeWindow);
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

        if (composeWindow instanceof HTMLElement) {
          const escEvent = new KeyboardEvent("keydown", {
            key: "Escape",
            keyCode: 27,
            which: 27,
            bubbles: true,
            cancelable: true,
          });

          if (!composeWindow.dispatchEvent(escEvent)) {
            // window.location.href = "https://mail.google.com/mail/u/0/#inbox";
            addDelayEmail(composeWindow);
          }
        }
      }
    };

    // Mouse click
    sendButton.addEventListener("click", sendLockHandler, true);
    // Keyboard: Enter, Space, Ctrl+Enter
    sendButton.addEventListener("keydown", sendLockHandler, true);
  };

  const getEmailInfo = (parentCompose: HTMLElement) => {
    console.log("[Email Magic: SendLock]: This is in getEmailInfo");
    try {
      let recipients = GmailUtils.getRecipientsFromField(parentCompose, "To");

      // Subject
      // let subject = GmailUtils.getSubject()
      let subject = "";
      for (const sel of GmailSelectors.subjectInput) {
        const el = parentCompose.querySelector(sel);
        if (el) {
          subject = (el as HTMLInputElement).value || el.textContent || "";
          if (subject && subject !== "") break;
        }
      }

      // Content (HTML)
      let content = "";
      for (const sel of GmailSelectors.emailContent) {
        const el = parentCompose.querySelector(sel);
        if (el) {
          content = (el as HTMLElement).innerHTML || el.textContent || "";
          if (content) break;
        }
      }
      return {
        parentCompose,
        recipient: recipients.join(", "),
        subject,
        content,
      };
    } catch (error) {
      console.error(
        "[Email Magic: SendLock] Error extracting email data:",
        error
      );
      return null;
    }
  };

  const addDelayEmail = (composeWindow: HTMLElement) => {
    const draftInput = composeWindow.querySelector('input[name="draft"]');
    const draftId = (draftInput as HTMLInputElement).value.split("#msg-a:")[1];

    chrome.storage.local.get(["delayDuration"], (result) => {
      if (result.delayDuration) {
        const delayTime = result.delayDuration

        const delayingEmail: DelayingEmail = {
          draftId: draftId,
          delayTime: delayTime,
          remainingTime: delayTime,
          startTime: Date.now(),
        };

        setDelayingEmails((prev) => [...prev, delayingEmail]);
      }
    });
    setTimeout(() => {
      chrome.runtime.sendMessage(
        { type: "GET_DRAFT_CONTENT", draftId: draftId },
        (response) => {
          if (response && response.success) {
            console.log(`to-${response.to}`);
          } else {
            alert(
              "Failed to import draft: " + (response?.error || "Unknown error")
            );
          }
        }
      );
    }, 4500); // 4500 milliseconds = 4.5 seconds
  };

  const sendEmail = (email: DelayingEmail) => {
    console.log("[Email Magic: SendLock]: This is in sendEmail");
    console.log("draftId: ", email.draftId);
    try {
      chrome.runtime.sendMessage(
        { type: "SEND_DRAFT", draftId: email.draftId },
        (response) => {
          if (response && response.success) {
            chrome.storage.sync.get(["emailStats"], (result) => {
              const stats = result.emailStats || {
                delayed: 0,
                canceled: 0,
                edited: 0,
              };
              stats.delayed += 1;
              chrome.storage.sync.set({ emailStats: stats });
            });
            console.log(
              `[Email Magic: SendLock] Email sent to ${response.result} after delay`
            );
          } else {
            console.log(
              "Failed to import draft: " + (response?.error || "Unknown error")
            );
          }
        }
      );
    } catch (error) {
      console.error("[Email Magic: SendLock] Error sending email:", error);
    }
  };

  const cancelEmail = (email: DelayingEmail) => {
    console.log("[SendLock: SendLock]: This is in cancelEmail");
    try {
      setDelayingEmails((prev) =>
        prev.filter((dEmail) => dEmail.draftId !== email.draftId)
      );

      chrome.storage.sync.get(["emailStats"], (result) => {
        const stats = result.emailStats || {
          delayed: 0,
          canceled: 0,
          edited: 0,
        };
        stats.canceled += 1;
        chrome.storage.sync.set({ emailStats: stats });
      });
    } catch (error) {
      console.error("[Email Magic: SendLock] Error canceling email:", error);
    }
  };

  const editEmail = (email: DelayingEmail) => {
    console.log("[Email Magic: SendLock]: This is in editEmail");
    try {
      setDelayingEmails((prev) =>
        prev.filter((dEmail) => dEmail.draftId !== email.draftId)
      );

      chrome.storage.sync.get(["emailStats"], (result) => {
        const stats = result.emailStats || {
          delayed: 0,
          canceled: 0,
          edited: 0,
        };
        stats.edited += 1;
        chrome.storage.sync.set({ emailStats: stats });
      });
    } catch (error) {
      console.error("[Email Magic: SendLock] Error editing email:", error);
    }
  };

  return (
    <>
      <NotificationBanner emails={delayingEmails} />
      <ComposeOverlaysPortal
        emails={delayingEmails}
        onCancel={cancelEmail}
        onEdit={editEmail}
      />
    </>
  );
};

export default GmailIntegration;
