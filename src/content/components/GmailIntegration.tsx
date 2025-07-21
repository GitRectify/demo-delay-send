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
  draftId: string;
  recipient: string;
  subject: string;
  delayTime: number;
  remainingTime: number;
  startTime: number;
}

const GmailIntegration: React.FC = () => {
  const [delayingEmails, setDelayingEmails] = useState<DelayingEmail[]>([]);
  const [delayDuration, setDelayDuration] = useState(30); // 30 seconds default
  const observerRef = useRef<MutationObserver | null>(null);
  const notificationObserverRef = useRef<MutationObserver | null>(null);

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

    notificationObserverRef.current = observeGmailHeader();

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
          if (
            button instanceof HTMLElement &&
            !button.dataset.emailMagicHandled
          ) {
            const parentCompose = getParentComposeWindow(button);
            if (parentCompose) {
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

  const observeGmailHeader = (): MutationObserver => {
    const observer = new MutationObserver(() => {
      const topRight = document.querySelector("div.gb_a.gb_qd.gb_Mc");
      if (topRight && !document.getElementById("sendlock-status-bar")) {
        injectAfterGmailTopRight();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return observer;
  };

  const injectAfterGmailTopRight = () => {
    const target = document.querySelector("div.gb_a.gb_qd.gb_Mc");
    if (!target || document.getElementById("sendlock-status-bar")) return;

    const wrapper = document.createElement("div");
    wrapper.id = "sendlock-status-bar";
    wrapper.style.cssText = `
      background: linear-gradient(to right, #6366f1, #8b5cf6);
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      margin-left: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
    `;

    wrapper.innerText = `⏳ Email Magic: ${delayingEmails.length} queued`;

    // Click to open SendLock folder
    wrapper.onclick = () => {
      window.location.href = "https://mail.google.com/mail/u/0/#label/SendLock";
    };

    target.parentNode.insertBefore(wrapper, target.nextSibling);
  }

  // Wait for Gmail to fully load
  const observer = new MutationObserver(() => {
    const topRight = document.querySelector("div.gb_a.gb_qd.gb_Mc");
    if (topRight && !document.getElementById("sendlock-status-bar")) {
      injectAfterGmailTopRight();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  const attachDelayHandler = (sendButton: HTMLElement) => {
    console.log("[Email Magic: SendLock]: This is in attachDelayHandeler");

    const sendLockHandler = (e: Event) => {
      const target = e.target as HTMLElement;
      const composeWindow = getParentComposeWindow(target);
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
            const draftInput = composeWindow.querySelector(
              'input[name="draft"]'
            );
            const draftId = (draftInput as HTMLInputElement).value.split(
              "#msg-a:"
            )[1];

            addDelayEmail(draftId);
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

  const addDelayEmail = (draftId: string) => {
    const emailId = `email-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const startTime = Date.now();

    chrome.runtime.sendMessage(
      { type: "GET_DRAFT_CONTENT", draftId: draftId },
      (response) => {
        if (response && response.success) {
          const delayingEmail: DelayingEmail = {
            id: emailId,
            draftId: draftId,
            recipient: `To: ${response.to}\nCc: ${response.cc}\nBcc: ${response.bcc}`,
            subject: response.subject,
            delayTime: delayDuration,
            remainingTime: delayDuration,
            startTime: startTime,
          };
          setDelayingEmails((prev) => [...prev, delayingEmail]);
          console.log(`to-${response.to}`);
        } else {
          alert(
            "Failed to import draft: " + (response?.error || "Unknown error")
          );
        }
      }
    );

    // chrome.storage.sync.set({ delayingEmails: delayingEmails });

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
    console.log("[Email Magic: SendLock]: This is in sendEmail");
    console.log("draftId: ", email.draftId);
    try {
      chrome.runtime.sendMessage({ type: "GET_LIST_DRAFT" }, (response) => {
        if (response && response.success) {
          console.log(JSON.stringify(response.result));
        } else {
          console.log(
            "Failed to import draft: " + (response?.error || "Unknown error")
          );
        }
      });
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
      // // Remove our handler so we don't intercept our own send
      // if (email.noopClickHandler) {
      //   email.originalButton.removeEventListener("click", email.noopClickHandler, true);
      //   email.originalButton.removeEventListener("keydown", email.noopClickHandler, true);
      // }
      // delete email.originalButton.dataset.emailMagicHandled;

      // // Dispatch a real click event
      // const clickEvent = new MouseEvent("click", {
      //   bubbles: true,
      //   cancelable: true,
      //   view: window,
      // });
      // email.originalButton.dispatchEvent(clickEvent);

      // email.originalButton.innerText = "Send";

      // Stats, etc...
    } catch (error) {
      console.error("[Email Magic: SendLock] Error sending email:", error);
    }
  };

  const cancelEmail = (email: DelayingEmail) => {
    console.log("[SendLock: SendLock]: This is in cancelEmail");
    try {
      // if (email.noopClickHandler) {
      //   email.originalButton.removeEventListener("click", email.noopClickHandler, true);
      //   email.originalButton.removeEventListener("keydown", email.noopClickHandler, true);
      // }
      // if (email.delayClickHandler) {
      //   email.originalButton.addEventListener("click", email.delayClickHandler, true);
      //   email.originalButton.addEventListener("keydown", email.delayClickHandler, true);
      // }
      // email.originalButton.innerText = "Send";

      setDelayingEmails((prev) =>
        prev.filter((dEmail) => dEmail.id !== email.id)
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
      // if (email.noopClickHandler) {
      //   email.originalButton.removeEventListener("click", email.noopClickHandler, true);
      //   email.originalButton.removeEventListener("keydown", email.noopClickHandler, true);
      // }
      // if (email.delayClickHandler) {
      //   email.originalButton.addEventListener("click", email.delayClickHandler, true);
      //   email.originalButton.addEventListener("keydown", email.delayClickHandler, true);
      // }
      // email.originalButton.innerText = "Send";

      setDelayingEmails((prev) =>
        prev.filter((dEmail) => dEmail.id !== email.id)
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
    <div className="container">
      {delayingEmails.map((email) => (
        <div key={email.id} className="indicator">
          <div className="delay-content">
            <Shield size={16} style={{ color: "#3b82f6" }} />
            <span
              style={{ fontWeight: 600, color: "#1f2937", fontSize: "14px" }}
            >
              {Math.ceil(email.remainingTime)}s
            </span>
            <div className="delay-actions">
              <button
                onClick={() => editEmail(email)}
                className="button edit"
                title="Edit email"
              >
                <Clock size={14} />
              </button>
              <button
                onClick={() => cancelEmail(email)}
                className="button cancel"
                title="Cancel send"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          <div className="email-preview">
            <div className="email-text">{email.recipient}</div>
            <div className="email-text">Subject: {email.subject}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GmailIntegration;
