import ReactDOM from 'react-dom';
import { useEffect, useRef } from "react";
import "../Content.css";
import { DelayingEmail } from './GmailIntegration';

export const formatTime = (time: number) => {
    const hour = Math.floor(time / 3600);
    const min = Math.floor((time % 3600) / 60);
    const sec = Math.floor(time % 60);
    return `${hour ? `${hour}:` : ''}${min ? `${min}:` : ''}${(hour || min) ? `${sec.toString().padStart(2, '0')}` : `${sec}s`}`;
};

interface NotificationBannerProps {
    emails: DelayingEmail[];
}

const NotificationBanner = ({ emails }: NotificationBannerProps) => {
    const notificatorRef = useRef<HTMLElement | null>(null);

    // Ensure portal container is injected when emails are available
    useEffect(() => {
        if (!emails.length) return; // Optional: skip if no emails

        const interval = setInterval(() => {
            const gmailHeader = document.querySelector("div.gb_a.gb_qd");
            if (!gmailHeader) return;
            let notificator = document.getElementById("sendlock-banner-root") as HTMLElement | null;
            if (!notificator) {
                notificator = document.createElement("div");
                notificator.id = "sendlock-banner-root";
                notificator.style.cursor = "pointer";
                notificator.onclick = notificator.onmouseup = () => {
                    window.location.href = "https://mail.google.com/mail/u/0/#label/SendLock";
                };
                gmailHeader.parentNode?.insertBefore(notificator, gmailHeader.nextSibling);
            }
            notificatorRef.current = notificator;
            clearInterval(interval); // ✅ Only clear if header found and appended
        }, 300);
        return () => clearInterval(interval); // Always clear on unmount
    }, [emails.length]);

    if (!emails.length || !notificatorRef.current) return null;

    const latestEmail = emails[emails.length - 1];

    return ReactDOM.createPortal(
        <div className="sendlock-bar">
            {/* Animated background glow */}
            <div className="sendlock-glow" />
            {/* Main content */}
            <div className="sendlock-content">
                {/* Left side - Brand */}
                <div className="sendlock-brand">
                    <div className="sendlock-brand-name">
                        <span>Email Magic: SendLock</span>
                    </div>
                </div>
                {/* Right side - Stats and Timer */}
                <div className="sendlock-status">
                    {/* Email count */}
                    <div className="sendlock-email-count">
                        <span>{emails.length} email{emails.length !== 1 ? "s" : ""} queued</span>
                    </div>
                    {/* Timer */}
                    <div className="sendlock-timer">
                        <span>{formatTime(latestEmail.remainingTime)}</span>
                    </div>
                </div>
            </div>
            {/* Subtle bottom border glow */}
            <div className="sendlock-bottom-glow" />
        </div>,
        notificatorRef.current
    );
};

export default NotificationBanner;
