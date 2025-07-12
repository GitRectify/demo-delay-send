import React, { useState, useEffect } from 'react';
import { Shield, Clock, Settings, BarChart3, User, Mail, Zap, Check, ArrowRight, Sun, Moon } from 'lucide-react';
import { Button } from '@/popup/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/popup/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/popup/components/ui/tabs';
import { Badge } from '@/popup/components/ui/badge';
import DelaySettings from '@/popup/components/DelaySettings';
import UsageAnalytics from '@/popup/components/UsageAnalytics';
import OutboxManager from '@/popup/components/OutboxManager';
import InEmailPreview from '@/popup/components/InEmailPreview';

const Index = () => {
  const [currentDelay, setCurrentDelay] = useState(60);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isDelayEnabled, setIsDelayEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('settings');

  // Load ALL state from localStorage on component mount
  useEffect(() => {
    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme !== null) {
      const isDark = savedTheme === 'dark';
      setIsDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }

    // Load delay enabled state
    const savedDelayEnabled = localStorage.getItem('delayEnabled');
    if (savedDelayEnabled !== null) {
      setIsDelayEnabled(savedDelayEnabled === 'true');
    }

    // Load delay duration
    const savedDelayDuration = localStorage.getItem('delayDuration');
    if (savedDelayDuration !== null) {
      const duration = parseInt(savedDelayDuration, 10);
      if (!isNaN(duration)) {
        setCurrentDelay(duration);
      }
    }

    // Load active tab
    const savedActiveTab = localStorage.getItem('activeTab');
    if (savedActiveTab !== null) {
      setActiveTab(savedActiveTab);
    }

    // Load authentication state
    const savedAuthState = localStorage.getItem('isAuthenticated');
    if (savedAuthState !== null) {
      setIsAuthenticated(savedAuthState === 'true');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);

    // Save to localStorage
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');

    // Apply to document
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleDelayEnabledChange = (enabled: boolean) => {
    setIsDelayEnabled(enabled);
    localStorage.setItem('delayEnabled', enabled.toString());
  };

  const handleDelayChange = (delay: number) => {
    setCurrentDelay(delay);
    localStorage.setItem('delayDuration', delay.toString());
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem('activeTab', value);
  };

  const handleAuthChange = (authenticated: boolean) => {
    setIsAuthenticated(authenticated);
    localStorage.setItem('isAuthenticated', authenticated.toString());
  };

  const formatDelay = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`.replace(' 0s', '');
  };

  return (
    <div className={`min-h-screen min-w-[360px] transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
        {/* Header */}
        <header className="border-b border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50 transition-colors duration-300">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* <div className="relative"> */}
                  <img
                    src="/images/email-magic-logo.png"
                    alt="Email Magic Logo"
                    className="w-12 h-8 object-contain"
                  />
                {/* </div> */}
                <div>
                  <h1 className="text-md font-semibold text-slate-900 dark:text-white">Delay Send</h1>
                  {/* <p className="text-sm text-slate-500 dark:text-slate-400">Smart delay protection for Gmail</p> */}
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Badge
                  variant="secondary"
                  className={`${
                    isDelayEnabled
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/30'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/30'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    isDelayEnabled ? 'bg-emerald-500' : 'bg-red-500'
                  }`}></div>
                  {isDelayEnabled ? 'Active' : 'Inactive'}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-slate-600" />
                  )}
                </Button>
                <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <User className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Welcome Section */}
          {/* <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-600 dark:to-blue-700 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-white/5 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold mb-2">Welcome back</h2>
                    <p className="text-blue-100 text-lg">Your emails are protected with smart delay sending</p>
                    <div className="flex items-center mt-4 space-x-6">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-blue-200" />
                        <span className="text-blue-100">{currentDelay}s delay active</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-blue-200" />
                        <span className="text-blue-100">12 emails protected today</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <Shield className="w-12 h-12 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div> */}

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm border dark:border-slate-700">
              <TabsTrigger
                value="settings"
                className="flex items-center space-x-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white text-slate-600 dark:text-slate-400"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </TabsTrigger>
              {/* <TabsTrigger
                value="outbox"
                className="flex items-center space-x-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white text-slate-600 dark:text-slate-400"
              >
                <Mail className="w-4 h-4" />
                <span>Outbox</span>
              </TabsTrigger> */}
              <TabsTrigger
                value="analytics"
                className="flex items-center space-x-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white text-slate-600 dark:text-slate-400"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </TabsTrigger>
              {/* <TabsTrigger
                value="preview"
                className="flex items-center space-x-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white text-slate-600 dark:text-slate-400"
              >
                <Zap className="w-4 h-4" />
                <span>Preview</span>
              </TabsTrigger> */}
            </TabsList>

            <TabsContent value="settings">
              <DelaySettings
                currentDelay={currentDelay}
                onDelayChange={handleDelayChange}
                onEnabledChange={handleDelayEnabledChange}
              />
            </TabsContent>

            <TabsContent value="outbox">
              <OutboxManager />
            </TabsContent>

            <TabsContent value="analytics">
              <UsageAnalytics />
            </TabsContent>

            <TabsContent value="preview">
              <InEmailPreview currentDelay={currentDelay} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
