
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  MessageCircle, 
  User, 
  Users, 
  Camera,
  DollarSign,
  Bell,
  Settings,
  LogOut,
  Heart,
  TrendingUp
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: MessageCircle, label: 'Messages', path: '/messages', badge: '24' },
    { icon: Bell, label: 'Notifications', path: '/notifications', badge: '5' },
    { icon: User, label: 'Profile', path: '/profile' },
    ...(user?.isCreator ? [
      { icon: Camera, label: 'Creator Studio', path: '/creator' },
      { icon: TrendingUp, label: 'Analytics', path: '/analytics' },
      { icon: DollarSign, label: 'Earnings', path: '/earnings' }
    ] : [
      { icon: Users, label: 'Subscriptions', path: '/subscriptions' },
      { icon: Heart, label: 'Collections', path: '/collections' }
    ]),
    { icon: Settings, label: 'Settings', path: '/settings' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold">
          <span className="text-brand-600">Kik</span>
          <span className="text-creator-600">OnlyFans</span>
        </h1>
      </div>

      {/* User Profile */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{user?.displayName}</p>
            <p className="text-sm text-gray-500 truncate">@{user?.username}</p>
            {user?.isCreator && (
              <Badge variant="secondary" className="mt-1 text-xs">
                Creator
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Button
              key={item.path}
              variant={isActive ? 'secondary' : 'ghost'}
              className={`w-full justify-start text-left ${
                isActive ? 'bg-brand-50 text-brand-700 border-brand-200' : 'hover:bg-gray-50'
              }`}
              onClick={() => navigate(item.path)}
            >
              <item.icon className="h-5 w-5 mr-3" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto bg-brand-500 text-white text-xs">
                  {item.badge}
                </Badge>
              )}
            </Button>
          );
        })}
      </nav>

      {/* New Post Button */}
      <div className="p-4 border-t border-gray-200">
        <Button 
          className="w-full gradient-bg hover:opacity-90 mb-3"
          onClick={() => navigate(user?.isCreator ? '/creator' : '/dashboard')}
        >
          <Camera className="h-4 w-4 mr-2" />
          {user?.isCreator ? 'New Post' : 'Explore'}
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
