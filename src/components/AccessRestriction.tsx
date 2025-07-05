import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import VerificationStatus from './VerificationStatus';

interface AccessRestrictionProps {
  children: React.ReactNode;
  requiredVerification?: boolean;
  fallback?: React.ReactNode;
  showMessage?: boolean;
}

const AccessRestriction: React.FC<AccessRestrictionProps> = ({
  children,
  requiredVerification = true,
  fallback,
  showMessage = true
}) => {
  const { profile } = useAuth();

  // If verification is not required, show children
  if (!requiredVerification) {
    return <>{children}</>;
  }

  // If user is verified, show children
  if (profile?.verification_status === 'verified') {
    return <>{children}</>;
  }

  // If custom fallback is provided, show it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default: show verification status message
  if (showMessage) {
    return <VerificationStatus />;
  }

  // Don't show anything
  return null;
};

export default AccessRestriction;