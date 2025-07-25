import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface CreatorFeePaymentProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CreatorFeePayment: React.FC<CreatorFeePaymentProps> = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const { user, profile, refreshProfile } = useAuth();

  const handlePayment = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // In a real implementation, this would integrate with Stripe or another payment processor
      // For now, we'll simulate a successful payment and update the database directly
      
      // Calculate the date one month from now
      const nextPaymentDate = new Date();
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      
      // Update the creator profile with the new payment date
      const { error } = await supabase
        .from('creator_profiles')
        .update({ 
          platform_fee_paid_until: nextPaymentDate.toISOString(),
          is_platform_fee_active: true
        })
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setPaymentComplete(true);
      toast.success('Platform fee payment successful!');
      
      // Refresh the user profile to get the updated payment status
      await refreshProfile();
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          KikStars Creator Fee
        </CardTitle>
        <CardDescription>
          Pay the monthly platform fee to activate your creator account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {paymentComplete ? (
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Payment Successful!</h3>
            <p className="text-muted-foreground">
              Your creator account is now active until {new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Monthly Creator Fee</span>
                <span className="font-bold">$3.00</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                This fee gives you access to all creator tools and features
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">What's included:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Full access to creator tools
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Ability to create premium content
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Monetize your content through subscriptions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Receive tips and payments from fans
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Analytics and performance tracking
                </li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <p className="text-sm text-yellow-700">
                  The $3 monthly fee is charged to all creators. This is separate from your subscription price that fans pay to access your content.
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {paymentComplete ? (
          <Button className="w-full" onClick={onSuccess}>
            Continue to Creator Dashboard
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handlePayment} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Pay $3.00
                </>
              )}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default CreatorFeePayment;