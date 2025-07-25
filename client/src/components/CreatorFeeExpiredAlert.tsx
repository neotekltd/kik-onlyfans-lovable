import React, { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';
import CreatorFeePayment from './CreatorFeePayment';
import { useAuth } from '@/contexts/AuthContext';

interface CreatorFeeExpiredAlertProps {
  className?: string;
}

const CreatorFeeExpiredAlert: React.FC<CreatorFeeExpiredAlertProps> = ({ className }) => {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const { creatorProfile, refreshProfile } = useAuth();

  // Check if the creator profile exists and if the platform fee is not active
  const isExpired = creatorProfile && !creatorProfile.is_platform_fee_active;

  if (!isExpired) return null;

  const handlePaymentSuccess = async () => {
    setShowPaymentDialog(false);
    await refreshProfile();
  };

  const handlePaymentCancel = () => {
    setShowPaymentDialog(false);
  };

  return (
    <>
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Platform Fee Required</AlertTitle>
        <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-4 mt-2">
          <div>
            Your creator account requires payment of the $3 monthly platform fee to continue using creator features.
          </div>
          <Button size="sm" onClick={() => setShowPaymentDialog(true)}>
            Pay Now
          </Button>
        </AlertDescription>
      </Alert>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <CreatorFeePayment 
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreatorFeeExpiredAlert;