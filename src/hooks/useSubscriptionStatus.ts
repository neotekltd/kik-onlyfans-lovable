
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionStatus {
  isSubscribed: boolean;
  subscriptionTier?: string;
  subscriptionEnd?: string;
  creatorId?: string;
}

export const useSubscriptionStatus = (creatorId: string) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({
    isSubscribed: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user || !creatorId) {
        setLoading(false);
        return;
      }

      try {
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select(`
            *,
            subscription_plans (
              name,
              price
            )
          `)
          .eq('subscriber_id', user.id)
          .eq('creator_id', creatorId)
          .eq('status', 'active')
          .single();

        if (subscription) {
          setStatus({
            isSubscribed: true,
            subscriptionTier: subscription.subscription_plans?.name,
            subscriptionEnd: subscription.end_date,
            creatorId,
          });
        } else {
          setStatus({
            isSubscribed: false,
            creatorId,
          });
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setStatus({
          isSubscribed: false,
          creatorId,
        });
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [user, creatorId]);

  return { status, loading };
};
