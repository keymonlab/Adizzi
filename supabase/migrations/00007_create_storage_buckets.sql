-- Create storage buckets for post images and avatars

-- Post images bucket (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('post-images', 'post-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Avatars bucket (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- ============================================================
-- RLS policies for post-images bucket
-- ============================================================

-- SELECT: public read
CREATE POLICY "post_images_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'post-images');

-- INSERT: authenticated users can upload
CREATE POLICY "post_images_authenticated_upload"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'post-images'
        AND auth.role() = 'authenticated'
    );

-- UPDATE: users can update own files (owner_id/{user_id}/*)
CREATE POLICY "post_images_update_own"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'post-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
        bucket_id = 'post-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- DELETE: users can delete own files
CREATE POLICY "post_images_delete_own"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'post-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================================
-- RLS policies for avatars bucket
-- ============================================================

-- SELECT: public read
CREATE POLICY "avatars_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

-- INSERT: authenticated users can upload own avatar
CREATE POLICY "avatars_authenticated_upload"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- UPDATE: users can update own avatar
CREATE POLICY "avatars_update_own"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- DELETE: users can delete own avatar
CREATE POLICY "avatars_delete_own"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
