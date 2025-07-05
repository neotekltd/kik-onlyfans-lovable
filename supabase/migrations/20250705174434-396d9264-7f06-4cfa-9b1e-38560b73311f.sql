-- Add verification_status to profiles table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verification_status') THEN
        ALTER TABLE public.profiles ADD COLUMN verification_status text DEFAULT 'pending';
    END IF;
END $$;

-- Create age_verification_documents table
CREATE TABLE IF NOT EXISTS public.age_verification_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    front_document_url TEXT,
    back_document_url TEXT,
    document_type TEXT NOT NULL,
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    review_date TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for ID documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('age-verification', 'age-verification', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on age_verification_documents
ALTER TABLE public.age_verification_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for age_verification_documents
CREATE POLICY "Users can insert their own verification documents" 
ON public.age_verification_documents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own verification documents" 
ON public.age_verification_documents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own verification documents" 
ON public.age_verification_documents 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Admin policies (assuming we'll have admin role check)
CREATE POLICY "Admins can view all verification documents" 
ON public.age_verification_documents 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (
            -- For now, we'll use is_verified as admin check, can be enhanced later
            is_verified = true
        )
    )
);

CREATE POLICY "Admins can update all verification documents" 
ON public.age_verification_documents 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_verified = true
    )
);

-- Storage policies for age-verification bucket
CREATE POLICY "Users can upload their verification documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
    bucket_id = 'age-verification' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their verification documents" 
ON storage.objects 
FOR SELECT 
USING (
    bucket_id = 'age-verification' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all verification documents" 
ON storage.objects 
FOR SELECT 
USING (
    bucket_id = 'age-verification' AND
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_verified = true
    )
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_age_verification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_age_verification_documents_updated_at
    BEFORE UPDATE ON public.age_verification_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_age_verification_updated_at();