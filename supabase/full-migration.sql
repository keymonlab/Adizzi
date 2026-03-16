-- ================================================================
-- MAMPA 전체 마이그레이션 (한 번에 실행)
-- Supabase 대시보드 → SQL Editor에 붙여넣기
-- ================================================================

-- ============================================================
-- STEP 1: 확장 (Extensions)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- ============================================================
-- STEP 2: 테이블 생성
-- ============================================================

CREATE TABLE neighborhoods (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    city        TEXT NOT NULL,
    district    TEXT NOT NULL,
    boundary    GEOMETRY(Polygon, 4326),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4() REFERENCES auth.users(id) ON DELETE CASCADE,
    handle              TEXT NOT NULL UNIQUE,
    display_name        TEXT NOT NULL,
    avatar_url          TEXT,
    neighborhood_id     UUID REFERENCES neighborhoods(id) ON DELETE SET NULL,
    location_verified   BOOLEAN NOT NULL DEFAULT false,
    push_token          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE posts (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    neighborhood_id             UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE RESTRICT,
    title                       TEXT NOT NULL,
    description                 TEXT NOT NULL,
    category                    TEXT NOT NULL CHECK (category IN ('shoes', 'toy', 'clothing', 'bag', 'other')),
    status                      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
    location                    GEOMETRY(Point, 4326),
    location_name               TEXT,
    image_urls                  TEXT[] NOT NULL DEFAULT '{}',
    verification_question       TEXT,
    verification_answer_hash    TEXT,
    deleted_at                  TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE comments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    mentions    UUID[] NOT NULL DEFAULT '{}',
    deleted_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE claims (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    claimant_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answer_hash     TEXT,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (post_id, claimant_id)
);

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            TEXT NOT NULL CHECK (type IN ('new_post', 'comment', 'mention', 'claim', 'resolved', 'lost_alert_match')),
    post_id         UUID REFERENCES posts(id) ON DELETE CASCADE,
    actor_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    read            BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lost_alerts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category        TEXT NOT NULL CHECK (category IN ('shoes', 'toy', 'clothing', 'bag', 'other')),
    keywords        TEXT[] NOT NULL DEFAULT '{}',
    neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
    active          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phone_hashes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone_hash  TEXT NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE contacts_matches (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    matched_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_name    TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reports (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id     UUID REFERENCES posts(id) ON DELETE SET NULL,
    comment_id  UUID REFERENCES comments(id) ON DELETE SET NULL,
    reason      TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- STEP 3: 인덱스
-- ============================================================

CREATE INDEX idx_posts_feed ON posts(neighborhood_id, status, created_at DESC);
CREATE INDEX idx_posts_location ON posts USING GIST(location);
CREATE INDEX idx_neighborhoods_boundary ON neighborhoods USING GIST(boundary);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, read, created_at DESC);
CREATE INDEX idx_comments_post ON comments(post_id, created_at);
CREATE INDEX idx_lost_alerts_match ON lost_alerts(neighborhood_id, category, active);
CREATE INDEX idx_posts_fts ON posts USING GIN(to_tsvector('simple', title || ' ' || description));

-- ============================================================
-- STEP 4: RLS 정책
-- ============================================================

ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_alerts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_hashes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts_matches  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports           ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "users_select_same_neighborhood"
    ON users FOR SELECT
    USING (
        neighborhood_id = (
            SELECT neighborhood_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "users_update_own"
    ON users FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- posts
CREATE POLICY "posts_select_same_neighborhood"
    ON posts FOR SELECT
    USING (
        deleted_at IS NULL
        AND neighborhood_id = (
            SELECT neighborhood_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "posts_insert_authenticated"
    ON posts FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());

CREATE POLICY "posts_update_own"
    ON posts FOR UPDATE
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

-- comments
CREATE POLICY "comments_select_via_post"
    ON comments FOR SELECT
    USING (
        deleted_at IS NULL
        AND EXISTS (
            SELECT 1 FROM posts p
            WHERE p.id = comments.post_id
              AND p.deleted_at IS NULL
              AND p.neighborhood_id = (
                  SELECT neighborhood_id FROM users WHERE id = auth.uid()
              )
        )
    );

CREATE POLICY "comments_insert_authenticated"
    ON comments FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());

CREATE POLICY "comments_update_own"
    ON comments FOR UPDATE
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

CREATE POLICY "comments_delete_own"
    ON comments FOR DELETE
    USING (author_id = auth.uid());

-- claims
CREATE POLICY "claims_select_own_or_post_author"
    ON claims FOR SELECT
    USING (
        claimant_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM posts p
            WHERE p.id = claims.post_id AND p.author_id = auth.uid()
        )
    );

CREATE POLICY "claims_insert_authenticated"
    ON claims FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND claimant_id = auth.uid());

CREATE POLICY "claims_update_post_author"
    ON claims FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM posts p
            WHERE p.id = claims.post_id AND p.author_id = auth.uid()
        )
    );

-- notifications
CREATE POLICY "notifications_select_own"
    ON notifications FOR SELECT
    USING (recipient_id = auth.uid());

CREATE POLICY "notifications_update_own"
    ON notifications FOR UPDATE
    USING (recipient_id = auth.uid())
    WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "notifications_delete_own"
    ON notifications FOR DELETE
    USING (recipient_id = auth.uid());

CREATE POLICY "notifications_insert_service_role"
    ON notifications FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- phone_hashes
CREATE POLICY "phone_hashes_delete_own"
    ON phone_hashes FOR DELETE
    USING (user_id = auth.uid());

-- contacts_matches
CREATE POLICY "contacts_matches_select_own"
    ON contacts_matches FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "contacts_matches_delete_own"
    ON contacts_matches FOR DELETE
    USING (user_id = auth.uid());

-- lost_alerts
CREATE POLICY "lost_alerts_select_own"
    ON lost_alerts FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "lost_alerts_insert_own"
    ON lost_alerts FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "lost_alerts_update_own"
    ON lost_alerts FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "lost_alerts_delete_own"
    ON lost_alerts FOR DELETE
    USING (user_id = auth.uid());

-- reports
CREATE POLICY "reports_insert_authenticated"
    ON reports FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND reporter_id = auth.uid());

