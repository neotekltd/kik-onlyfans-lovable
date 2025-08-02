import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  CreditCard, 
  DollarSign, 
  Gift, 
  Lock, 
  Unlock, 
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertCircle,
  Wallet,
  Landmark,
  Shield
} from 'lucide-react';

// Load Stripe with your publishable key
const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string | null;
}

interface Subscription {
  id: string;
  creator_id: string;
  creator_name: string;
  amount: number;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

interface CreatorEarnings {
  total_earnings: number;
  monthly_earnings: number;
  pending_payout: number;
  last_payout: number;
  last_payout_date: string;
  next_payout_date: string;
  payout_method: 'bank_account' | 'debit_card';
}

interface PaymentProcessorProps {
  type: 'subscription' | 'tip' | 'ppv' | 'live_stream';
  creatorId?: string;
  creatorName?: string;
  amount?: number;
  contentId?: string;
  description?: string;
  onSuccess?: (paymentIntent: PaymentIntent) => void;
  onError?: (error: string) => void;
}

// Payment Form Component
const PaymentForm: React.FC<PaymentProcessorProps> = ({
  type,
  creatorId,
  creatorName,
  amount = 0,
  contentId,
  description,
  onSuccess,
  onError
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(amount);
  const [tipMessage, setTipMessage] = useState('');
  const [subscriptionTier, setSubscriptionTier] = useState('monthly');
  const [savePaymentMethod, setSavePaymentMethod] = useState(true);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !user) {
      toast.error('Payment system not ready');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast.error('Card information required');
      return;
    }

    setLoading(true);

    try {
      // Create payment intent on server
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amount: paymentAmount * 100, // Convert to cents
          creatorId,
          contentId,
          userId: user.id,
          subscriptionTier,
          tipMessage,
          description
        })
      });

      const { client_secret, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Confirm payment with Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        client_secret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: user.email,
              email: user.email
            }
          }
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent.status === 'succeeded' && paymentIntent.client_secret) {
        // Process successful payment
        await processSuccessfulPayment(paymentIntent);
        onSuccess?.({
          ...paymentIntent,
          client_secret: paymentIntent.client_secret
        });
        
        // Show success message based on payment type
        const successMessages = {
          subscription: `Successfully subscribed to ${creatorName}!`,
          tip: `Tip of $${paymentAmount} sent to ${creatorName}!`,
          ppv: 'Content unlocked successfully!',
          live_stream: 'Live stream access granted!'
        };
        
        toast.success(successMessages[type]);
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMessage = error.message || 'Payment failed';
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const processSuccessfulPayment = async (paymentIntent: any) => {
    try {
      // Record payment in database
      await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          type,
          amount: paymentAmount * 100,
          creatorId,
          contentId,
          userId: user?.id,
          tipMessage
        })
      });
    } catch (error) {
      console.error('Error recording payment:', error);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#ffffff',
        '::placeholder': {
          color: '#9ca3af',
        },
        backgroundColor: '#252836',
      },
      invalid: {
        color: '#ef4444',
      },
    },
    hidePostalCode: false,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Amount */}
      {type === 'tip' && (
        <div>
          <Label>Tip Amount ($)</Label>
          <Input
            type="number"
            min="1"
            max="1000"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(Number(e.target.value))}
            className="bg-[#252836] border-[#2c2e36] text-white mt-2"
            placeholder="Enter tip amount"
          />
        </div>
      )}

      {type === 'subscription' && (
        <div>
          <Label>Subscription Plan</Label>
          <Select value={subscriptionTier} onValueChange={setSubscriptionTier}>
            <SelectTrigger className="bg-[#252836] border-[#2c2e36] text-white mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly - ${amount}/month</SelectItem>
              <SelectItem value="quarterly">3 Months - ${(amount * 2.7).toFixed(2)} (10% off)</SelectItem>
              <SelectItem value="yearly">12 Months - ${(amount * 10).toFixed(2)} (17% off)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Tip Message */}
      {type === 'tip' && (
        <div>
          <Label>Message (Optional)</Label>
          <Input
            value={tipMessage}
            onChange={(e) => setTipMessage(e.target.value)}
            className="bg-[#252836] border-[#2c2e36] text-white mt-2"
            placeholder="Send a message with your tip"
            maxLength={200}
          />
        </div>
      )}

      {/* Payment Summary */}
      <div className="bg-[#252836] p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Payment Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Amount:</span>
            <span>${paymentAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Platform Fee:</span>
            <span>${(paymentAmount * 0.05).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Processing Fee:</span>
            <span>${(paymentAmount * 0.029 + 0.30).toFixed(2)}</span>
          </div>
          <Separator className="bg-[#2c2e36]" />
          <div className="flex justify-between font-semibold">
            <span>Total:</span>
            <span>${(paymentAmount + paymentAmount * 0.029 + 0.30).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Card Information */}
      <div>
        <Label>Card Information</Label>
        <div className="bg-[#252836] border border-[#2c2e36] rounded-md p-3 mt-2">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {/* Security Features */}
      <div className="bg-[#1e2029] p-4 rounded-lg border border-[#2c2e36]">
        <div className="flex items-center mb-2">
          <Shield className="h-4 w-4 text-green-400 mr-2" />
          <span className="text-sm font-medium">Secure Payment</span>
        </div>
        <div className="text-xs text-gray-400 space-y-1">
          <p>• 256-bit SSL encryption</p>
          <p>• PCI DSS compliant</p>
          <p>• Your card details are never stored</p>
          <p>• Fraud protection included</p>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-[#00aff0] hover:bg-[#0095cc] text-white font-semibold py-3"
      >
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <CreditCard className="h-4 w-4 mr-2" />
            {type === 'subscription' ? `Subscribe for $${paymentAmount}/month` :
             type === 'tip' ? `Send $${paymentAmount} Tip` :
             type === 'ppv' ? `Unlock for $${paymentAmount}` :
             `Pay $${paymentAmount}`}
          </div>
        )}
      </Button>
    </form>
  );
};

