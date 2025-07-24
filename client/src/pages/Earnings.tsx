
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CreditCard, TrendingUp } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';

interface Earning {
  id: string;
  amount: number;
  created_at: string;
  type: 'subscription' | 'tip' | 'ppv';
  source: string;
}

const Earnings: React.FC = () => {
  const { user, profile } = useAuth();
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!user || !profile?.is_creator) return;

      try {
        // Fetch tips
        const { data: tips } = await supabase
          .from('tips')
          .select('id, amount, created_at, tipper_id')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false });

        // Fetch subscription earnings
        const { data: subscriptions } = await supabase
          .from('user_subscriptions')
          .select('id, amount_paid, created_at, subscriber_id')
          .eq('creator_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        // Fetch PPV purchases
        const { data: ppvPurchases } = await supabase
          .from('ppv_purchases')
          .select('id, amount, created_at, buyer_id')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });

        // Combine all earnings
        const allEarnings: Earning[] = [
          ...(tips || []).map(tip => ({
            id: tip.id,
            amount: tip.amount,
            created_at: tip.created_at,
            type: 'tip' as const,
            source: tip.tipper_id,
          })),
          ...(subscriptions || []).map(sub => ({
            id: sub.id,
            amount: sub.amount_paid,
            created_at: sub.created_at,
            type: 'subscription' as const,
            source: sub.subscriber_id,
          })),
          ...(ppvPurchases || []).map(ppv => ({
            id: ppv.id,
            amount: ppv.amount,
            created_at: ppv.created_at,
            type: 'ppv' as const,
            source: ppv.buyer_id,
          })),
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setEarnings(allEarnings);

        // Calculate totals
        const total = allEarnings.reduce((sum, earning) => sum + earning.amount, 0);
        setTotalEarnings(total);

        // Calculate monthly earnings (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const monthly = allEarnings
          .filter(earning => new Date(earning.created_at) > thirtyDaysAgo)
          .reduce((sum, earning) => sum + earning.amount, 0);
        setMonthlyEarnings(monthly);

      } catch (error) {
        console.error('Error fetching earnings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [user, profile]);

  if (!profile?.is_creator) {
    return (
      <MainLayout>
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">This page is only available for creators.</p>
        </div>
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Earnings</h1>
          <p className="text-gray-600 mt-2">Track your income and manage payouts</p>
        </div>

        {/* Earnings Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalEarnings / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(monthlyEarnings / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalEarnings / 100).toFixed(2)}</div>
              <Button size="sm" className="mt-2">
                Request Payout
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest earnings and transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {earnings.length > 0 ? (
                earnings.slice(0, 10).map((earning) => (
                  <div key={earning.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-50 to-creator-50 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-brand-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            ${(earning.amount / 100).toFixed(2)}
                          </span>
                          <Badge variant="secondary">
                            {earning.type === 'tip' ? 'Tip' : 
                             earning.type === 'subscription' ? 'Subscription' : 'PPV'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(earning.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No earnings yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Start creating content to earn money!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Earnings;
