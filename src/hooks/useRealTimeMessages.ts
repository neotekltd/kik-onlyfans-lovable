
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content?: string;
  message_type: string;
  media_url?: string;
  is_ppv: boolean;
  ppv_price?: number;
  created_at: string;
  is_read: boolean;
}

export const useRealTimeMessages = (conversationUserId?: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !conversationUserId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      try {
        const { data: messagesData } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},recipient_id.eq.${conversationUserId}),and(sender_id.eq.${conversationUserId},recipient_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        setMessages(messagesData as Message[] || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Set up real-time subscription
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${user.id},recipient_id.eq.${conversationUserId}),and(sender_id.eq.${conversationUserId},recipient_id.eq.${user.id}))`
        },
        (payload) => {
          console.log('New message received:', payload);
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${user.id},recipient_id.eq.${conversationUserId}),and(sender_id.eq.${conversationUserId},recipient_id.eq.${user.id}))`
        },
        (payload) => {
          console.log('Message updated:', payload);
          setMessages(prev => 
            prev.map(msg => 
              msg.id === payload.new.id ? payload.new as Message : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, conversationUserId]);

  const sendMessage = async (content: string, messageType: 'text' | 'media' = 'text', mediaUrl?: string, isPPV = false, ppvPrice?: number) => {
    if (!user || !conversationUserId) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: conversationUserId,
          content: messageType === 'text' ? content : undefined,
          message_type: messageType,
          media_url: mediaUrl,
          is_ppv: isPPV,
          ppv_price: ppvPrice
        });

      return !error;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  const markMessagesAsRead = async () => {
    if (!user || !conversationUserId) return;

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', conversationUserId)
        .eq('recipient_id', user.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    markMessagesAsRead
  };
};
