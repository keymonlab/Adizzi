-- ============================================================
-- Auto-update updated_at using moddatetime extension
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

-- ============================================================
-- Auto-create public.users profile on auth.users insert
-- Syncs new Supabase Auth user into public.users with a default handle.
-- The handle is derived from the email prefix; the app should prompt
-- the user to customise it during onboarding.
-- ============================================================

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
    -- Derive base handle from email prefix (strip non-alphanumeric chars)
    v_handle := regexp_replace(
        split_part(NEW.email, '@', 1),
        '[^a-zA-Z0-9_]', '_', 'g'
    );

    -- Ensure uniqueness by appending an incrementing suffix if needed
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
