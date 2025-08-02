import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Video, 
  Users, 
  DollarSign, 
  Play, 
  Square, 
  Settings,
  Eye,
  Clock,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { LiveStream } from '@/types/database';

const LiveStreamManager: React.FC = () => {
  const { user, profile } = useAuth();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [activeStream, setActiveStream] = useState<LiveStream | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newStream, setNewStream] = useState({
    title: '',
    description: '',
    scheduled_start: ''
  });

  useEffect(() => {
    if (user && profile?.is_creator) {
      fetchStreams();
    }
  }, [user, profile]);

  const fetchStreams = async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('live_streams')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching streams:', error);
      return;
    }

    const normalizedStreams: LiveStream[] = (data || []).map(stream => ({
      id: stream.id,
      title: stream.title,
      description: stream.description || undefined,
      creator_id: stream.creator_id || undefined,
      is_active: stream.is_active || false,
      viewer_count: stream.viewer_count || 0,
      scheduled_start: stream.scheduled_start || undefined,
      actual_start: stream.actual_start || undefined,
      actual_end: stream.actual_end || undefined,
      max_viewers: stream.max_viewers || 0,
      total_tips: stream.total_tips || 0,
      created_at: stream.created_at || new Date().toISOString(),
      updated_at: stream.updated_at || undefined,
      thumbnail_url: stream.thumbnail_url || undefined,
      stream_key: stream.stream_key || undefined,
      rtmp_url: stream.rtmp_url || undefined,
      hls_url: stream.hls_url || undefined
    }));

    setStreams(normalizedStreams);
    const active = normalizedStreams.find(stream => stream.is_active);
    if (active) {
      setActiveStream(active);
    }
  };

  const createStream = async () => {
    if (!newStream.title.trim()) {
      toast.error('Please enter a stream title');
      return;
    }

    setIsCreating(true);
    try {
      const streamKey = `sk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const rtmpUrl = `rtmp://live.platform.com/live/${streamKey}`;
      const hls_url = `https://live.platform.com/hls/${streamKey}/index.m3u8`;

      const { data, error } = await supabase
        .from('live_streams')
        .insert([{
          creator_id: user?.id,
          title: newStream.title,
          description: newStream.description || null,
          stream_key: streamKey,
          rtmp_url: rtmpUrl,
          hls_url: hls_url,
          scheduled_start: newStream.scheduled_start || null
        }])
        .select()
        .single();

      if (error) throw error;

      const normalizedStream: LiveStream = {
        id: data.id,
        title: data.title,
        description: data.description || undefined,
        creator_id: data.creator_id || undefined,
        is_active: data.is_active || false,
        viewer_count: data.viewer_count || 0,
        scheduled_start: data.scheduled_start || undefined,
        actual_start: data.actual_start || undefined,
        actual_end: data.actual_end || undefined,
        max_viewers: data.max_viewers || 0,
        total_tips: data.total_tips || 0,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || undefined,
        thumbnail_url: data.thumbnail_url || undefined,
        stream_key: data.stream_key || undefined,
        rtmp_url: data.rtmp_url || undefined,
        hls_url: data.hls_url || undefined
      };

      setStreams([normalizedStream, ...streams]);
      setNewStream({ title: '', description: '', scheduled_start: '' });
      toast.success('Live stream created successfully!');
    } catch (error) {
      console.error('Error creating stream:', error);
      toast.error('Failed to create live stream');
    } finally {
      setIsCreating(false);
    }
  };

  const startStream = async (streamId: string) => {
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .update({ 
          is_active: true, 
          actual_start: new Date().toISOString(),
          viewer_count: 0 
        })
        .eq('id', streamId)
        .select()
        .single();

      if (error) throw error;

      const normalizedStream: LiveStream = {
        id: data.id,
        title: data.title,
        description: data.description || undefined,
        creator_id: data.creator_id || undefined,
        is_active: data.is_active || false,
        viewer_count: data.viewer_count || 0,
        scheduled_start: data.scheduled_start || undefined,
        actual_start: data.actual_start || undefined,
        actual_end: data.actual_end || undefined,
        max_viewers: data.max_viewers || 0,
        total_tips: data.total_tips || 0,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || undefined,
        thumbnail_url: data.thumbnail_url || undefined,
        stream_key: data.stream_key || undefined,
        rtmp_url: data.rtmp_url || undefined,
        hls_url: data.hls_url || undefined
      };

      setActiveStream(normalizedStream);
      setStreams(streams.map(s => s.id === streamId ? normalizedStream : s));
      toast.success('Live stream started!');
    } catch (error) {
      console.error('Error starting stream:', error);
      toast.error('Failed to start stream');
    }
  };

  const endStream = async (streamId: string) => {
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .update({
          is_active: false,
          actual_end: new Date().toISOString()
        })
        .eq('id', streamId)
        .select()
        .single();

      if (error) throw error;

      const normalizedStream: LiveStream = {
        id: data.id,
        title: data.title,
        description: data.description || undefined,
        creator_id: data.creator_id || undefined,
        is_active: data.is_active || false,
        viewer_count: data.viewer_count || 0,
        scheduled_start: data.scheduled_start || undefined,
        actual_start: data.actual_start || undefined,
        actual_end: data.actual_end || undefined,
        max_viewers: data.max_viewers || 0,
        total_tips: data.total_tips || 0,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || undefined,
        thumbnail_url: data.thumbnail_url || undefined,
        stream_key: data.stream_key || undefined,
        rtmp_url: data.rtmp_url || undefined,
        hls_url: data.hls_url || undefined
      };

      setActiveStream(null);
      setStreams(streams.map(s => s.id === streamId ? normalizedStream : s));
      toast.success('Live stream ended');
    } catch (error) {
      console.error('Error ending stream:', error);
      toast.error('Failed to end stream');
    }
  };

  if (!profile?.is_creator) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Creator Account Required</h3>
          <p className="text-gray-600">You need a creator account to manage live streams.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Stream Status */}
      {activeStream && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-700">
              <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
              <span>LIVE NOW</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{activeStream.title}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {activeStream.viewer_count} viewers
                  </span>
                  <span className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    ${((activeStream.total_tips || 0) / 100).toFixed(2)} tips
                  </span>
                </div>
              </div>
              <Button 
                variant="destructive" 
                onClick={() => endStream(activeStream.id)}
              >
                <Square className="h-4 w-4 mr-2" />
                End Stream
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create New Stream */}
      <Card>
        <CardHeader>
          <CardTitle>Create Live Stream</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Stream title"
            value={newStream.title}
            onChange={(e) => setNewStream({ ...newStream, title: e.target.value })}
          />
          <Textarea
            placeholder="Stream description (optional)"
            value={newStream.description}
            onChange={(e) => setNewStream({ ...newStream, description: e.target.value })}
          />
          <Input
            type="datetime-local"
            placeholder="Schedule start time (optional)"
            value={newStream.scheduled_start}
            onChange={(e) => setNewStream({ ...newStream, scheduled_start: e.target.value })}
          />
          <Button 
            onClick={createStream} 
            disabled={isCreating || !newStream.title.trim()}
            className="w-full"
          >
            <Video className="h-4 w-4 mr-2" />
            {isCreating ? 'Creating...' : 'Create Stream'}
          </Button>
        </CardContent>
      </Card>

      {/* Stream List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Live Streams</CardTitle>
        </CardHeader>
        <CardContent>
          {streams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No live streams yet. Create your first stream above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {streams.map((stream) => (
                <div key={stream.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium">{stream.title}</h4>
                        {stream.is_active ? (
                          <Badge variant="destructive">Live</Badge>
                        ) : stream.actual_start ? (
                          <Badge variant="secondary">Ended</Badge>
                        ) : (
                          <Badge variant="outline">Ready</Badge>
                        )}
                      </div>
                      {stream.description && (
                        <p className="text-sm text-gray-600 mb-2">{stream.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          Max: {stream.max_viewers || 0}
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="h-3 w-3 mr-1" />
                          ${((stream.total_tips || 0) / 100).toFixed(2)}
                        </span>
                        {stream.scheduled_start && (
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(stream.scheduled_start).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!stream.is_active && !stream.actual_start && (
                        <Button 
                          size="sm" 
                          onClick={() => startStream(stream.id)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {stream.stream_key && (
                    <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                      <p className="font-medium mb-1">Stream Settings:</p>
                      <p className="text-xs text-gray-600">RTMP URL: {stream.rtmp_url}</p>
                      <p className="text-xs text-gray-600">Stream Key: {stream.stream_key}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveStreamManager;