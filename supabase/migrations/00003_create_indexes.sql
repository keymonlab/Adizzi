-- Feed query: by neighborhood + status + newest first
CREATE INDEX idx_posts_feed ON posts(neighborhood_id, status, created_at DESC);

-- Spatial indexes: map view + neighborhood matching
CREATE INDEX idx_posts_location ON posts USING GIST(location);
CREATE INDEX idx_neighborhoods_boundary ON neighborhoods USING GIST(boundary);

-- Notification query: by recipient + read state + newest first
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, read, created_at DESC);

-- Comment query: by post + time order
CREATE INDEX idx_comments_post ON comments(post_id, created_at);

-- Lost alert matching: by neighborhood + category + active flag
CREATE INDEX idx_lost_alerts_match ON lost_alerts(neighborhood_id, category, active);

-- Full-text search: lost alert keyword matching
CREATE INDEX idx_posts_fts ON posts USING GIN(to_tsvector('simple', title || ' ' || description));
