import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Search, 
  MessageCircle, 
  Bell, 
  User, 
  Settings, 
  Heart,
  Bookmark,
  DollarSign,
  BarChart,
  Users,
  Calendar,
  Star,
  TrendingUp,
  Plus
} from 'lucide-react';

interface Creator {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  is_verified: boolean;
  total_subscribers?: number;
  subscription_price?: number;
}

interface ModernSidebarProps {
  creators: Creator[];
  isCreator?: boolean;
}

const ModernSidebar: React.FC<ModernSidebarProps> = ({ creators, isCreator = false }) => {
  const location = useLocation();

  const mainNavItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/notifications', icon: Bell, label: 'Notifications' },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/collections', icon: Bookmark, label: 'Collections' },
    { path: '/subscriptions', icon: Heart, label: 'Subscriptions' },
  ];

  const creatorNavItems = [
    { path: '/creator', icon: Plus, label: 'Create' },
    { path: '/analytics', icon: BarChart, label: 'Analytics' },
    { path: '/earnings', icon: DollarSign, label: 'Earnings' },
    { path: '/live', icon: Calendar, label: 'Live Streams' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-64 h-screen bg-background border-r border-border/50 overflow-y-auto">
      <div className="p-6">
        {/* Logo */}
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            ContentFans
          </span>
        </div>

        {/* Main Navigation */}
        <nav className="space-y-2 mb-8">
          {mainNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Creator Navigation */}
        {isCreator && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-3">
              Creator Tools
            </h3>
            <nav className="space-y-2">
              {creatorNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Suggested Creators */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-3">
            Suggested Creators
          </h3>
          <div className="space-y-3">
            {creators.slice(0, 5).map((creator) => (
              <Card key={creator.id} className="p-3 bg-muted/50 border-border/50">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={creator.avatar_url} alt={creator.display_name} />
                    <AvatarFallback className="bg-gradient-primary text-white text-xs">
                      {creator.display_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1">
                      <p className="text-sm font-medium truncate">{creator.display_name}</p>
                      {creator.is_verified && (
                        <Star className="w-3 h-3 text-blue-500 fill-blue-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      @{creator.username}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {creator.total_subscribers || 0} fans
                      </Badge>
                      {creator.subscription_price && (
                        <Badge variant="outline" className="text-xs">
                          ${creator.subscription_price}/mo
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full mt-2 bg-gradient-primary hover:opacity-90"
                >
                  Subscribe
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Trending Tags */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-3">
            Trending
          </h3>
          <div className="space-y-2">
            {['#fitness', '#lifestyle', '#art', '#music', '#gaming'].map((tag) => (
              <Button
                key={tag}
                variant="ghost"
                className="w-full justify-start px-3 py-2 h-auto text-left"
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm">{tag}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="pt-4 border-t border-border/50">
          <Link
            to="/settings"
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              isActive('/settings')
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ModernSidebar;