-- ============================================================
-- STEP 5: 함수
-- ============================================================

CREATE OR REPLACE FUNCTION find_neighborhood_by_point(lat DOUBLE PRECISION, lng DOUBLE PRECISION)
RETURNS TABLE (
    id              UUID,
    name            TEXT,
    city            TEXT,
    district        TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
    SELECT
        n.id,
        n.name,
        n.city,
        n.district
    FROM neighborhoods n
    WHERE ST_Contains(
        n.boundary,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)
    )
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION create_notification(
    p_recipient_id  UUID,
    p_type          TEXT,
    p_post_id       UUID,
    p_actor_id      UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO notifications (recipient_id, type, post_id, actor_id)
    VALUES (p_recipient_id, p_type, p_post_id, p_actor_id)
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

-- ============================================================
-- STEP 6: 트리거
-- ============================================================

CREATE TRIGGER handle_updated_at_users
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER handle_updated_at_posts
    BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER handle_updated_at_comments
    BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER handle_updated_at_claims
    BEFORE UPDATE ON claims
    FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER handle_updated_at_notifications
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER handle_updated_at_lost_alerts
    BEFORE UPDATE ON lost_alerts
    FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_handle TEXT;
    v_suffix INT := 0;
    v_candidate TEXT;
BEGIN
    v_handle := regexp_replace(
        split_part(NEW.email, '@', 1),
        '[^a-zA-Z0-9_]', '_', 'g'
    );

    v_candidate := v_handle;
    LOOP
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE handle = v_candidate);
        v_suffix := v_suffix + 1;
        v_candidate := v_handle || '_' || v_suffix;
    END LOOP;

    INSERT INTO public.users (id, handle, display_name)
    VALUES (NEW.id, v_candidate, COALESCE(NEW.raw_user_meta_data->>'full_name', v_candidate));

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE handle_new_auth_user();

-- ============================================================
-- STEP 7: Storage 버킷
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('post-images', 'post-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Storage RLS: post-images
CREATE POLICY "post_images_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'post-images');

CREATE POLICY "post_images_authenticated_upload"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'post-images'
        AND auth.role() = 'authenticated'
    );

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

