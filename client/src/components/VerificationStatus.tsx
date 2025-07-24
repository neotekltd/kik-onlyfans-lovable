import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VerificationStatusProps {
  showForVerified?: boolean;
  className?: string;
}

const VerificationStatus: React.FC<VerificationStatusProps> = ({ 
  showForVerified = false,
  className = ""
}) => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  if (!profile) return null;

  const getStatusIcon = () => {
    switch (profile.verification_status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (profile.verification_status) {
      case 'verified':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-orange-600';
    }
  };

  const getAlertVariant = () => {
    switch (profile.verification_status) {
      case 'verified':
        return 'default';
      case 'rejected':
      case 'pending':
      default:
        return 'destructive';
    }
  };

  // Don't show anything for verified users unless explicitly requested
  if (profile.verification_status === 'verified' && !showForVerified) {
    return null;
  }

  const getStatusMessage = () => {
    switch (profile.verification_status) {
      case 'verified':
        return {
          title: "Age Verified",
          description: "Your age has been successfully verified. You have full access to all platform features."
        };
      case 'rejected':
        return {
          title: "Age Verification Rejected",
          description: "Your age verification was rejected. Please submit a new, clear photo of your government-issued ID to access all features."
        };
      case 'pending':
        return {
          title: "Age Verification Pending",
          description: "Your age verification is being reviewed. This usually takes 24-48 hours. You'll be notified once it's complete."
        };
      default:
        return {
          title: "Age Verification Required",
          description: "To comply with legal requirements and access all platform features including creating content, subscriptions, and premium features, please verify your age by uploading a government-issued ID."
        };
    }
  };

  const { title, description } = getStatusMessage();

  return (
    <Alert variant={getAlertVariant()} className={className}>
      <div className="flex items-start gap-3">
        <div className={getStatusColor()}>
          {getStatusIcon()}
        </div>
        <div className="flex-1">
          <div className="font-medium">{title}</div>
          <AlertDescription className="mt-1">
            {description}
          </AlertDescription>
          {(profile.verification_status === 'pending' || profile.verification_status === 'rejected') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/settings')}
              className="mt-3"
            >
              {profile.verification_status === 'rejected' ? 'Resubmit Documents' : 'View Status'}
            </Button>
          )}
          {profile.verification_status === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/settings')}
              className="mt-3"
            >
              Upload Documents
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
};

export default VerificationStatus;