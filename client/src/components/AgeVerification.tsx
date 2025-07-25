import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

interface AgeVerificationDocument {
  id: string;
  user_id: string;
  front_document_url?: string;
  back_document_url?: string;
  selfie_with_id_url?: string;
  note_selfie_url?: string;
  document_type: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  submission_date: string;
}

const AgeVerification: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [documentType, setDocumentType] = useState<string>('');
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [selfieWithIdFile, setSelfieWithIdFile] = useState<File | null>(null);
  const [noteSelfieFile, setNoteSelfieFile] = useState<File | null>(null);
  const [existingDocument, setExistingDocument] = useState<AgeVerificationDocument | null>(null);
  
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const selfieWithIdInputRef = useRef<HTMLInputElement>(null);
  const noteSelfieInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (user) {
      fetchExistingDocument();
    }
  }, [user]);

  const fetchExistingDocument = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('age_verification_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) setExistingDocument(data as AgeVerificationDocument);
    } catch (error) {
      console.error('Error fetching verification document:', error);
    }
  };

  const handleFileChange = (type: 'front' | 'back' | 'selfie-with-id' | 'note-selfie', file: File | null) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    switch (type) {
      case 'front':
        setFrontFile(file);
        break;
      case 'back':
        setBackFile(file);
        break;
      case 'selfie-with-id':
        setSelfieWithIdFile(file);
        break;
      case 'note-selfie':
        setNoteSelfieFile(file);
        break;
    }
  };

  const uploadFile = async (file: File, fileName: string): Promise<string> => {
    const filePath = `${user!.id}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('verification-docs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('verification-docs')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!user || !documentType || !frontFile || !selfieWithIdFile || !noteSelfieFile) {
      toast({
        title: "Missing information",
        description: "Please complete all required fields: document type, ID photo, selfie with ID, and selfie with handwritten note.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Upload all files
      const frontUrl = await uploadFile(frontFile, `front_${Date.now()}.${frontFile.name.split('.').pop()}`);
      let backUrl = null;
      if (backFile) {
        backUrl = await uploadFile(backFile, `back_${Date.now()}.${backFile.name.split('.').pop()}`);
      }
      const selfieWithIdUrl = await uploadFile(selfieWithIdFile, `selfie_id_${Date.now()}.${selfieWithIdFile.name.split('.').pop()}`);
      const noteSelfieUrl = await uploadFile(noteSelfieFile, `note_selfie_${Date.now()}.${noteSelfieFile.name.split('.').pop()}`);

      // Insert verification document record
      const { error } = await supabase
        .from('age_verification_documents')
        .insert({
          user_id: user.id,
          document_type: documentType,
          front_document_url: frontUrl,
          back_document_url: backUrl,
          selfie_with_id_url: selfieWithIdUrl,
          note_selfie_url: noteSelfieUrl,
          status: 'pending'
        });

      if (error) throw error;

      // Update profile verification status to pending
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ verification_status: 'pending' })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast({
        title: "Verification submitted",
        description: "Your verification documents have been submitted for review. You'll be notified once they're processed.",
      });

      // Refresh the page data
      fetchExistingDocument();
      setFrontFile(null);
      setBackFile(null);
      setSelfieWithIdFile(null);
      setNoteSelfieFile(null);
      setDocumentType('');
      
      // Clear file inputs
      if (frontInputRef.current) frontInputRef.current.value = '';
      if (backInputRef.current) backInputRef.current.value = '';
      if (selfieWithIdInputRef.current) selfieWithIdInputRef.current.value = '';
      if (noteSelfieInputRef.current) noteSelfieInputRef.current.value = '';

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to submit verification documents.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  if (existingDocument) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(existingDocument.status)}
            Age Verification Status
          </CardTitle>
          <CardDescription>
            Your age verification document status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Status:</span>
            <span className={`capitalize font-medium ${getStatusColor(existingDocument.status)}`}>
              {existingDocument.status}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Document Type:</span>
            <span className="capitalize">{existingDocument.document_type}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Submitted:</span>
            <span>{new Date(existingDocument.submission_date).toLocaleDateString()}</span>
          </div>
          
          {existingDocument.status === 'rejected' && existingDocument.admin_notes && (
            <Alert>
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Rejection Reason:</strong> {existingDocument.admin_notes}
              </AlertDescription>
            </Alert>
          )}
          
          {existingDocument.status === 'rejected' && (
            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Your document was rejected. Please submit a new, clear photo of your government-issued ID.
              </p>
              <Button 
                onClick={() => setExistingDocument(null)}
                variant="outline"
              >
                Submit New Document
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Age Verification
        </CardTitle>
        <CardDescription>
          Complete identity verification by uploading your government ID and selfie photos for manual review
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertDescription>
            To comply with legal requirements (2257) and access all platform features, please upload your government-issued ID, a selfie holding your ID, and a selfie with a handwritten authorization note. All documents are stored securely and reviewed by authorized personnel only.
          </AlertDescription>
        </Alert>

        <div>
          <Label htmlFor="document-type">Document Type</Label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger>
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="drivers_license">Driver's License</SelectItem>
              <SelectItem value="passport">Passport</SelectItem>
              <SelectItem value="national_id">National ID Card</SelectItem>
              <SelectItem value="state_id">State ID Card</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="front-upload">Front of ID *</Label>
            <div className="mt-2">
              <Input
                ref={frontInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange('front', e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {frontFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Selected: {frontFile.name}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="back-upload">Back of ID (if applicable)</Label>
            <div className="mt-2">
              <Input
                ref={backInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange('back', e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {backFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Selected: {backFile.name}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="selfie-with-id-upload">Selfie Holding Your ID *</Label>
            <div className="mt-2">
              <Input
                ref={selfieWithIdInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange('selfie-with-id', e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {selfieWithIdFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Selected: {selfieWithIdFile.name}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="note-selfie-upload">Selfie with Handwritten Note *</Label>
            <div className="mt-2">
              <Input
                ref={noteSelfieInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange('note-selfie', e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {noteSelfieFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Selected: {noteSelfieFile.name}
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Note must read: "I authorize Fanixora to verify my age and sex in order for me to become a fully verified creator under law. {new Date().toLocaleDateString()}"
            </p>
          </div>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Requirements:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Document must be government-issued and current</li>
            <li>• All photos must be clear and all text readable</li>
            <li>• Full document must be visible in frame</li>
            <li>• Selfie must clearly show your face and the ID</li>
            <li>• Handwritten note must be legible and include today's date</li>
            <li>• File size must be under 10MB each</li>
            <li>• Supported formats: JPEG, PNG, WebP</li>
          </ul>
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={loading || !documentType || !frontFile || !selfieWithIdFile || !noteSelfieFile}
          className="w-full"
        >
          {loading ? (
            <>
              <Upload className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Submit for Verification
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          Your documents will be reviewed within 24-48 hours. You'll receive a notification once the review is complete.
        </p>
      </CardContent>
    </Card>
  );
};

export default AgeVerification;