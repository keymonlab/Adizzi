import type { Database } from '../../../src/types/database.types';
import type { Category, PostStatus, PostType, ClaimStatus, NotificationType, ReportStatus } from '../../../src/types/app.types';

type UserRow = Database['public']['Tables']['users']['Row'];
type NeighborhoodRow = Database['public']['Tables']['neighborhoods']['Row'];
type PostRow = Database['public']['Tables']['posts']['Row'];
type CommentRow = Database['public']['Tables']['comments']['Row'];
type ClaimRow = Database['public']['Tables']['claims']['Row'];
type NotificationRow = Database['public']['Tables']['notifications']['Row'];
type LostAlertRow = Database['public']['Tables']['lost_alerts']['Row'];
type ReportRow = Database['public']['Tables']['reports']['Row'];

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const MOCK_USER: UserRow = {
  id: 'test-user-id-001',
  handle: 'testuser',
  display_name: '테스트유저',
  avatar_url: null,
  neighborhood_id: 'neighborhood-001',
  location_verified: true,
  push_token: null,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
};

export const MOCK_USER_NOT_ONBOARDED: UserRow = {
  ...MOCK_USER,
  id: 'test-user-id-002',
  handle: '',
  display_name: '',
  neighborhood_id: null,
  location_verified: false,
};

export const MOCK_USER_NOT_VERIFIED: UserRow = {
  ...MOCK_USER,
  id: 'test-user-id-003',
  location_verified: false,
  neighborhood_id: null,
};

export const MOCK_OTHER_USER_1: UserRow = {
  id: 'other-user-001',
  handle: 'neighbor1',
  display_name: '이웃주민',
  avatar_url: null,
  neighborhood_id: 'neighborhood-001',
  location_verified: true,
  push_token: null,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
};

export const MOCK_OTHER_USER_2: UserRow = {
  id: 'other-user-002',
  handle: 'goodperson',
  display_name: '착한사람',
  avatar_url: null,
  neighborhood_id: 'neighborhood-001',
  location_verified: true,
  push_token: null,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export const MOCK_SESSION = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: {
    id: MOCK_USER.id,
    email: 'test@mampa.dev',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-03-01T00:00:00Z',
  },
};

// ---------------------------------------------------------------------------
// Neighborhoods
// ---------------------------------------------------------------------------

