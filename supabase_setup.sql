-- KikStars OnlyFans Competitor Database Setup
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  is_creator BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  location TEXT,
  website TEXT,
  twitter TEXT,
  instagram TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creator profiles table
CREATE TABLE IF NOT EXISTS public.creator_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_price INTEGER DEFAULT 999, -- in cents
  is_active BOOLEAN DEFAULT TRUE,
  total_subscribers INTEGER DEFAULT 0,
  total_earnings INTEGER DEFAULT 0,
  total_posts INTEGER DEFAULT 0,
  welcome_message TEXT,
  stripe_account_id TEXT,
  stripe_account_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  content_type TEXT DEFAULT 'photo', -- photo, video, text
  is_ppv BOOLEAN DEFAULT FALSE,
  ppv_price INTEGER DEFAULT 0, -- in cents
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subscriber_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active', -- active, canceled, expired
  amount_paid INTEGER NOT NULL, -- in cents
  billing_cycle TEXT DEFAULT 'monthly', -- monthly, yearly
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subscriber_id, creator_id)
);

-- Tips table
CREATE TABLE IF NOT EXISTS public.tips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tipper_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- in cents
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  is_ppv BOOLEAN DEFAULT FALSE,
  ppv_price INTEGER DEFAULT 0, -- in cents
  is_purchased BOOLEAN DEFAULT FALSE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom content requests table
CREATE TABLE IF NOT EXISTS public.custom_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  fan_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content_type TEXT NOT NULL, -- photo, video, both
  price INTEGER NOT NULL, -- in cents
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, accepted, declined, completed
  is_anonymous BOOLEAN DEFAULT FALSE,
  special_instructions TEXT,
  delivered_content TEXT[] DEFAULT '{}',
  payment_status TEXT DEFAULT 'pending', -- pending, paid, refunded
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Likes table
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_creator_profiles_updated_at BEFORE UPDATE ON creator_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_requests_updated_at BEFORE UPDATE ON custom_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Creator profiles policies
CREATE POLICY "Creator profiles are viewable by everyone" ON creator_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own creator profile" ON creator_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own creator profile" ON creator_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Posts policies
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Creators can insert their own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update their own posts" ON posts FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete their own posts" ON posts FOR DELETE USING (auth.uid() = creator_id);

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions FOR SELECT USING (auth.uid() = subscriber_id OR auth.uid() = creator_id);
CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions FOR INSERT WITH CHECK (auth.uid() = subscriber_id);
CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions FOR UPDATE USING (auth.uid() = subscriber_id);

-- Tips policies
CREATE POLICY "Users can view tips they sent or received" ON tips FOR SELECT USING (auth.uid() = tipper_id OR auth.uid() = creator_id);
CREATE POLICY "Users can insert tips they send" ON tips FOR INSERT WITH CHECK (auth.uid() = tipper_id);

-- Messages policies
CREATE POLICY "Users can view their own messages" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update messages they sent" ON messages FOR UPDATE USING (auth.uid() = sender_id);

-- Custom requests policies
CREATE POLICY "Users can view requests they made or received" ON custom_requests FOR SELECT USING (auth.uid() = fan_id OR auth.uid() = creator_id);
CREATE POLICY "Users can insert requests they make" ON custom_requests FOR INSERT WITH CHECK (auth.uid() = fan_id);
CREATE POLICY "Creators can update requests they received" ON custom_requests FOR UPDATE USING (auth.uid() = creator_id);

-- Likes policies
CREATE POLICY "Users can view all likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own likes" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Users can view all comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Create storage buckets (run these in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true);

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Cover images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "Users can upload their own cover" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own cover" ON storage.objects FOR UPDATE USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Media files are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Users can upload media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own media" ON storage.objects FOR UPDATE USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create a function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, NEW.email, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample data
INSERT INTO public.profiles (id, username, display_name, bio, is_creator) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'sexymodel1', 'Emma Rose', 'Your favorite model 💋 Custom content available!', true),
('550e8400-e29b-41d4-a716-446655440002', 'hotcreator2', 'Jessica Wild', 'Exclusive content just for you! 🔥', true),
('550e8400-e29b-41d4-a716-446655440003', 'cutegirl3', 'Lily Sweet', 'Sweet but naughty 😈 DM for custom requests', true);

INSERT INTO public.creator_profiles (user_id, subscription_price, total_subscribers, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 1999, 1250, true), -- $19.99
('550e8400-e29b-41d4-a716-446655440002', 2999, 890, true),  -- $29.99
('550e8400-e29b-41d4-a716-446655440003', 1499, 2100, true); -- $14.99

INSERT INTO public.posts (creator_id, content, content_type, likes_count, views_count) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Good morning everyone! ☀️ Hope you have an amazing day!', 'text', 45, 320),
('550e8400-e29b-41d4-a716-446655440001', 'New photo set coming soon... 📸✨', 'text', 78, 156),
('550e8400-e29b-41d4-a716-446655440002', 'Just finished my workout 💪 Feeling amazing!', 'text', 92, 421),
('550e8400-e29b-41d4-a716-446655440003', 'Custom content available! DM me for details 😘', 'text', 65, 289);