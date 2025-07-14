
import React, { useState } from 'react';
import { Mail, Clock, Edit, X, Send, AlertCircle, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/popup/components/ui/card';
import { Button } from '@/popup/components/ui/button';
import { Badge } from '@/popup/components/ui/badge';
import { Separator } from '@/popup/components/ui/separator';

interface DelayingEmail {
  id: string;
  to: string;
  subject: string;
  preview: string;
  timeRemaining: number;
  priority: 'normal' | 'high';
  touches: number;
}

const OutboxManager: React.FC = () => {
  const [delayingEmails, setDelayingEmails] = useState<DelayingEmail[]>([
    {
      id: '1',
      to: 'john.doe@company.com',
      subject: 'Important Project Update',
      preview: 'Hi John, I wanted to update you on the project status...',
      timeRemaining: 42,
      priority: 'normal',
      touches: 0
    },
    {
      id: '2',
      to: 'team@startup.com',
      subject: 'Weekly Team Sync Notes',
      preview: 'Hey team, here are the key points from today\'s meeting...',
      timeRemaining: 18,
      priority: 'high',
      touches: 2
    },
    {
      id: '3',
      to: 'sarah.wilson@client.com',
      subject: 'Proposal Draft for Review',
      preview: 'Hi Sarah, Please find attached the proposal draft...',
      timeRemaining: 156,
      priority: 'normal',
      touches: 1
    }
  ]);

  const formatTimeRemaining = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const handleEdit = (id: string) => {
    setDelayingEmails(emails =>
      emails.map(email =>
        email.id === id ? { ...email, touches: email.touches + 1 } : email
      )
    );
  };

  const handleCancel = (id: string) => {
    setDelayingEmails(emails => emails.filter(email => email.id !== id));
  };

  const handleSendNow = (id: string) => {
    setDelayingEmails(emails => emails.filter(email => email.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Outbox Manager</h2>
                <p className="text-slate-600 dark:text-slate-400">Emails waiting to be sent</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{delayingEmails.length}</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Delayed emails</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Average delay</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">1m 12s</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Edit className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Emails edited</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">3</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mistakes prevented</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">12</div>
          </CardContent>
        </Card>
      </div>

      {/* Delayed Emails List */}
      <div className="space-y-4">
        {delayingEmails.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <Mail className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">No emails in outbox</h3>
              <p className="text-slate-500 dark:text-slate-500">Delayed emails will appear here when you send them</p>
            </CardContent>
          </Card>
        ) : (
          delayingEmails.map((email) => (
            <Card key={email.id} className="border-0 shadow-sm bg-white dark:bg-slate-800 hover:shadow-md dark:hover:shadow-slate-700/50 transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{email.to}</span>
                      </div>
                      {email.priority === 'high' && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          High Priority
                        </Badge>
                      )}
                      {email.touches > 0 && (
                        <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {email.touches} {email.touches === 1 ? 'touch' : 'touches'}
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 truncate">
                      {email.subject}
                    </h3>

                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                      {email.preview}
                    </p>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                          Sending in {formatTimeRemaining(email.timeRemaining)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(email.id)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSendNow(email.id)}
                      className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancel(email.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Help Card */}
      <Card className="border-0 shadow-sm bg-slate-50 dark:bg-slate-800/50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Outbox Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center space-x-2">
                  <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span><strong className="text-slate-700 dark:text-slate-300">Edit:</strong> Modify email content</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span><strong className="text-slate-700 dark:text-slate-300">Send Now:</strong> Skip remaining delay</span>
                </div>
                <div className="flex items-center space-x-2">
                  <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span><strong className="text-slate-700 dark:text-slate-300">Cancel:</strong> Delete email permanently</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OutboxManager;
