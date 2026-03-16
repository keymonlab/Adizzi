-- ============================================================
-- Seed: Seoul Seocho-gu neighborhoods
-- Simplified polygon boundaries (WGS84 / SRID 4326)
-- ============================================================

INSERT INTO neighborhoods (id, name, city, district, boundary) VALUES

-- 서초동 (Seocho-dong)
(
    uuid_generate_v4(),
    '서초동',
    '서울시',
    '서초구',
    ST_SetSRID(
        ST_GeomFromText('POLYGON((
            127.0183 37.4920,
            127.0317 37.4920,
            127.0317 37.4830,
            127.0183 37.4830,
            127.0183 37.4920
        ))'),
        4326
    )
),

-- 반포동 (Banpo-dong)
(
    uuid_generate_v4(),
    '반포동',
    '서울시',
    '서초구',
    ST_SetSRID(
        ST_GeomFromText('POLYGON((
            127.0050 37.5080,
            127.0183 37.5080,
            127.0183 37.4960,
            127.0050 37.4960,
            127.0050 37.5080
        ))'),
        4326
    )
),

-- 잠원동 (Jamwon-dong)
(
    uuid_generate_v4(),
    '잠원동',
    '서울시',
    '서초구',
    ST_SetSRID(
        ST_GeomFromText('POLYGON((
            126.9970 37.5120,
            127.0083 37.5120,
            127.0083 37.5040,
            126.9970 37.5040,
            126.9970 37.5120
        ))'),
        4326
    )
),

-- 방배동 (Bangbae-dong)
(
    uuid_generate_v4(),
    '방배동',
    '서울시',
    '서초구',
    ST_SetSRID(
        ST_GeomFromText('POLYGON((
            126.9880 37.4920,
            127.0080 37.4920,
            127.0080 37.4790,
            126.9880 37.4790,
            126.9880 37.4920
        ))'),
        4326
    )
),

-- 양재동 (Yangjae-dong)
(
    uuid_generate_v4(),
    '양재동',
    '서울시',
    '서초구',
    ST_SetSRID(
        ST_GeomFromText('POLYGON((
            127.0280 37.4780,
            127.0450 37.4780,
            127.0450 37.4650,
            127.0280 37.4650,
            127.0280 37.4780
        ))'),
        4326
    )
);
