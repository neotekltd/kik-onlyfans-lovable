import React from 'react';
import MainLayout from '@/layouts/MainLayout';
import AgeVerificationReview from '@/components/AgeVerificationReview';

const AgeVerificationAdmin: React.FC = () => {
  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Age Verification Review</h1>
          <p className="text-gray-600 mt-2">Review and manage user age verification documents</p>
        </div>
        
        <AgeVerificationReview />
      </div>
    </MainLayout>
  );
};

export default AgeVerificationAdmin;