export const MOCK_NEIGHBORHOODS: NeighborhoodRow[] = [
  {
    id: 'neighborhood-001',
    name: '역삼동',
    city: '서울시',
    district: '강남구',
    boundary: null,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'neighborhood-002',
    name: '서초동',
    city: '서울시',
    district: '서초구',
    boundary: null,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'neighborhood-003',
    name: '삼성동',
    city: '서울시',
    district: '강남구',
    boundary: null,
    created_at: '2026-01-01T00:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Posts
// Includes author join shape used by UI queries (not part of DB Row type).
// ---------------------------------------------------------------------------

type AuthorSnippet = { display_name: string; handle: string; avatar_url: string | null };

export type PostWithAuthor = PostRow & {
  comment_count: number;
  author: AuthorSnippet;
};

export const MOCK_POSTS: PostWithAuthor[] = [
  {
    id: 'post-001',
    author_id: MOCK_USER.id,
    neighborhood_id: 'neighborhood-001',
    title: '놀이터에서 아이 신발 발견',
    description: '역삼동 놀이터 벤치 위에 나이키 운동화가 놓여있었어요.',
    category: 'shoes' as Category,
    post_type: 'found' as PostType,
    status: 'active' as PostStatus,
    location: null,
    location_name: '역삼동 놀이터',
    image_urls: ['https://example.com/img1.jpg'],
    verification_question: '신발 브랜드는?',
    verification_answer_hash: null,
    deleted_at: null,
    created_at: '2026-03-15T10:00:00Z',
    updated_at: '2026-03-15T10:00:00Z',
    comment_count: 3,
    author: { display_name: '테스트유저', handle: 'testuser', avatar_url: null },
  },
  {
    id: 'post-002',
    author_id: MOCK_OTHER_USER_1.id,
    neighborhood_id: 'neighborhood-001',
    title: '지갑을 잃어버렸어요',
    description: '검정색 장지갑을 강남역 근처에서 잃어버렸습니다.',
    category: 'wallet' as Category,
    post_type: 'lost' as PostType,
    status: 'active' as PostStatus,
    location: null,
    location_name: '강남역 2번 출구',
    image_urls: ['https://example.com/img2.jpg', 'https://example.com/img3.jpg'],
    verification_question: null,
    verification_answer_hash: null,
    deleted_at: null,
    created_at: '2026-03-15T09:00:00Z',
    updated_at: '2026-03-15T09:00:00Z',
    comment_count: 1,
    author: { display_name: '이웃주민', handle: 'neighbor1', avatar_url: null },
  },
  {
    id: 'post-003',
    author_id: MOCK_OTHER_USER_2.id,
    neighborhood_id: 'neighborhood-001',
    title: '열쇠 발견했습니다',
    description: '편의점 앞에서 자동차 열쇠를 주웠어요.',
    category: 'keys' as Category,
    post_type: 'found' as PostType,
    status: 'resolved' as PostStatus,
    location: null,
    location_name: 'GS25 역삼점',
    image_urls: [],
    verification_question: null,
    verification_answer_hash: null,
    deleted_at: null,
    created_at: '2026-03-14T15:00:00Z',
    updated_at: '2026-03-15T08:00:00Z',
    comment_count: 5,
    author: { display_name: '착한사람', handle: 'goodperson', avatar_url: null },
  },
  {
    id: 'post-004',
    author_id: MOCK_OTHER_USER_1.id,
    neighborhood_id: 'neighborhood-001',
    title: '강아지를 잃어버렸어요',
    description: '말티즈 수컷 3살, 빨간 목줄 착용. 역삼동 공원 근처에서 잃어버렸습니다.',
    category: 'pet' as Category,
    post_type: 'lost' as PostType,
    status: 'active' as PostStatus,
    location: null,
    location_name: '역삼공원',
    image_urls: ['https://example.com/dog1.jpg'],
    verification_question: null,
    verification_answer_hash: null,
    deleted_at: null,
    created_at: '2026-03-16T08:00:00Z',
    updated_at: '2026-03-16T08:00:00Z',
    comment_count: 0,
    author: { display_name: '이웃주민', handle: 'neighbor1', avatar_url: null },
  },
  {
    id: 'post-005',
    author_id: MOCK_OTHER_USER_2.id,
    neighborhood_id: 'neighborhood-001',
    title: '아이폰 충전기 발견',
    description: '카페 테이블 위에 놓여있던 애플 정품 충전기입니다.',
    category: 'electronics' as Category,
    post_type: 'found' as PostType,
    status: 'active' as PostStatus,
    location: null,
    location_name: '스타벅스 역삼점',
    image_urls: [],
    verification_question: '충전기 색상은?',
    verification_answer_hash: 'hashed-white',
    deleted_at: null,
    created_at: '2026-03-16T07:00:00Z',
    updated_at: '2026-03-16T07:00:00Z',
    comment_count: 2,
    author: { display_name: '착한사람', handle: 'goodperson', avatar_url: null },
  },
];

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export type CommentWithAuthor = CommentRow & { author: AuthorSnippet };

export const MOCK_COMMENTS: CommentWithAuthor[] = [
  {
    id: 'comment-001',
    post_id: 'post-001',
    author_id: MOCK_OTHER_USER_1.id,
    content: '@testuser 이거 우리 아이꺼 같아요!',
    mentions: [MOCK_USER.id],
    deleted_at: null,
    created_at: '2026-03-15T11:00:00Z',
    updated_at: '2026-03-15T11:00:00Z',
    author: { display_name: '이웃주민', handle: 'neighbor1', avatar_url: null },
  },
  {
    id: 'comment-002',
    post_id: 'post-001',
    author_id: MOCK_USER.id,
    content: '네, 연락 주세요!',
    mentions: [],
    deleted_at: null,
    created_at: '2026-03-15T11:30:00Z',
    updated_at: '2026-03-15T11:30:00Z',
    author: { display_name: '테스트유저', handle: 'testuser', avatar_url: null },
  },
  {
    id: 'comment-003',
    post_id: 'post-001',
    author_id: MOCK_OTHER_USER_2.id,
    content: '아직 안 찾으셨나요?',
    mentions: [],
    deleted_at: null,
    created_at: '2026-03-15T14:00:00Z',
    updated_at: '2026-03-15T14:00:00Z',
    author: { display_name: '착한사람', handle: 'goodperson', avatar_url: null },
  },
];

// ---------------------------------------------------------------------------
// Claims
// ---------------------------------------------------------------------------

export type ClaimWithClaimant = ClaimRow & { claimant: AuthorSnippet };

export const MOCK_CLAIMS: ClaimWithClaimant[] = [
  {
    id: 'claim-001',
    post_id: 'post-001',
    claimant_id: MOCK_OTHER_USER_1.id,
    answer_hash: null,
    status: 'pending' as ClaimStatus,
    failed_attempts: 0,
    created_at: '2026-03-15T12:00:00Z',
    updated_at: '2026-03-15T12:00:00Z',
    claimant: { display_name: '이웃주민', handle: 'neighbor1', avatar_url: null },
  },
  {
    id: 'claim-002',
    post_id: 'post-001',
    claimant_id: MOCK_OTHER_USER_2.id,
    answer_hash: 'hashed-nike',
    status: 'verified' as ClaimStatus,
    failed_attempts: 0,
    created_at: '2026-03-15T12:30:00Z',
    updated_at: '2026-03-15T12:30:00Z',
    claimant: { display_name: '착한사람', handle: 'goodperson', avatar_url: null },
  },
  {
    id: 'claim-003',
    post_id: 'post-005',
    claimant_id: MOCK_USER.id,
    answer_hash: 'hashed-wrong',
    status: 'rejected' as ClaimStatus,
    failed_attempts: 2,
    created_at: '2026-03-16T09:00:00Z',
    updated_at: '2026-03-16T09:15:00Z',
    claimant: { display_name: '테스트유저', handle: 'testuser', avatar_url: null },
  },
];

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export type NotificationWithRelations = NotificationRow & {
  actor: AuthorSnippet | null;
  post: { title: string } | null;
};

export const MOCK_NOTIFICATIONS: NotificationWithRelations[] = [
  {
    id: 'notif-001',
    recipient_id: MOCK_USER.id,
    type: 'mention' as NotificationType,
    post_id: 'post-001',
    actor_id: MOCK_OTHER_USER_1.id,
    read: false,
    created_at: '2026-03-15T11:00:00Z',
    updated_at: '2026-03-15T11:00:00Z',
    actor: { display_name: '이웃주민', handle: 'neighbor1', avatar_url: null },
    post: { title: '놀이터에서 아이 신발 발견' },
  },
  {
    id: 'notif-002',
    recipient_id: MOCK_USER.id,
    type: 'comment' as NotificationType,
    post_id: 'post-001',
    actor_id: MOCK_OTHER_USER_2.id,
    read: false,
    created_at: '2026-03-15T14:00:00Z',
    updated_at: '2026-03-15T14:00:00Z',
    actor: { display_name: '착한사람', handle: 'goodperson', avatar_url: null },
    post: { title: '놀이터에서 아이 신발 발견' },
  },
  {
    id: 'notif-003',
    recipient_id: MOCK_USER.id,
    type: 'new_post' as NotificationType,
    post_id: 'post-002',
    actor_id: MOCK_OTHER_USER_1.id,
    read: true,
    created_at: '2026-03-15T09:00:00Z',
    updated_at: '2026-03-15T09:00:00Z',
    actor: { display_name: '이웃주민', handle: 'neighbor1', avatar_url: null },
    post: { title: '지갑을 잃어버렸어요' },
  },
  {
    id: 'notif-004',
    recipient_id: MOCK_USER.id,
    type: 'claim' as NotificationType,
    post_id: 'post-001',
    actor_id: MOCK_OTHER_USER_1.id,
    read: false,
    created_at: '2026-03-15T12:00:00Z',
    updated_at: '2026-03-15T12:00:00Z',
    actor: { display_name: '이웃주민', handle: 'neighbor1', avatar_url: null },
    post: { title: '놀이터에서 아이 신발 발견' },
  },
  {
    id: 'notif-005',
    recipient_id: MOCK_USER.id,
    type: 'resolved' as NotificationType,
    post_id: 'post-003',
    actor_id: MOCK_OTHER_USER_2.id,
    read: true,
    created_at: '2026-03-15T08:00:00Z',
    updated_at: '2026-03-15T08:00:00Z',
    actor: { display_name: '착한사람', handle: 'goodperson', avatar_url: null },
    post: { title: '열쇠 발견했습니다' },
  },
  {
    id: 'notif-006',
    recipient_id: MOCK_USER.id,
    type: 'lost_alert_match' as NotificationType,
    post_id: 'post-002',
    actor_id: null,
    read: false,
    created_at: '2026-03-15T09:01:00Z',
    updated_at: '2026-03-15T09:01:00Z',
    actor: null,
    post: { title: '지갑을 잃어버렸어요' },
  },
];

// ---------------------------------------------------------------------------
// Lost Alerts
// ---------------------------------------------------------------------------

export const MOCK_LOST_ALERTS: LostAlertRow[] = [
  {
    id: 'alert-001',
    user_id: MOCK_USER.id,
    category: 'wallet' as Category,
    keywords: ['검정색', '장지갑'],
    neighborhood_id: 'neighborhood-001',
    active: true,
    created_at: '2026-03-10T00:00:00Z',
    updated_at: '2026-03-10T00:00:00Z',
  },
  {
    id: 'alert-002',
    user_id: MOCK_USER.id,
    category: 'electronics' as Category,
    keywords: ['아이폰', '갤럭시'],
    neighborhood_id: 'neighborhood-001',
    active: false,
    created_at: '2026-03-08T00:00:00Z',
    updated_at: '2026-03-12T00:00:00Z',
  },
  {
    id: 'alert-003',
    user_id: MOCK_USER.id,
    category: 'pet' as Category,
    keywords: ['말티즈', '흰색'],
    neighborhood_id: 'neighborhood-001',
    active: true,
    created_at: '2026-03-14T00:00:00Z',
    updated_at: '2026-03-14T00:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export const MOCK_REPORTS: ReportRow[] = [
  {
    id: 'report-001',
    reporter_id: MOCK_USER.id,
    post_id: 'post-002',
    comment_id: null,
    reason: '허위 게시물로 의심됩니다.',
    status: 'pending' as ReportStatus,
    created_at: '2026-03-15T13:00:00Z',
  },
  {
    id: 'report-002',
    reporter_id: MOCK_OTHER_USER_1.id,
    post_id: null,
    comment_id: 'comment-003',
    reason: '부적절한 댓글입니다.',
    status: 'reviewed' as ReportStatus,
    created_at: '2026-03-15T15:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

/** Filter posts by type */
export const getPostsByType = (type: PostType): PostWithAuthor[] =>
  MOCK_POSTS.filter((p) => p.post_type === type);

/** Filter posts by status */
export const getPostsByStatus = (status: PostStatus): PostWithAuthor[] =>
  MOCK_POSTS.filter((p) => p.status === status);

/** Filter posts authored by the mock user */
export const getMyPosts = (): PostWithAuthor[] =>
  MOCK_POSTS.filter((p) => p.author_id === MOCK_USER.id);

/** Count unread notifications for the mock user */
export const getUnreadNotificationCount = (): number =>
  MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

/** Get active lost alerts for the mock user */
export const getActiveLostAlerts = (): LostAlertRow[] =>
  MOCK_LOST_ALERTS.filter((a) => a.active);
