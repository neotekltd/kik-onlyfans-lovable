import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExternalLink, AlertCircle, CheckCircle, CreditCard, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StripeConnectSetupProps {
  onComplete?: () => void;
}

const StripeConnectSetup: React.FC<StripeConnectSetupProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);
  const { user, profile, creatorProfile, refreshProfile } = useAuth();
  
  // Check if the creator has already connected their Stripe account
  const isStripeConnected = creatorProfile?.stripe_account_id;
  
  // Check if the creator is verified
  const isVerified = profile?.is_verified || profile?.verification_status === 'verified';

  const handleConnectStripe = async () => {
    if (!user) return;
    
    // Prevent unverified creators from connecting Stripe
    if (!isVerified) {
      toast.error('You must be verified to connect your Stripe account');
      return;
    }
    
    setLoading(true);
    try {
      // In a real implementation, this would call your backend API to create a Stripe Connect account
      // and return an account link for onboarding
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create Stripe Connect account');
      }
      
      const data = await response.json();
      
      // Redirect to Stripe Connect onboarding
      window.location.href = data.accountLink;
    } catch (error: any) {
      console.error('Stripe Connect error:', error);
      toast.error('Failed to connect Stripe account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectStripe = async () => {
    if (!user || !creatorProfile?.stripe_account_id) return;
    
    setLoading(true);
    try {
      // In a real implementation, this would call your backend API to disconnect the Stripe account
      const response = await fetch('/api/stripe/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to disconnect Stripe account');
      }
      
      // Update the creator profile (remove stripe reference since field doesn't exist)
      const { error } = await supabase
        .from('creator_profiles')
        .update({ payout_email: null }) // Use existing field instead
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      toast.success('Stripe account disconnected successfully');
      await refreshProfile();
      
    } catch (error: any) {
      console.error('Stripe disconnect error:', error);
      toast.error('Failed to disconnect Stripe account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Stripe Connect
        </CardTitle>
        <CardDescription>
          Connect your Stripe account to receive payments directly from your fans
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isVerified && (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Verification Required</AlertTitle>
            <AlertDescription>
              You must complete the verification process before connecting your Stripe account. 
              This ensures compliance with payment regulations and protects both creators and users.
            </AlertDescription>
          </Alert>
        )}
        
        {isStripeConnected ? (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-green-700">Stripe account connected</p>
                <p className="text-sm text-green-600 mt-1">
                  Your Stripe account is connected and ready to receive payments. 
                  All earnings will be deposited directly to your bank account.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Benefits of connecting Stripe:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Keep 100% of your earnings (no platform fees)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Get paid faster with direct deposits
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Manage your own payment settings
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Access detailed financial reporting
                </li>
              </ul>
            </div>
            
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-sm text-yellow-700">
                You'll need to complete Stripe's verification process to receive payments. 
                This includes providing business and banking information.
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
      <CardFooter>
        {isStripeConnected ? (
          <div className="flex gap-4 w-full">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleDisconnectStripe}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Disconnect Stripe'}
            </Button>
            <Button 
              className="flex-1 flex items-center gap-2"
              onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              Stripe Dashboard
            </Button>
          </div>
        ) : (
          <Button 
            onClick={handleConnectStripe} 
            disabled={loading || !isVerified}
            className="w-full flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                {isVerified ? 'Connect Stripe Account' : 'Verification Required'}
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default StripeConnectSetup;