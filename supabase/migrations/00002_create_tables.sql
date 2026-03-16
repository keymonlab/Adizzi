-- 1. neighborhoods
CREATE TABLE neighborhoods (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    city        TEXT NOT NULL,
    district    TEXT NOT NULL,
    boundary    GEOMETRY(Polygon, 4326),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. users (references auth.users)
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

-- 3. posts
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

-- 4. comments
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

-- 5. claims
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

-- 6. notifications
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

-- 7. lost_alerts
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

-- 8. phone_hashes
CREATE TABLE phone_hashes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone_hash  TEXT NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. contacts_matches
CREATE TABLE contacts_matches (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    matched_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_name    TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. reports
CREATE TABLE reports (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id     UUID REFERENCES posts(id) ON DELETE SET NULL,
    comment_id  UUID REFERENCES comments(id) ON DELETE SET NULL,
    reason      TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