// Subscription Management Component
const SubscriptionManager: React.FC = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, [user]);

  const fetchSubscriptions = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/subscriptions/user/${user.id}`);
      const data = await response.json();
      setSubscriptions(data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST'
      });

      if (response.ok) {
        toast.success('Subscription canceled successfully');
        fetchSubscriptions();
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  };

  const reactivateSubscription = async (subscriptionId: string) => {
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}/reactivate`, {
        method: 'POST'
      });

      if (response.ok) {
        toast.success('Subscription reactivated successfully');
        fetchSubscriptions();
      } else {
        throw new Error('Failed to reactivate subscription');
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      toast.error('Failed to reactivate subscription');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00aff0]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Your Subscriptions</h2>
      
      {subscriptions.length === 0 ? (
        <div className="bg-[#1e2029] p-8 rounded-lg text-center">
          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Subscriptions</h3>
          <p className="text-gray-400">Start following creators to see their exclusive content</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id} className="bg-[#1e2029] border-[#2c2e36]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-[#252836] rounded-full flex items-center justify-center mr-4">
                      <span className="font-semibold">{subscription.creator_name.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{subscription.creator_name}</h3>
                      <p className="text-sm text-gray-400">
                        ${(subscription.amount / 100).toFixed(2)}/month
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant={subscription.status === 'active' ? 'default' : 'destructive'}
                      className={subscription.status === 'active' ? 'bg-green-600' : ''}
                    >
                      {subscription.status}
                    </Badge>
                    
                    {subscription.status === 'active' && !subscription.cancel_at_period_end ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelSubscription(subscription.id)}
                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      >
                        Cancel
                      </Button>
                    ) : subscription.cancel_at_period_end ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => reactivateSubscription(subscription.id)}
                        className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                      >
                        Reactivate
                      </Button>
                    ) : null}
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-400">
                  <p>Next billing: {new Date(subscription.current_period_end).toLocaleDateString()}</p>
                  {subscription.cancel_at_period_end && (
                    <p className="text-orange-400">Will cancel at period end</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Creator Earnings Component
const CreatorEarnings: React.FC = () => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<CreatorEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayoutSetup, setShowPayoutSetup] = useState(false);

  useEffect(() => {
    fetchEarnings();
  }, [user]);

  const fetchEarnings = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/creators/${user.id}/earnings`);
      const data = await response.json();
      setEarnings(data);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestPayout = async () => {
    try {
      const response = await fetch('/api/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId: user?.id })
      });

      if (response.ok) {
        toast.success('Payout requested successfully');
        fetchEarnings();
      } else {
        throw new Error('Failed to request payout');
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast.error('Failed to request payout');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00aff0]"></div>
      </div>
    );
  }

  if (!earnings) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Earnings Dashboard</h2>
      
      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#1e2029] border-[#2c2e36]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Earnings</p>
                <p className="text-2xl font-bold text-green-400">
                  ${(earnings.total_earnings / 100).toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e2029] border-[#2c2e36]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">This Month</p>
                <p className="text-2xl font-bold text-blue-400">
                  ${(earnings.monthly_earnings / 100).toFixed(2)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e2029] border-[#2c2e36]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Payout</p>
                <p className="text-2xl font-bold text-yellow-400">
                  ${(earnings.pending_payout / 100).toFixed(2)}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e2029] border-[#2c2e36]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Last Payout</p>
                <p className="text-2xl font-bold text-purple-400">
                  ${(earnings.last_payout / 100).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {earnings.last_payout_date ? new Date(earnings.last_payout_date).toLocaleDateString() : 'Never'}
                </p>
              </div>
              <Landmark className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Section */}
      <Card className="bg-[#1e2029] border-[#2c2e36]">
        <CardHeader>
          <CardTitle>Payout Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400">Available for payout: ${(earnings.pending_payout / 100).toFixed(2)}</p>
              <p className="text-sm text-gray-500">
                Next automatic payout: {earnings.next_payout_date ? new Date(earnings.next_payout_date).toLocaleDateString() : 'Not scheduled'}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowPayoutSetup(true)}
                className="border-[#2c2e36]"
              >
                Setup Payout Method
              </Button>
              <Button
                onClick={requestPayout}
                disabled={earnings.pending_payout < 5000} // Minimum $50
                className="bg-[#00aff0] hover:bg-[#0095cc]"
              >
                Request Payout
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Payment Processor Component
const StripePaymentProcessor: React.FC<PaymentProcessorProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
};

export {
  StripePaymentProcessor,
  SubscriptionManager,
  CreatorEarnings,
  PaymentForm
};

export default StripePaymentProcessor;