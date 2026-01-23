-- Create a private bucket for user profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Users can only view their own profile photos
CREATE POLICY "Users can view own profile photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Users can upload their own profile photos
CREATE POLICY "Users can upload own profile photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Users can update their own profile photos
CREATE POLICY "Users can update own profile photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Users can delete their own profile photos
CREATE POLICY "Users can delete own profile photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);