
import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import LiveStream from '@/components/LiveStream';
import LiveStreamManager from '@/components/LiveStreamManager';

const LiveStreamPage: React.FC = () => {
  const { streamId } = useParams();
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {streamId ? (
            <LiveStream 
              streamId={streamId} 
              isCreator={profile?.is_creator}
            />
          ) : (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-900">Live Streaming</h1>
                <p className="text-gray-600 mt-2">
                  Manage your live streams and engage with your audience in real-time
                </p>
              </div>
              
              <LiveStreamManager />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveStreamPage;
