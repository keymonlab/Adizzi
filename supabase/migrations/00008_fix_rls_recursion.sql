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
