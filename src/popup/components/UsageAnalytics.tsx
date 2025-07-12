import React from 'react';
import { BarChart3, TrendingUp, Shield, Mail, Clock, Edit, AlertTriangle, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/popup/components/ui/card';
import { Badge } from '@/popup/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const UsageAnalytics: React.FC = () => {
  const weeklyData = [
    { day: 'Mon', emails: 8, touches: 3, prevented: 2 },
    { day: 'Tue', emails: 12, touches: 5, prevented: 3 },
    { day: 'Wed', emails: 15, touches: 7, prevented: 1 },
    { day: 'Thu', emails: 10, touches: 4, prevented: 2 },
    { day: 'Fri', emails: 18, touches: 8, prevented: 4 },
    { day: 'Sat', emails: 3, touches: 1, prevented: 0 },
    { day: 'Sun', emails: 2, touches: 0, prevented: 0 }
  ];

  const delayDistribution = [
    { name: '15s', value: 12, color: '#3b82f6' },
    { name: '30s', value: 24, color: '#6366f1' },
    { name: '60s', value: 45, color: '#8b5cf6' },
    { name: '2m', value: 18, color: '#a855f7' },
    { name: '5m', value: 6, color: '#c084fc' }
  ];

  const stats = [
    {
      title: 'Total Emails Protected',
      value: '1,247',
      change: '+12%',
      trend: 'up',
      icon: Mail,
      color: 'blue'
    },
    {
      title: 'Mistakes Prevented',
      value: '89',
      change: '+8%',
      trend: 'up',
      icon: Shield,
      color: 'emerald'
    },
    {
      title: 'Average Delay Time',
      value: '1m 24s',
      change: '-5%',
      trend: 'down',
      icon: Clock,
      color: 'amber'
    },
    {
      title: 'Emails Edited',
      value: '156',
      change: '+15%',
      trend: 'up',
      icon: Edit,
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Usage Analytics</h2>
                <p className="text-slate-600 dark:text-slate-400">Track your email protection impact</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
              Last 30 days
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
                <Badge 
                  variant={stat.trend === 'up' ? 'default' : 'secondary'}
                  className={stat.trend === 'up' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}
                >
                  {stat.change}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {stat.title}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Weekly Activity</span>
            </CardTitle>
            <CardDescription>
              Emails protected and interactions over the past week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-700" />
                <XAxis dataKey="day" stroke="#64748b" className="dark:stroke-slate-400" fontSize={12} />
                <YAxis stroke="#64748b" className="dark:stroke-slate-400" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  labelStyle={{ color: '#1e293b' }}
                />
                <Bar dataKey="emails" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="touches" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="prevented" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Delay Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Delay Preferences</span>
            </CardTitle>
            <CardDescription>
              Most commonly used delay times
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={delayDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {delayDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {delayDistribution.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Impact Summary */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
              <Shield className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200 mb-2">Protection Impact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">89</div>
                  <div className="text-sm text-emerald-600 dark:text-emerald-400">Mistakes prevented</div>
                  <div className="text-xs text-emerald-500 dark:text-emerald-500 mt-1">7.1% of all emails</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">156</div>
                  <div className="text-sm text-emerald-600 dark:text-emerald-400">Emails edited after delay</div>
                  <div className="text-xs text-emerald-500 dark:text-emerald-500 mt-1">12.5% touched before sending</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">$24K</div>
                  <div className="text-sm text-emerald-600 dark:text-emerald-400">Estimated value saved</div>
                  <div className="text-xs text-emerald-500 dark:text-emerald-500 mt-1">From prevented mistakes</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm bg-blue-50/50 dark:bg-blue-900/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-800 dark:text-blue-200">Peak Usage</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              You send 60% more emails on Fridays. Consider extending your delay time for end-of-week emails.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-amber-50/50 dark:bg-amber-900/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span className="font-medium text-amber-800 dark:text-amber-200">Recommendation</span>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Most of your prevented mistakes happen within 45 seconds. Your current 60s delay is optimal.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UsageAnalytics;
