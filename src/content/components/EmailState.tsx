import { useState, useEffect } from "react";
import { Clock, Mail, Sparkles } from "lucide-react";

import "../Content.css";

interface EmailStateProps {
  emailCount?: number;
  delayTime?: number;
  isActive?: boolean;
}

const EmailState = ({
  emailCount = 3,
  delayTime = 60,
  isActive = true,
}: EmailStateProps) => {
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

  const formatTime = (minutes: number, seconds: number) => {
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  if (!isActive) return null;

  return (
    <>
      {emailCount ? (
        <div className="w-full bg-gradient-magic shadow-magic border-b border-primary/20 relative overflow-hidden cursor-auto">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-glow opacity-50 animate-pulse" />

          {/* Main content */}
          <div className="relative w-full z-10 px-4 py-3 flex items-center justify-between">
            {/* Left side - Brand */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-primary-foreground">
                {/* <Sparkles className="h-5 w-5 animate-pulse" /> */}
                <span className="font-semibold text-lg tracking-wide">
                  Email Magic: SendLock
                </span>
              </div>
            </div>

            {/* Right side - Stats and Timer */}
            <div className="flex items-center gap-6">
              {/* Email count */}
              <div className="flex items-center gap-2 text-primary-foreground/90">
                {/* <Mail className="h-4 w-4" /> */}
                <span className="text-sm font-medium">
                  {emailCount} email{emailCount !== 1 ? "s" : ""} queued
                </span>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/20">
                {/* <Clock className="h-4 w-4 text-primary-foreground" /> */}
                <span className="text-primary-foreground font-mono text-sm font-medium">
                  {/* {formatTime(timeLeft.minutes, timeLeft.seconds)} */}
                  {delayTime}
                </span>
              </div>
            </div>
          </div>

          {/* Subtle bottom border glow */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export default EmailState;
