-- Add new fields for selfie verification to age_verification_documents table
ALTER TABLE public.age_verification_documents 
ADD COLUMN selfie_with_id_url TEXT,
ADD COLUMN note_selfie_url TEXT;

-- Create storage bucket for verification documents (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for verification-docs bucket
CREATE POLICY "Users can upload their verification selfies" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
    bucket_id = 'verification-docs' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their verification selfies" 
ON storage.objects 
FOR SELECT 
USING (
    bucket_id = 'verification-docs' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all verification selfies" 
ON storage.objects 
FOR SELECT 
USING (
    bucket_id = 'verification-docs' AND
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_verified = true
    )
);