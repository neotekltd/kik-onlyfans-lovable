import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Eye, User, Calendar } from 'lucide-react';

interface VerificationDocument {
  id: string;
  user_id: string;
  document_type: string;
  front_document_url?: string;
  back_document_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  submission_date: string;
  admin_notes?: string;
  profiles: {
    username: string;
    display_name: string;
  };
}

const AgeVerificationReview: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<VerificationDocument | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (user && profile?.is_verified) {
      fetchDocuments();
    }
  }, [user, profile]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('age_verification_documents')
        .select(`
          *,
          profiles!age_verification_documents_user_id_fkey (username, display_name)
        `)
        .order('submission_date', { ascending: false });

      if (error) throw error;
      setDocuments((data || []) as VerificationDocument[]);
    } catch (error) {
      console.error('Error fetching verification documents:', error);
      toast({
        title: "Error",
        description: "Failed to load verification documents.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (documentId: string, status: 'approved' | 'rejected', notes?: string) => {
    setProcessingId(documentId);
    try {
      // Update the verification document
      const { error: docError } = await supabase
        .from('age_verification_documents')
        .update({
          status,
          admin_notes: notes || null,
          review_date: new Date().toISOString(),
          reviewed_by: user!.id
        })
        .eq('id', documentId);

      if (docError) throw docError;

      // Update the user's profile verification status
      const document = documents.find(d => d.id === documentId);
      if (document) {
        const profileStatus = status === 'approved' ? 'verified' : 'rejected';
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ verification_status: profileStatus })
          .eq('id', document.user_id);

        if (profileError) throw profileError;

        // Create notification for user
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: document.user_id,
            title: status === 'approved' ? 'Age Verification Approved' : 'Age Verification Rejected',
            message: status === 'approved' 
              ? 'Your age verification has been approved. You now have full access to the platform.'
              : `Your age verification was rejected. ${notes || 'Please submit a new, clear photo of your ID.'}`,
            type: 'verification',
            data: { verification_status: status }
          });

        if (notificationError) console.error('Failed to create notification:', notificationError);
      }

      toast({
        title: "Review completed",
        description: `Document ${status} successfully.`,
      });

      // Refresh documents
      fetchDocuments();
      setSelectedDocument(null);
      setAdminNotes('');

    } catch (error: any) {
      toast({
        title: "Review failed",
        description: error.message || "Failed to process review.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  // Check if user is admin (using is_verified as temporary admin check)
  if (!profile?.is_verified) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Loading verification documents...</p>
        </CardContent>
      </Card>
    );
  }

  if (selectedDocument) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Review Document
          </CardTitle>
          <CardDescription>
            Review and approve or reject the age verification document
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="font-medium">{selectedDocument.profiles.display_name}</span>
              <span className="text-muted-foreground">(@{selectedDocument.profiles.username})</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(selectedDocument.submission_date).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium">Document Type:</span>
            <span className="capitalize">{selectedDocument.document_type.replace('_', ' ')}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium">Status:</span>
            {getStatusBadge(selectedDocument.status)}
          </div>

          <div className="space-y-4">
            <div>
              <Label>Front of Document</Label>
              {selectedDocument.front_document_url && (
                <div className="mt-2">
                  <img
                    src={selectedDocument.front_document_url}
                    alt="Front of ID"
                    className="max-w-full h-auto rounded-lg border"
                    style={{ maxHeight: '400px' }}
                  />
                </div>
              )}
            </div>

            {selectedDocument.back_document_url && (
              <div>
                <Label>Back of Document</Label>
                <div className="mt-2">
                  <img
                    src={selectedDocument.back_document_url}
                    alt="Back of ID"
                    className="max-w-full h-auto rounded-lg border"
                    style={{ maxHeight: '400px' }}
                  />
                </div>
              </div>
            )}
          </div>

          {selectedDocument.status === 'pending' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="admin-notes">Admin Notes (optional)</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes for the user (especially if rejecting)..."
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => handleReview(selectedDocument.id, 'approved', adminNotes)}
                  disabled={processingId === selectedDocument.id}
                  className="flex-1"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReview(selectedDocument.id, 'rejected', adminNotes)}
                  disabled={processingId === selectedDocument.id}
                  className="flex-1"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          )}

          {selectedDocument.admin_notes && (
            <div className="bg-muted p-4 rounded-lg">
              <Label className="font-medium">Admin Notes:</Label>
              <p className="text-sm mt-1">{selectedDocument.admin_notes}</p>
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => setSelectedDocument(null)}
            className="w-full"
          >
            Back to List
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Age Verification Review</CardTitle>
        <CardDescription>
          Review and manage age verification documents submitted by users
        </CardDescription>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No verification documents to review.
          </p>
        ) : (
          <div className="space-y-4">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{document.profiles.display_name}</span>
                    <span className="text-muted-foreground">(@{document.profiles.username})</span>
                    {getStatusIcon(document.status)}
                    {getStatusBadge(document.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {document.document_type.replace('_', ' ')} • 
                    Submitted {new Date(document.submission_date).toLocaleDateString()}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDocument(document)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Review
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgeVerificationReview;