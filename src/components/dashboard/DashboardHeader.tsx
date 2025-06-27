
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface DashboardHeaderProps {
  user: any;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  searchQuery,
  onSearchChange
}) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back{user ? `, ${user.email?.split('@')[0]}` : ''}!
          </h1>
          <p className="text-gray-300 mt-2">
            Discover exclusive adult content from creators around the world
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search creators, content..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 w-80 bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
