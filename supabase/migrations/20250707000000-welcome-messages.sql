-- Create welcome_messages table
CREATE TABLE IF NOT EXISTS public.welcome_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  message_type TEXT NOT NULL DEFAULT 'text',
  is_ppv BOOLEAN NOT NULL DEFAULT false,
  ppv_price INTEGER,
  delay_hours INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sequence_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.welcome_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Creators can view their own welcome messages" 
  ON public.welcome_messages
  FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can insert their own welcome messages" 
  ON public.welcome_messages
  FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own welcome messages" 
  ON public.welcome_messages
  FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their own welcome messages" 
  ON public.welcome_messages
  FOR DELETE
  USING (auth.uid() = creator_id);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.welcome_messages;

-- Create function to send welcome messages
CREATE OR REPLACE FUNCTION public.send_welcome_message()
RETURNS TRIGGER AS $$
DECLARE
  welcome_message RECORD;
BEGIN
  -- For each active welcome message from the creator
  FOR welcome_message IN 
    SELECT * FROM public.welcome_messages 
    WHERE creator_id = NEW.creator_id 
    AND is_active = true 
    ORDER BY sequence_order ASC
  LOOP
    -- Insert into messages table with delay
    INSERT INTO public.messages (
      sender_id,
      recipient_id,
      content,
      message_type,
      media_url,
      is_ppv,
      ppv_price,
      is_read,
      created_at
    ) VALUES (
      welcome_message.creator_id,
      NEW.subscriber_id,
      welcome_message.content,
      welcome_message.message_type,
      welcome_message.media_url,
      welcome_message.is_ppv,
      welcome_message.ppv_price,
      false,
      -- Add delay if specified
      CASE 
        WHEN welcome_message.delay_hours > 0 THEN 
          now() + (welcome_message.delay_hours || ' hours')::interval
        ELSE 
          now() 
      END
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on user_subscriptions
CREATE TRIGGER trigger_send_welcome_message
  AFTER INSERT ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_message();