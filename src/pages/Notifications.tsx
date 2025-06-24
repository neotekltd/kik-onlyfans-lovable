
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Heart, MessageCircle, UserPlus, DollarSign } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'tip' | 'subscription';
  message: string;
  read: boolean;
  created_at: string;
  actor?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock notifications for now - in a real app, you'd fetch from a notifications table
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'like',
        message: 'liked your post',
        read: false,
        created_at: new Date().toISOString(),
        actor: {
          username: 'user123',
          display_name: 'User 123',
        }
      },
      {
        id: '2',
        type: 'tip',
        message: 'sent you a tip of $10.00',
        read: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        actor: {
          username: 'fan456',
          display_name: 'Fan 456',
        }
      },
      {
        id: '3',
        type: 'follow',
        message: 'started following you',
        read: true,
        created_at: new Date(Date.now() - 7200000).toISOString(),
        actor: {
          username: 'newuser',
          display_name: 'New User',
        }
      },
    ];

    setNotifications(mockNotifications);
    setLoading(false);
  }, [user]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'tip':
      case 'subscription':
        return <DollarSign className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <MainLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-2">
              Stay updated with your latest activity
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              Mark all as read
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your latest notifications and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-center space-x-4 p-4 rounded-lg border ${
                      !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-white'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {notification.actor?.display_name || 'Someone'}
                        </span>
                        <span className="text-gray-600">{notification.message}</span>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Bell className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You'll see notifications here when you have activity.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Notifications;
