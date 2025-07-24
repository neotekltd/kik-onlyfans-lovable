
import { supabase } from '@/integrations/supabase/client';

export type NotificationType = 
  | 'tip' 
  | 'subscription' 
  | 'like' 
  | 'comment' 
  | 'live_stream' 
  | 'message' 
  | 'payout'
  | 'follow';

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  data?: any;
}

export const createNotification = async (notificationData: CreateNotificationData) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data
      }]);

    if (error) {
      console.error('Error creating notification:', error);
    }
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const createTipNotification = async (
  creatorId: string,
  tipperName: string,
  amount: number,
  message?: string
) => {
  await createNotification({
    userId: creatorId,
    type: 'tip',
    title: `New tip from ${tipperName}`,
    message: `You received $${(amount / 100).toFixed(2)}${message ? ` with message: "${message}"` : ''}`,
    data: { amount, tipperName, message }
  });
};

export const createSubscriptionNotification = async (
  creatorId: string,
  subscriberName: string,
  planName: string
) => {
  await createNotification({
    userId: creatorId,
    type: 'subscription',
    title: 'New subscriber!',
    message: `${subscriberName} subscribed to your ${planName} plan`,
    data: { subscriberName, planName }
  });
};

export const createLikeNotification = async (
  creatorId: string,
  likerName: string,
  postTitle: string
) => {
  await createNotification({
    userId: creatorId,
    type: 'like',
    title: 'New like on your post',
    message: `${likerName} liked your post "${postTitle}"`,
    data: { likerName, postTitle }
  });
};

export const createCommentNotification = async (
  creatorId: string,
  commenterName: string,
  postTitle: string,
  comment: string
) => {
  await createNotification({
    userId: creatorId,
    type: 'comment',
    title: 'New comment on your post',
    message: `${commenterName} commented on "${postTitle}": ${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}`,
    data: { commenterName, postTitle, comment }
  });
};

export const createLiveStreamNotification = async (
  subscriberId: string,
  creatorName: string,
  streamTitle: string
) => {
  await createNotification({
    userId: subscriberId,
    type: 'live_stream',
    title: `${creatorName} is live!`,
    message: `"${streamTitle}" - Join now to watch`,
    data: { creatorName, streamTitle }
  });
};

export const createFollowNotification = async (
  creatorId: string,
  followerName: string
) => {
  await createNotification({
    userId: creatorId,
    type: 'follow',
    title: 'New follower!',
    message: `${followerName} started following you`,
    data: { followerName }
  });
};

export const createPayoutNotification = async (
  creatorId: string,
  amount: number,
  status: string
) => {
  await createNotification({
    userId: creatorId,
    type: 'payout',
    title: status === 'completed' ? 'Payout completed' : 'Payout processing',
    message: `Your payout of $${(amount / 100).toFixed(2)} is ${status}`,
    data: { amount, status }
  });
};
