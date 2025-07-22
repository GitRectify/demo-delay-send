import { useState, useEffect } from "react";
import { Clock, Mail, Pointer, Sparkles } from "lucide-react";

import "../Content.css";

interface NotificationBannerProps {
  emailCount?: number;
  delayTime?: number;
  isActive?: boolean;
}

const NotificationBanner = ({
  emailCount = 3,
  delayTime = 60,
  isActive = true,
}: NotificationBannerProps) => {
  const [timeLeft, setTimeLeft] = useState({ minutes: 15, seconds: 30 });

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive]);

  const formatTime = (seconds: number) => {
    return `${parseInt((seconds / 60).toString())}:${parseInt(
      (seconds % 60).toString()
    )}`;
  };

  if (!isActive) return null;

  return (
    <>
      {emailCount ? (
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
                <span>
                  {emailCount} email{emailCount !== 1 ? "s" : ""} queued
                </span>
              </div>

              {/* Timer */}
              <div className="sendlock-timer">
                <span>{formatTime(delayTime)}</span>
              </div>
            </div>
          </div>

          {/* Subtle bottom border glow */}
          <div className="sendlock-bottom-glow" />
        </div>
      ) : null}
    </>
  );
};

export default NotificationBanner;
