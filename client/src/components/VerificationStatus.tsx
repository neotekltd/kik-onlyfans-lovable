import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react';

interface VerificationStatusProps {
  className?: string;
}

const VerificationStatus: React.FC<VerificationStatusProps> = ({ className }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  if (!profile) return null;

  const isVerified = profile.is_verified || profile.verification_status === 'verified';
  const isPending = profile.verification_status === 'pending';
  const isRejected = profile.verification_status === 'rejected';

  if (isVerified) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-700">
            <ShieldCheck className="h-5 w-5" />
            Verified Creator
          </CardTitle>
          <CardDescription>
            Your account is fully verified
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <p className="text-green-700">
              You have full access to all creator features, including:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-green-700">
              <li>• Stripe Connect integration</li>
              <li>• Monetization features</li>
              <li>• Premium content creation</li>
              <li>• Direct fan payments</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        {isPending ? (
          <>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <Clock className="h-5 w-5" />
              Verification Pending
            </CardTitle>
            <CardDescription>
              Your verification is being reviewed
            </CardDescription>
          </>
        ) : isRejected ? (
          <>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <ShieldAlert className="h-5 w-5" />
              Verification Rejected
            </CardTitle>
            <CardDescription>
              Your verification was not approved
            </CardDescription>
          </>
        ) : (
          <>
            <CardTitle className="flex items-center gap-2 text-gray-700">
              <ShieldAlert className="h-5 w-5" />
              Verification Required
            </CardTitle>
            <CardDescription>
              Verify your account to access all creator features
            </CardDescription>
          </>
        )}
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-yellow-700">
              Your verification documents are being reviewed. This process typically takes 24-48 hours.
            </p>
            <p className="text-sm text-yellow-600 mt-2">
              You'll receive a notification once the review is complete.
            </p>
          </div>
        ) : isRejected ? (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <p className="text-red-700">
              Your verification was rejected. Common reasons include:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-red-700">
              <li>• Unclear document images</li>
              <li>• Information mismatch</li>
              <li>• Expired documents</li>
              <li>• Missing required documents</li>
            </ul>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
            <p className="text-gray-700">
              You must complete the verification process to:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              <li>• Connect your Stripe account</li>
              <li>• Withdraw your earnings</li>
              <li>• Access all monetization features</li>
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {isPending ? (
          <Button variant="outline" className="w-full" disabled>
            Verification in Progress
          </Button>
        ) : (
          <Button 
            className="w-full"
            onClick={() => navigate('/age-verification')}
          >
            {isRejected ? 'Submit New Verification' : 'Complete Verification'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default VerificationStatus;