
import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import LiveStream from '@/components/LiveStream';

const LiveStreamPage: React.FC = () => {
  const { streamId } = useParams();
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <LiveStream 
            streamId={streamId} 
            isCreator={profile?.is_creator}
          />
        </div>
      </div>
    </div>
  );
};

export default LiveStreamPage;
