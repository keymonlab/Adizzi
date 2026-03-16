-- ============================================================
-- find_neighborhood_by_point(lat, lng)
-- Returns the neighborhood whose boundary polygon contains the given point.
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

-- ============================================================
-- create_notification(recipient_id, type, post_id, actor_id)
-- Inserts a notification row. Intended to be called from Edge Functions
-- or DB triggers using the service role.
-- ============================================================
CREATE OR REPLACE FUNCTION create_notification(
    p_recipient_id  UUID,
    p_type          TEXT,
    p_post_id       UUID,
    p_actor_id      UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
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