CREATE POLICY "post_images_delete_own"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'post-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage RLS: avatars
CREATE POLICY "avatars_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "avatars_authenticated_upload"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

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

CREATE POLICY "avatars_delete_own"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================================
-- STEP 8: 테스트 동네 데이터
-- ============================================================

-- 서초동 (서울 서초구)
INSERT INTO neighborhoods (name, city, district, boundary) VALUES (
    '서초동', '서울특별시', '서초구',
    ST_GeomFromText('POLYGON((126.980 37.480, 126.995 37.480, 126.995 37.495, 126.980 37.495, 126.980 37.480))', 4326)
);

-- 역삼동 (서울 강남구)
INSERT INTO neighborhoods (name, city, district, boundary) VALUES (
    '역삼동', '서울특별시', '강남구',
    ST_GeomFromText('POLYGON((127.030 37.495, 127.045 37.495, 127.045 37.510, 127.030 37.510, 127.030 37.495))', 4326)
);

-- 잠실동 (서울 송파구)
INSERT INTO neighborhoods (name, city, district, boundary) VALUES (
    '잠실동', '서울특별시', '송파구',
    ST_GeomFromText('POLYGON((127.075 37.505, 127.095 37.505, 127.095 37.520, 127.075 37.520, 127.075 37.505))', 4326)
);

-- ============================================================
-- 완료! 🎉
-- ============================================================

-- ============================================================
-- 00008: Fix RLS infinite recursion
-- ============================================================

-- Fix infinite recursion in users RLS policy
-- The original policy queried the users table within its own SELECT policy,
-- causing infinite recursion. Solution: use a SECURITY DEFINER function.

-- Helper function that bypasses RLS to get current user's neighborhood
CREATE OR REPLACE FUNCTION get_my_neighborhood_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT neighborhood_id FROM users WHERE id = auth.uid();
$$;

-- Fix users SELECT policy
DROP POLICY IF EXISTS "users_select_same_neighborhood" ON users;
CREATE POLICY "users_select_own_or_same_neighborhood"
    ON users FOR SELECT
    USING (
        id = auth.uid()
        OR neighborhood_id = get_my_neighborhood_id()
    );

-- Fix posts SELECT policy (use helper function for consistency)
DROP POLICY IF EXISTS "posts_select_same_neighborhood" ON posts;
CREATE POLICY "posts_select_same_neighborhood"
    ON posts FOR SELECT
    USING (
        deleted_at IS NULL
        AND neighborhood_id = get_my_neighborhood_id()
    );

-- Fix comments SELECT policy (use helper function for consistency)
DROP POLICY IF EXISTS "comments_select_via_post" ON comments;
CREATE POLICY "comments_select_via_post"
    ON comments FOR SELECT
    USING (
        deleted_at IS NULL
        AND EXISTS (
            SELECT 1 FROM posts p
            WHERE p.id = comments.post_id
              AND p.deleted_at IS NULL
              AND p.neighborhood_id = get_my_neighborhood_id()
        )
    );

-- ============================================================
-- 00009: Add post_type (lost/found) and expand categories
-- ============================================================

-- Add post_type column to distinguish between lost and found posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_type TEXT NOT NULL DEFAULT 'found'
    CHECK (post_type IN ('lost', 'found'));

-- Expand category options to include high-involvement items
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_category_check;
ALTER TABLE posts ADD CONSTRAINT posts_category_check
    CHECK (category IN ('shoes', 'toy', 'clothing', 'bag', 'electronics', 'wallet', 'keys', 'pet', 'other'));

-- Also expand lost_alerts category to match
ALTER TABLE lost_alerts DROP CONSTRAINT IF EXISTS lost_alerts_category_check;
ALTER TABLE lost_alerts ADD CONSTRAINT lost_alerts_category_check
    CHECK (category IN ('shoes', 'toy', 'clothing', 'bag', 'electronics', 'wallet', 'keys', 'pet', 'other'));

-- Create index for filtering by post_type
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON posts(post_type);
