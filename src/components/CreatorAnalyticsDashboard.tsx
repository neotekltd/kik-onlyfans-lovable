
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  // Real analytics data would come from your analytics API
  const [earningsData, setEarningsData] = useState<any[]>([]);
  const [contentPerformance, setContentPerformance] = useState<any[]>([
    { type: 'Photos', posts: 45, views: 12500, likes: 2800, engagement: 22.4 },
    { type: 'Videos', posts: 12, views: 8900, likes: 2100, engagement: 23.6 },
    { type: 'Live Streams', posts: 6, views: 3200, likes: 850, engagement: 26.6 },
    { type: 'Messages', posts: 89, views: 1200, likes: 320, engagement: 26.7 },
  ]);

  const subscriberGrowth = [
    { month: 'Oct', subscribers: 1200 },
    { month: 'Nov', subscribers: 1450 },
    { month: 'Dec', subscribers: 1680 },
    { month: 'Jan', subscribers: 1920 },
  ];

  const topCountries = [
    { name: 'United States', value: 45, color: '#8884d8' },
    { name: 'United Kingdom', value: 20, color: '#82ca9d' },
    { name: 'Canada', value: 15, color: '#ffc658' },
    { name: 'Australia', value: 12, color: '#ff7300' },
    { name: 'Others', value: 8, color: '#8dd1e1' },
  ];

  const kpis = [
    {
      title: 'Total Earnings',
      value: '$3,847',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Active Subscribers',
      value: '1,920',
      change: '+8.3%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Total Views',
      value: '48.2K',
      change: '+15.7%',
      trend: 'up',
      icon: Eye,
      color: 'text-purple-600'
    },
    {
      title: 'Engagement Rate',
      value: '24.3%',
      change: '-2.1%',
      trend: 'down',
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
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs ${
                    kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {kpi.change}
                  </span>
                  <span className="text-xs text-gray-500">vs last period</span>
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
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={earningsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="subscriptions" stroke="#8884d8" name="Subscriptions" />
                  <Line type="monotone" dataKey="tips" stroke="#82ca9d" name="Tips" />
                  <Line type="monotone" dataKey="ppv" stroke="#ffc658" name="PPV Messages" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscriber Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subscriberGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="subscribers" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contentPerformance.map((content, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {content.type === 'Photos' && <Image className="h-5 w-5 text-blue-500" />}
                      {content.type === 'Videos' && <Video className="h-5 w-5 text-purple-500" />}
                      {content.type === 'Live Streams' && <Video className="h-5 w-5 text-red-500" />}
                      {content.type === 'Messages' && <MessageCircle className="h-5 w-5 text-green-500" />}
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
                        <p className="font-medium">{content.engagement}%</p>
                        <p className="text-gray-500">Engagement</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audience by Country</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={topCountries}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {topCountries.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreatorAnalyticsDashboard;
