
-- First, let's check what RLS policies already exist and drop them if needed
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop existing policies if they exist
    FOR r IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END
$$;

-- Enable Row Level Security on all tables (safe to run multiple times)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppv_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT CASE 
    WHEN is_creator THEN 'creator'
    ELSE 'user'
  END
  FROM public.profiles 
  WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_subscribed_to_creator(subscriber_id uuid, creator_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_subscriptions 
    WHERE subscriber_id = $1 
    AND creator_id = $2 
    AND status = 'active' 
    AND end_date > now()
  );
$$;

-- RLS Policies for profiles table
CREATE POLICY "Users can view all public profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for creator_profiles table
CREATE POLICY "Anyone can view creator profiles" ON public.creator_profiles
  FOR SELECT USING (true);

CREATE POLICY "Creators can update own profile" ON public.creator_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Creators can insert own profile" ON public.creator_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for posts table
CREATE POLICY "Anyone can view published posts" ON public.posts
  FOR SELECT USING (is_published = true);

CREATE POLICY "Creators can view own posts" ON public.posts
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Creators can insert own posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own posts" ON public.posts
  FOR DELETE USING (auth.uid() = creator_id);

-- RLS Policies for post_likes table
CREATE POLICY "Users can view all likes" ON public.post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own likes" ON public.post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON public.post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for post_comments table
CREATE POLICY "Users can view all comments" ON public.post_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own comments" ON public.post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.post_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for follows table
CREATE POLICY "Users can view all follows" ON public.follows
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own follows" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

-- RLS Policies for messages table
CREATE POLICY "Users can view messages they sent or received" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert messages they send" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update messages they received" ON public.messages
  FOR UPDATE USING (auth.uid() = recipient_id);

-- RLS Policies for user_subscriptions table
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = subscriber_id OR auth.uid() = creator_id);

CREATE POLICY "Users can insert own subscriptions" ON public.user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = subscriber_id);

CREATE POLICY "Users can update own subscriptions" ON public.user_subscriptions
  FOR UPDATE USING (auth.uid() = subscriber_id);

-- RLS Policies for subscription_plans table
CREATE POLICY "Anyone can view active subscription plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Creators can view own plans" ON public.subscription_plans
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Creators can insert own plans" ON public.subscription_plans
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own plans" ON public.subscription_plans
  FOR UPDATE USING (auth.uid() = creator_id);

-- RLS Policies for tips table
CREATE POLICY "Users can view tips they sent or received" ON public.tips
  FOR SELECT USING (auth.uid() = tipper_id OR auth.uid() = creator_id);

CREATE POLICY "Users can insert tips they send" ON public.tips
  FOR INSERT WITH CHECK (auth.uid() = tipper_id);

-- RLS Policies for ppv_purchases table
CREATE POLICY "Users can view own purchases" ON public.ppv_purchases
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can insert own purchases" ON public.ppv_purchases
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- RLS Policies for payouts table
CREATE POLICY "Creators can view own payouts" ON public.payouts
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "System can insert payouts" ON public.payouts
  FOR INSERT WITH CHECK (true);

-- RLS Policies for content_reports table
CREATE POLICY "Users can view own reports" ON public.content_reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Users can insert reports" ON public.content_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Create storage buckets (only if they don't exist)
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public) VALUES 
      ('avatars', 'avatars', true)
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO storage.buckets (id, name, public) VALUES 
      ('covers', 'covers', true)
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO storage.buckets (id, name, public) VALUES 
      ('posts', 'posts', false)
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO storage.buckets (id, name, public) VALUES 
      ('messages', 'messages', false)
    ON CONFLICT (id) DO NOTHING;
END
$$;

-- Drop existing storage policies before creating new ones
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
    END LOOP;
END
$$;

-- Storage policies for avatars bucket (public)
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatars" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatars" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for covers bucket (public)
CREATE POLICY "Anyone can view covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'covers');

CREATE POLICY "Users can upload covers" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own covers" ON storage.objects
  FOR UPDATE USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own covers" ON storage.objects
  FOR DELETE USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for posts bucket (private)
CREATE POLICY "Creators can view own post media" ON storage.objects
  FOR SELECT USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Subscribers can view post media" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'posts' AND 
    public.is_subscribed_to_creator(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Creators can upload post media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Creators can update own post media" ON storage.objects
  FOR UPDATE USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Creators can delete own post media" ON storage.objects
  FOR DELETE USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for messages bucket (private)
CREATE POLICY "Users can view message media they sent or received" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'messages' AND 
    (auth.uid()::text = (storage.foldername(name))[1] OR 
     auth.uid()::text = (storage.foldername(name))[2])
  );

CREATE POLICY "Users can upload message media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'messages' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Database functions and triggers
CREATE OR REPLACE FUNCTION public.update_creator_stats()
RETURNS trigger AS $$
BEGIN
  -- Update total_posts count
  IF TG_TABLE_NAME = 'posts' THEN
    IF TG_OP = 'INSERT' AND NEW.is_published THEN
      UPDATE public.creator_profiles 
      SET total_posts = total_posts + 1
      WHERE user_id = NEW.creator_id;
    ELSIF TG_OP = 'DELETE' AND OLD.is_published THEN
      UPDATE public.creator_profiles 
      SET total_posts = total_posts - 1
      WHERE user_id = OLD.creator_id;
    ELSIF TG_OP = 'UPDATE' THEN
      IF OLD.is_published AND NOT NEW.is_published THEN
        UPDATE public.creator_profiles 
        SET total_posts = total_posts - 1
        WHERE user_id = NEW.creator_id;
      ELSIF NOT OLD.is_published AND NEW.is_published THEN
        UPDATE public.creator_profiles 
        SET total_posts = total_posts + 1
        WHERE user_id = NEW.creator_id;
      END IF;
    END IF;
  END IF;

  -- Update total_subscribers count
  IF TG_TABLE_NAME = 'user_subscriptions' THEN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
      UPDATE public.creator_profiles 
      SET total_subscribers = total_subscribers + 1
      WHERE user_id = NEW.creator_id;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
      UPDATE public.creator_profiles 
      SET total_subscribers = total_subscribers - 1
      WHERE user_id = OLD.creator_id;
    ELSIF TG_OP = 'UPDATE' THEN
      IF OLD.status = 'active' AND NEW.status != 'active' THEN
        UPDATE public.creator_profiles 
        SET total_subscribers = total_subscribers - 1
        WHERE user_id = NEW.creator_id;
      ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
        UPDATE public.creator_profiles 
        SET total_subscribers = total_subscribers + 1
        WHERE user_id = NEW.creator_id;
      END IF;
    END IF;
  END IF;

  -- Update total_earnings
  IF TG_TABLE_NAME = 'tips' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.creator_profiles 
      SET total_earnings = total_earnings + NEW.amount
      WHERE user_id = NEW.creator_id;
    END IF;
  END IF;

  IF TG_TABLE_NAME = 'ppv_purchases' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.creator_profiles 
      SET total_earnings = total_earnings + NEW.amount
      WHERE user_id = NEW.seller_id;
    END IF;
  END IF;

  IF TG_TABLE_NAME = 'user_subscriptions' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.creator_profiles 
      SET total_earnings = total_earnings + NEW.amount_paid
      WHERE user_id = NEW.creator_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers before creating new ones
DROP TRIGGER IF EXISTS update_creator_stats_posts ON public.posts;
DROP TRIGGER IF EXISTS update_creator_stats_subscriptions ON public.user_subscriptions;
DROP TRIGGER IF EXISTS update_creator_stats_tips ON public.tips;
DROP TRIGGER IF EXISTS update_creator_stats_ppv ON public.ppv_purchases;
DROP TRIGGER IF EXISTS update_post_like_counts ON public.post_likes;
DROP TRIGGER IF EXISTS update_post_comment_counts ON public.post_comments;

-- Create triggers for updating creator stats
CREATE TRIGGER update_creator_stats_posts
  AFTER INSERT OR UPDATE OR DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_creator_stats();

CREATE TRIGGER update_creator_stats_subscriptions
  AFTER INSERT OR UPDATE OR DELETE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_creator_stats();

CREATE TRIGGER update_creator_stats_tips
  AFTER INSERT ON public.tips
  FOR EACH ROW EXECUTE FUNCTION public.update_creator_stats();

CREATE TRIGGER update_creator_stats_ppv
  AFTER INSERT ON public.ppv_purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_creator_stats();

-- Function to update post engagement counts
CREATE OR REPLACE FUNCTION public.update_post_counts()
RETURNS trigger AS $$
BEGIN
  IF TG_TABLE_NAME = 'post_likes' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.posts 
      SET like_count = like_count + 1
      WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.posts 
      SET like_count = like_count - 1
      WHERE id = OLD.post_id;
    END IF;
  END IF;

  IF TG_TABLE_NAME = 'post_comments' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.posts 
      SET comment_count = comment_count + 1
      WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.posts 
      SET comment_count = comment_count - 1
      WHERE id = OLD.post_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating post counts
CREATE TRIGGER update_post_like_counts
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_counts();

CREATE TRIGGER update_post_comment_counts
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_counts();

-- Enable realtime for key tables (safe to run multiple times)
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.post_likes REPLICA IDENTITY FULL;
ALTER TABLE public.post_comments REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.user_subscriptions REPLICA IDENTITY FULL;
ALTER TABLE public.follows REPLICA IDENTITY FULL;

-- Add tables to realtime publication (safe to run multiple times)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_subscriptions;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END
$$;

-- Create indexes for better performance (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_posts_creator_published ON public.posts(creator_id, is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_published_created ON public.posts(is_published, created_at DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_subscriber ON public.user_subscriptions(subscriber_id, status, end_date);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_creator ON public.user_subscriptions(creator_id, status, end_date);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_post ON public.post_likes(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id, created_at DESC);
