
import React, { useState, useEffect } from 'react';
import { Shield, Clock, X, Edit, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/popup/components/ui/card';
import { Button } from '@/popup/components/ui/button';
import { Badge } from '@/popup/components/ui/badge';

interface InEmailPreviewProps {
  currentDelay: number;
}

const InEmailPreview: React.FC<InEmailPreviewProps> = ({ currentDelay }) => {
  const [countdown, setCountdown] = useState(currentDelay);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, countdown]);

  const startDemo = () => {
    setCountdown(currentDelay);
    setIsActive(true);
  };

  const resetDemo = () => {
    setCountdown(currentDelay);
    setIsActive(false);
  };

  const DelayIndicator = () => (
    <div className="flex items-center space-x-2 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-slate-200/50">
      <div className="relative">
        <Shield className="w-4 h-4 text-blue-600" />
        {isActive && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        )}
      </div>
      <div className="text-xs">
        <span className="text-slate-600 font-medium">SendLock</span>
        <span className="text-blue-600 ml-1 font-mono">{countdown}s</span>
      </div>
    </div>
  );

  const OutboxPointer = () => (
    <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
      <Shield className="w-4 h-4 text-emerald-600" />
      <div className="text-xs">
        <span className="text-emerald-700 font-medium">→ Outbox</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Preview Controls */}
      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-blue-600" />
            <span>Visual Preview</span>
          </CardTitle>
          <CardDescription>
            See how SendLock appears when you send an email in Gmail
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-3">
            <Button onClick={startDemo} disabled={isActive}>
              Start Demo
            </Button>
            <Button variant="outline" onClick={resetDemo}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gmail Interface Mockup */}
      <Card className="border-0 shadow-lg bg-white overflow-hidden">
        <CardHeader className="bg-slate-50 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-slate-600 ml-4">Gmail - Compose</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Gmail Header */}
          <div className="bg-white border-b p-4">
            <div className="flex items-center space-x-4">
              <span className="text-2xl font-light text-slate-800">Gmail</span>
              <div className="flex-1"></div>
              <Badge variant="secondary">Compose</Badge>
            </div>
          </div>

          {/* Compose Window */}
          <div className="p-6 bg-slate-50/30 min-h-96 relative">
            <div className="bg-white rounded-lg shadow-sm border p-6 max-w-2xl">
              {/* Email Form */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-600 w-12">To:</span>
                  <div className="bg-slate-100 rounded px-2 py-1 text-sm">john.doe@company.com</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-600 w-12">Subject:</span>
                  <div className="text-sm text-slate-800">Important Project Update</div>
                </div>
              </div>

              {/* Email Content */}
              <div className="bg-slate-50 rounded p-4 mb-4 text-sm text-slate-700">
                <p>Hi John,</p>
                <p className="mt-2">I wanted to update you on the project status...</p>
                <p className="mt-2">Best regards,<br />Sarah</p>
              </div>

              {/* Send Button */}
              <div className="flex items-center justify-between">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={startDemo}
                  disabled={isActive}
                >
                  Send
                </Button>
                {isActive && countdown > 0 && (
                  <div className="text-xs text-slate-500">
                    Email will send in {countdown} seconds...
                  </div>
                )}
              </div>
            </div>

            {/* SendLock Indicator - Bottom Right */}
            {isActive && countdown > 0 && (
              <div className="absolute bottom-6 right-6 animate-in fade-in-0 slide-in-from-bottom-2">
                <DelayIndicator />
              </div>
            )}

            {/* Outbox Pointer - After Send */}
            {isActive && countdown === 0 && (
              <div className="absolute bottom-6 left-6 animate-in fade-in-0 slide-in-from-left-2">
                <OutboxPointer />
              </div>
            )}
          </div>

          {/* Gmail Sidebar Preview */}
          <div className="bg-slate-100 p-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Gmail Sidebar</span>
              <div className="flex space-x-4 text-sm text-slate-600">
                <span>Inbox (12)</span>
                {isActive && countdown <= 0 && (
                  <span className="text-emerald-600 font-medium">Outbox (1)</span>
                )}
                <span>Sent</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">During Delay</span>
            </div>
            <p className="text-sm text-blue-700">
              A subtle shield icon with countdown appears in the bottom-right, giving you time to review or cancel.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-emerald-50/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Shield className="w-5 h-5 text-emerald-600" />
              <span className="font-medium text-emerald-800">After Delay</span>
            </div>
            <p className="text-sm text-emerald-700">
              Email moves to your Outbox where you can still edit or cancel before final sending.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InEmailPreview;
