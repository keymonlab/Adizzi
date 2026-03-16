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
