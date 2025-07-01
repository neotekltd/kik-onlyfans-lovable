
-- Add live streaming tables
CREATE TABLE public.live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT false,
  viewer_count INTEGER DEFAULT 0,
  stream_key TEXT UNIQUE,
  rtmp_url TEXT,
  hls_url TEXT,
  thumbnail_url TEXT,
  scheduled_start TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  max_viewers INTEGER DEFAULT 0,
  total_tips INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add content collections/playlists
CREATE TABLE public.content_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  price INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Link posts to collections
CREATE TABLE public.collection_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES public.content_collections(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(collection_id, post_id)
);

-- Add notifications system
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'tip', 'subscription', 'like', 'comment', 'live_stream', 'message', 'payout'
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add user activity tracking
CREATE TABLE public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'login', 'view_post', 'like', 'comment', 'tip', 'subscribe'
  target_id UUID, -- ID of the target (post, user, etc.)
  target_type TEXT, -- 'post', 'user', 'live_stream'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add content analytics
CREATE TABLE public.content_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL, -- 'post', 'live_stream', 'message'
  metric_type TEXT NOT NULL, -- 'view', 'like', 'comment', 'share', 'tip'
  value INTEGER DEFAULT 1,
  user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add revenue tracking
CREATE TABLE public.revenue_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, -- 'tip', 'subscription', 'ppv', 'live_stream'
  source_id UUID,
  amount INTEGER NOT NULL,
  platform_fee INTEGER DEFAULT 0,
  net_amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  processed_at TIMESTAMPTZ DEFAULT now(),
  payout_id UUID REFERENCES public.payouts(id)
);

-- Enable RLS on all new tables
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for live streams
CREATE POLICY "Users can view public live streams" ON public.live_streams
  FOR SELECT USING (is_active = true);

CREATE POLICY "Creators can manage their live streams" ON public.live_streams
  FOR ALL USING (creator_id = auth.uid());

-- Create RLS policies for content collections
CREATE POLICY "Users can view public collections" ON public.content_collections
  FOR SELECT USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Creators can manage their collections" ON public.content_collections
  FOR ALL USING (creator_id = auth.uid());

-- Create RLS policies for notifications
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for user activity
CREATE POLICY "Users can view their activity" ON public.user_activity
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert activity" ON public.user_activity
  FOR INSERT WITH CHECK (true);

-- Create RLS policies for content analytics
CREATE POLICY "Creators can view their content analytics" ON public.content_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.posts WHERE id = content_id AND creator_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.live_streams WHERE id = content_id AND creator_id = auth.uid()
    )
  );

CREATE POLICY "System can insert analytics" ON public.content_analytics
  FOR INSERT WITH CHECK (true);

-- Create RLS policies for revenue records
CREATE POLICY "Creators can view their revenue" ON public.revenue_records
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "System can insert revenue records" ON public.revenue_records
  FOR INSERT WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX idx_live_streams_creator ON public.live_streams(creator_id);
CREATE INDEX idx_live_streams_active ON public.live_streams(is_active);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_user_activity_user ON public.user_activity(user_id, created_at DESC);
CREATE INDEX idx_content_analytics_content ON public.content_analytics(content_id, content_type);
CREATE INDEX idx_revenue_records_creator ON public.revenue_records(creator_id, processed_at DESC);

-- Add updated_at triggers
CREATE TRIGGER update_live_streams_updated_at
  BEFORE UPDATE ON public.live_streams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_collections_updated_at
  BEFORE UPDATE ON public.content_collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
