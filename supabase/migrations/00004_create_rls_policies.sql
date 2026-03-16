-- Enable RLS on all tables
ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_alerts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_hashes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts_matches  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports           ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- users
-- ============================================================

-- SELECT: same neighborhood users (for profile lookup / mention autocomplete)
CREATE POLICY "users_select_same_neighborhood"
    ON users FOR SELECT
    USING (
        neighborhood_id = (
            SELECT neighborhood_id FROM users WHERE id = auth.uid()
        )
    );

-- UPDATE: own row only
CREATE POLICY "users_update_own"
    ON users FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ============================================================
-- posts
-- ============================================================

-- SELECT: same neighborhood, not soft-deleted
CREATE POLICY "posts_select_same_neighborhood"
    ON posts FOR SELECT
    USING (
        deleted_at IS NULL
        AND neighborhood_id = (
            SELECT neighborhood_id FROM users WHERE id = auth.uid()
        )
    );

-- INSERT: any authenticated user
CREATE POLICY "posts_insert_authenticated"
    ON posts FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());

-- UPDATE: author only (e.g., status change)
CREATE POLICY "posts_update_own"
    ON posts FOR UPDATE
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

-- ============================================================
-- comments
-- ============================================================

-- SELECT: accessible via post access, not soft-deleted
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

-- INSERT: any authenticated user
CREATE POLICY "comments_insert_authenticated"
    ON comments FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());

-- UPDATE: author only
CREATE POLICY "comments_update_own"
    ON comments FOR UPDATE
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

-- DELETE: author only (soft delete via UPDATE; hard delete also permitted)
CREATE POLICY "comments_delete_own"
    ON comments FOR DELETE
    USING (author_id = auth.uid());

-- ============================================================
-- claims
-- ============================================================

-- SELECT: claimant sees own claims; post author sees claims on their posts
CREATE POLICY "claims_select_own_or_post_author"
    ON claims FOR SELECT
    USING (
        claimant_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM posts p
            WHERE p.id = claims.post_id AND p.author_id = auth.uid()
        )
    );

-- INSERT: any authenticated user (UNIQUE constraint prevents duplicates)
CREATE POLICY "claims_insert_authenticated"
    ON claims FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND claimant_id = auth.uid());

-- UPDATE: post author only (to change status: pending -> verified/rejected)
CREATE POLICY "claims_update_post_author"
    ON claims FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM posts p
            WHERE p.id = claims.post_id AND p.author_id = auth.uid()
        )
    );

-- ============================================================
-- notifications
-- ============================================================

-- SELECT: recipient only
CREATE POLICY "notifications_select_own"
    ON notifications FOR SELECT
    USING (recipient_id = auth.uid());

-- UPDATE: recipient only (mark as read)
CREATE POLICY "notifications_update_own"
    ON notifications FOR UPDATE
    USING (recipient_id = auth.uid())
    WITH CHECK (recipient_id = auth.uid());

-- DELETE: recipient only
CREATE POLICY "notifications_delete_own"
    ON notifications FOR DELETE
    USING (recipient_id = auth.uid());

-- INSERT: service_role only (edge functions / triggers use service role)
CREATE POLICY "notifications_insert_service_role"
    ON notifications FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- phone_hashes
-- ============================================================

-- No SELECT for regular clients (matching handled by Edge Function with service role)

-- DELETE: own row only
CREATE POLICY "phone_hashes_delete_own"
    ON phone_hashes FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================
-- contacts_matches
-- ============================================================

-- SELECT: own matches only
CREATE POLICY "contacts_matches_select_own"
    ON contacts_matches FOR SELECT
    USING (user_id = auth.uid());

-- DELETE: own row only
CREATE POLICY "contacts_matches_delete_own"
    ON contacts_matches FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================
-- lost_alerts
-- ============================================================

-- Full CRUD on own rows
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

-- ============================================================
-- reports
-- ============================================================

-- INSERT: any authenticated user
CREATE POLICY "reports_insert_authenticated"
    ON reports FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND reporter_id = auth.uid());

-- No SELECT / UPDATE / DELETE for regular users (admin access only via service role)
