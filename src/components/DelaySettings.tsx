
import React, { useState } from 'react';
import { Clock, Shield, Zap, Check, ChevronRight, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface DelaySettingsProps {
  currentDelay: number;
  onDelayChange: (delay: number) => void;
}

const DelaySettings: React.FC<DelaySettingsProps> = ({ currentDelay, onDelayChange }) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [showMoreSettings, setShowMoreSettings] = useState(false);

  const presetDelays = [
    { value: 15, label: '15s', description: 'Quick review' },
    { value: 30, label: '30s', description: 'Standard' },
    { value: 60, label: '1m', description: 'Recommended' },
    { value: 120, label: '2m', description: 'Extra careful' },
    { value: 300, label: '5m', description: 'Maximum' }
  ];

  const formatDelay = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`.replace(' 0s', '');
  };

  return (
    <div className="space-y-6">
      {/* Main Delay Setting - Minimal Design */}
      <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Delay Duration</CardTitle>
                <CardDescription className="dark:text-slate-400">Time before emails are sent</CardDescription>
              </div>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Current Delay Display - Clean & Minimal */}
            <div className="text-center p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-2xl border border-blue-100 dark:border-blue-800">
              <div className="text-4xl font-light text-blue-600 dark:text-blue-400 mb-2">
                {formatDelay(currentDelay)}
              </div>
              <p className="text-blue-600/70 dark:text-blue-400/70 text-sm">Current delay</p>
            </div>

            {/* Preset Options - Minimal Pills */}
            <div className="flex flex-wrap gap-2 justify-center">
              {presetDelays.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => onDelayChange(preset.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 ${
                    currentDelay === preset.value
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-600'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Slider - Minimal */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Custom</label>
                <span className="text-sm text-slate-500 dark:text-slate-400">{formatDelay(currentDelay)}</span>
              </div>
              <Slider
                value={[currentDelay]}
                onValueChange={(value) => onDelayChange(value[0])}
                max={300}
                min={5}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>5s</span>
                <span>5m</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* More Settings - Collapsible */}
      <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
        <CardHeader>
          <button
            onClick={() => setShowMoreSettings(!showMoreSettings)}
            className="flex items-center justify-between w-full text-left hover:bg-slate-50 dark:hover:bg-slate-700 -m-2 p-2 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <Zap className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-900 dark:text-slate-100">More Settings</CardTitle>
                <CardDescription className="dark:text-slate-400">Advanced delay options</CardDescription>
              </div>
            </div>
            {showMoreSettings ? (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </CardHeader>
        {showMoreSettings && (
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-300">Smart weekend delays</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Extend delay for weekend emails</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-300">High-priority bypass</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Skip delay for urgent emails</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-300">Sound notifications</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Audio alerts during delay</p>
                </div>
                <Switch />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Minimal Tips */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-200 dark:border-emerald-800">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2">Protection Tips</h3>
              <ul className="text-sm text-emerald-700 dark:text-emerald-300 space-y-1">
                <li>• 60 seconds provides the perfect balance</li>
                <li>• Edit or cancel emails during the delay</li>
                <li>• Weekend delays prevent after-hours sends</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DelaySettings;
