
import { supabase } from '@/integrations/supabase/client';

export interface RevenueRecord {
  sourceType: 'tip' | 'subscription' | 'ppv' | 'live_stream';
  sourceId: string;
  amount: number;
  platformFee?: number;
  currency?: string;
}

export const recordRevenue = async (
  creatorId: string,
  revenueData: RevenueRecord
) => {
  try {
    const platformFee = revenueData.platformFee || Math.floor(revenueData.amount * 0.15); // 15% platform fee
    const netAmount = revenueData.amount - platformFee;

    const { error } = await supabase
      .from('revenue_records')
      .insert([{
        creator_id: creatorId,
        source_type: revenueData.sourceType,
        source_id: revenueData.sourceId,
        amount: revenueData.amount,
        platform_fee: platformFee,
        net_amount: netAmount,
        currency: revenueData.currency || 'usd'
      }]);

    if (error) {
      console.error('Error recording revenue:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error recording revenue:', error);
    return false;
  }
};

export const getCreatorRevenue = async (
  creatorId: string,
  timeRange?: { start: Date; end: Date }
) => {
  try {
    let query = supabase
      .from('revenue_records')
      .select('*')
      .eq('creator_id', creatorId);

    if (timeRange) {
      query = query
        .gte('processed_at', timeRange.start.toISOString())
        .lte('processed_at', timeRange.end.toISOString());
    }

    const { data, error } = await query.order('processed_at', { ascending: false });

    if (error) throw error;

    const totalRevenue = data?.reduce((sum, record) => sum + record.net_amount, 0) || 0;
    const totalFees = data?.reduce((sum, record) => sum + (record.platform_fee || 0), 0) || 0;
    
    const revenueBySource = data?.reduce((acc, record) => {
      acc[record.source_type] = (acc[record.source_type] || 0) + record.net_amount;
      return acc;
    }, {} as Record<string, number>) || {};

    return {
      totalRevenue,
      totalFees,
      revenueBySource,
      records: data || []
    };
  } catch (error) {
    console.error('Error getting creator revenue:', error);
    return {
      totalRevenue: 0,
      totalFees: 0,
      revenueBySource: {},
      records: []
    };
  }
};

export const processPayoutRequest = async (creatorId: string, amount: number) => {
  try {
    // Check if creator has enough balance
    const { totalRevenue } = await getCreatorRevenue(creatorId);
    
    if (totalRevenue < amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    // Create payout record
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .insert([{
        creator_id: creatorId,
        amount: amount,
        status: 'pending'
      }])
      .select()
      .single();

    if (payoutError) throw payoutError;

    return { success: true, payout };
  } catch (error) {
    console.error('Error processing payout request:', error);
    return { success: false, error: 'Failed to process payout request' };
  }
};
