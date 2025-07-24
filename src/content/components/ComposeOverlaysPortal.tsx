import ReactDOM from 'react-dom';
import { Clock, Shield, X, SendIcon, Edit2 } from "lucide-react";
import { GmailSelectors } from "../utils/gmailSelectors";
import { DelayingEmail } from "./GmailIntegration";
import { formatTime } from './NotificationBanner';

const ComposeOverlaysPortal: React.FC<{
    emails: DelayingEmail[];
    onCancel: (email: DelayingEmail) => void;
    onEdit: (email: DelayingEmail) => void;
}> = ({ emails, onCancel, onEdit }) => {
    return (
        <>
            {emails.map((email) => {
                const composeEl = document.querySelector(`input[name="draft"][value*="${email.draftId}"]`)?.closest(GmailSelectors.composeWindow.join(","));
                if (!composeEl) return null;

                // let counterOverlay = composeEl.querySelector(".sendlock-counter-overlay") as HTMLElement | null;
                let counterOverlay = composeEl.querySelector(".gU.Up") as HTMLElement | null;
                if (!counterOverlay) {
                    counterOverlay = document.createElement("div");
                    counterOverlay.style.position = "relative";
                    counterOverlay.className = "sendlock-counter-overlay";
                    counterOverlay.style.borderRadius = "16px";
                    composeEl.appendChild(counterOverlay);
                }

                let cancelOverlay = composeEl.querySelector(".gU.Up") as HTMLElement | null;
                if (!cancelOverlay) {
                    cancelOverlay = document.createElement("div");
                    cancelOverlay.className = "sendlock-cancel-overlay";
                    cancelOverlay.style.position = "relative";
                    cancelOverlay.style.borderRadius = "16px";
                    composeEl.appendChild(cancelOverlay);
                }

                // Create two portals
                return (
                    <>
                        {ReactDOM.createPortal(
                            <div className="counter-indicator">
                                <SendIcon size={16} style={{ color: "#3b82f6" }} />
                                <span style={{ fontWeight: 600, color: "#1f2937", fontSize: "14px", width: "40px"}}>
                                    {formatTime(email.remainingTime)}
                                </span>
                            </div>,
                            counterOverlay
                        )}

                        {ReactDOM.createPortal(
                            <div className="edit-actions">
                                {/* <button onClick={() => onEdit(email)} className="button edit" title="Edit email">
                                    Edit
                                    <Edit2 size={20} />
                                </button> */}
                                <button onClick={() => onCancel(email)} className="button cancel" title="Cancel send">
                                    Cancel
                                    {/* <X size={14} /> */}
                                </button>
                            </div>,
                            cancelOverlay
                        )}
                    </>
                );
            })}
        </>
    );
};

export default ComposeOverlaysPortal;
