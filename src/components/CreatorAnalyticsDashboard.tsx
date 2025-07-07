
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserDashboard } from '@/hooks/useUserDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  DollarSign, 
  Users, 
  Eye, 
  Heart, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  MessageCircle,
  Video,
  Image
} from 'lucide-react';

const CreatorAnalyticsDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { stats, loading } = useUserDashboard();
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  if (!profile?.is_creator) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold mb-2">Creator Account Required</h3>
        <p className="text-gray-600">You need a creator account to access analytics.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Earnings',
      value: `$${(stats.totalEarnings / 100).toFixed(2)}`,
      change: stats.monthlyEarnings > 0 ? `+$${(stats.monthlyEarnings / 100).toFixed(2)}` : '$0.00',
      trend: stats.monthlyEarnings > 0 ? 'up' : 'neutral',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Active Subscribers',
      value: stats.totalSubscribers.toLocaleString(),
      change: stats.recentSubscribers > 0 ? `+${stats.recentSubscribers}` : 'No new subscribers',
      trend: stats.recentSubscribers > 0 ? 'up' : 'neutral',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Total Views',
      value: stats.totalViews.toLocaleString(),
      change: `${stats.totalPosts} posts`,
      trend: 'neutral',
      icon: Eye,
      color: 'text-purple-600'
    },
    {
      title: 'Engagement Rate',
      value: `${stats.engagementRate.toFixed(1)}%`,
      change: 'avg per post',
      trend: stats.engagementRate > 10 ? 'up' : 'neutral',
      icon: Heart,
      color: 'text-pink-600'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Track your performance and earnings</p>
        </div>
        <div className="flex items-center space-x-2">
          {['7d', '30d', '90d'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 text-sm rounded-md ${
                selectedPeriod === period
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {kpi.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
                <div className="flex items-center space-x-1 mt-1">
                  {kpi.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : kpi.trend === 'down' ? (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  ) : null}
                  <span className={`text-xs ${
                    kpi.trend === 'up' ? 'text-green-600' : 
                    kpi.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {kpi.change}
                  </span>
                  {kpi.trend !== 'neutral' && (
                    <span className="text-xs text-gray-500">vs last period</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="earnings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>

        <TabsContent value="earnings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Earnings Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="earnings" stroke="#8884d8" name="Earnings ($)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No earnings data yet. Start creating content to see your progress!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscriber Growth</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="subscribers" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No subscriber data yet. Grow your audience to see analytics!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.contentPerformance.length > 0 ? (
                <div className="space-y-4">
                  {stats.contentPerformance.map((content, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {content.type === 'Photos' && <Image className="h-5 w-5 text-blue-500" />}
                        {content.type === 'Videos' && <Video className="h-5 w-5 text-purple-500" />}
                        {content.type === 'Audios' && <Video className="h-5 w-5 text-green-500" />}
                        <div>
                          <h4 className="font-medium">{content.type}</h4>
                          <p className="text-sm text-gray-600">{content.posts} posts</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <p className="font-medium">{content.views.toLocaleString()}</p>
                          <p className="text-gray-500">Views</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{content.likes.toLocaleString()}</p>
                          <p className="text-gray-500">Likes</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{content.engagement.toFixed(1)}%</p>
                          <p className="text-gray-500">Engagement</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No content performance data yet.</p>
                  <p className="text-sm mt-1">Upload some content to see how it performs!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audience Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <p>Demographic data coming soon!</p>
                <p className="text-sm mt-1">We're working on bringing you detailed audience insights.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreatorAnalyticsDashboard;
