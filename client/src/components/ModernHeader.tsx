import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Bell, 
  MessageCircle, 
  User, 
  Settings, 
  LogOut,
  Home,
  Bookmark,
  DollarSign,
  BarChart3,
  Camera,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

interface ModernHeaderProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
}

const ModernHeader: React.FC<ModernHeaderProps> = ({ searchQuery = '', setSearchQuery }) => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications] = useState(3); // Mock notification count

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (setSearchQuery) {
      setSearchQuery(e.target.value);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <header className="bg-[#0f1015] border-b border-[#2c2e36] sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/dashboard" className="text-2xl font-bold text-[#00aff0] hover:text-[#0095cc] transition-colors">
            KikStars
          </Link>
        </div>

        {/* Search */}
        <div className="hidden md:flex relative w-1/3 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search creators and content..."
            className="pl-10 bg-[#1e2029] border-[#2c2e36] text-white w-full rounded-full focus:ring-[#00aff0] focus:border-[#00aff0]"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        {/* Right side navigation */}
        <div className="flex items-center space-x-4">
          {/* Navigation Buttons */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex text-gray-300 hover:text-white"
            onClick={() => handleNavigation('/dashboard')}
          >
            <Home className="h-5 w-5 mr-2" />
            Home
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative text-gray-300 hover:text-white"
            onClick={() => handleNavigation('/notifications')}
          >
            <Bell className="h-6 w-6" />
            {notifications > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {notifications}
              </Badge>
            )}
          </Button>

          {/* Messages */}
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-300 hover:text-white"
            onClick={() => handleNavigation('/messages')}
          >
            <MessageCircle className="h-6 w-6" />
          </Button>

          {/* Bookmarks */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex text-gray-300 hover:text-white"
            onClick={() => handleNavigation('/bookmarks')}
          >
            <Bookmark className="h-6 w-6" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <div className="h-8 w-8 rounded-full overflow-hidden">
                  <img 
                    src={profile?.avatar_url || '/placeholder.svg'} 
                    alt={profile?.display_name || 'User'}
                    className="w-full h-full object-cover"
                  />
                </div>
                {profile?.is_verified && (
                  <div className="absolute -bottom-1 -right-1 bg-[#00aff0] rounded-full p-1">
                    <Star className="w-2 h-2 text-white" />
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-[#1e2029] border-[#2c2e36]" align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-white">{profile?.display_name}</p>
                  <p className="w-[200px] truncate text-sm text-gray-400">
                    @{profile?.username}
                  </p>
                  {profile?.is_creator && (
                    <Badge variant="secondary" className="w-fit bg-[#00aff0] text-white">
                      Creator
                    </Badge>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator className="bg-[#2c2e36]" />
              
              <DropdownMenuItem 
                className="text-white hover:bg-[#252836] cursor-pointer"
                onClick={() => handleNavigation(`/profile/${user.id}`)}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              
              {profile?.is_creator && (
                <>
                  <DropdownMenuItem 
                    className="text-white hover:bg-[#252836] cursor-pointer"
                    onClick={() => handleNavigation(`/creator/${profile.username}`)}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    <span>Creator Studio</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    className="text-white hover:bg-[#252836] cursor-pointer"
                    onClick={() => handleNavigation('/analytics')}
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Analytics</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    className="text-white hover:bg-[#252836] cursor-pointer"
                    onClick={() => handleNavigation('/earnings')}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    <span>Earnings</span>
                  </DropdownMenuItem>
                </>
              )}
              
              <DropdownMenuItem 
                className="text-white hover:bg-[#252836] cursor-pointer"
                onClick={() => handleNavigation('/subscriptions')}
              >
                <Star className="mr-2 h-4 w-4" />
                <span>Subscriptions</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                className="text-white hover:bg-[#252836] cursor-pointer"
                onClick={() => handleNavigation('/settings')}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-[#2c2e36]" />
              
              <DropdownMenuItem 
                className="text-red-400 hover:bg-[#252836] cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search creators and content..."
            className="pl-10 bg-[#1e2029] border-[#2c2e36] text-white w-full rounded-full focus:ring-[#00aff0] focus:border-[#00aff0]"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>
    </header>
  );
};

export default ModernHeader;