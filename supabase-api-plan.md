# Mampa Supabase API & 데이터베이스 전체 구조

> 이 문서는 mampa 앱의 Supabase 백엔드 전체 구조를 **서비스 기능별**로 정리한 레퍼런스입니다.
> 테이블, 버킷, Edge Function, RLS 정책, 서비스 레이어를 한눈에 파악할 수 있습니다.

---

## 목차

1. [데이터베이스 ER 다이어그램](#1-데이터베이스-er-다이어그램)
2. [기능별 API 매핑](#2-기능별-api-매핑)
3. [테이블 상세 스키마](#3-테이블-상세-스키마)
4. [RLS 정책 매트릭스](#4-rls-정책-매트릭스)
5. [Storage 버킷](#5-storage-버킷)
6. [Edge Functions](#6-edge-functions)
7. [데이터베이스 함수 & 트리거](#7-데이터베이스-함수--트리거)
8. [인덱스](#8-인덱스)
9. [핵심 데이터 흐름](#9-핵심-데이터-흐름)
10. [환경 변수](#10-환경-변수)

---

## 1. 데이터베이스 ER 다이어그램

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ neighborhoods │◄────│    users     │────►│ phone_hashes │
│              │  FK │              │  FK │              │
│ id (PK)      │     │ id (PK)      │     │ id (PK)      │
│ name         │     │ handle (UQ)  │     │ user_id (FK) │
│ city         │     │ display_name │     │ phone_hash   │
│ district     │     │ avatar_url   │     └──────────────┘
│ boundary     │     │ neighborhood │          │
│  (GEOMETRY)  │     │ _id (FK)     │          ▼
└──────────────┘     │ location_    │  ┌──────────────────┐
                     │  verified    │  │ contacts_matches  │
                     │ push_token   │  │                  │
                     └──────┬───────┘  │ id (PK)          │
                            │          │ user_id (FK)      │
              ┌─────────────┼──────┐   │ matched_user_id   │
              │             │      │   │  (FK)             │
              ▼             ▼      ▼   │ contact_name      │
       ┌──────────┐  ┌─────────┐ ┌─────────────┐  └──────────────────┘
       │  posts   │  │ claims  │ │notifications│
       │          │  │         │ │             │
       │ id (PK)  │  │ id (PK) │ │ id (PK)     │
       │ author_id│  │ post_id │ │ recipient_id│
       │ neighbor │  │claimant │ │ type        │
       │ _hood_id │  │ _id     │ │ post_id     │
       │ title    │  │ answer  │ │ actor_id    │
       │ desc     │  │ _hash   │ │ read        │
       │ category │  │ status  │ └─────────────┘
       │ status   │  │ failed  │
       │ location │  │_attempts│  ┌──────────────┐
       │ image_   │  └─────────┘  │  lost_alerts  │
       │  urls[]  │               │              │
       │ verif_q  │               │ id (PK)      │
       │ verif_   │               │ user_id (FK) │
       │  a_hash  │               │ category     │
       └────┬─────┘               │ keywords[]   │
            │                     │ neighborhood │
            ▼                     │  _id (FK)    │
     ┌──────────┐                 │ active       │
     │ comments │                 └──────────────┘
     │          │
     │ id (PK)  │    ┌──────────────┐
     │ post_id  │    │   reports    │
     │ author_id│    │              │
     │ content  │    │ id (PK)      │
     │ mentions │    │ reporter_id  │
     │  []      │    │ post_id      │
     └──────────┘    │ comment_id   │
                     │ reason       │
                     │ status       │
                     └──────────────┘
```

---

## 2. 기능별 API 매핑

### 🔐 인증 (Authentication)

| 작업 | 방법 | 테이블/API | 서비스 파일 |
|------|------|-----------|------------|
| 소셜 로그인 (카카오/네이버/구글) | `supabase.auth.signInWithOAuth()` | auth.users | `auth.service.ts` |
| 로그아웃 | `supabase.auth.signOut()` | auth.users | `auth.service.ts` |
| 세션 확인 | `supabase.auth.getSession()` | auth.users | `auth.service.ts` |
| 인증 상태 감지 | `supabase.auth.onAuthStateChange()` | auth.users | `auth.service.ts` |
| 자동 프로필 생성 | 트리거 `on_auth_user_created` | users | 자동 (DB 트리거) |

> **참고**: 사용자가 OAuth로 가입하면 `handle_new_auth_user()` 트리거가 자동으로 `users` 테이블에 row를 생성합니다. handle은 이메일 prefix에서 자동 생성되고, 중복 시 숫자 suffix가 붙습니다.

---

### 👤 사용자 프로필 (User Profile)

| 작업 | 방법 | 테이블 | 서비스 함수 |
|------|------|--------|------------|
| 프로필 조회 | SELECT | `users` | `getProfile(userId)` |
| 프로필 수정 (닉네임/핸들/아바타) | UPDATE | `users` | `updateProfile(userId, data)` |
| 핸들 중복 체크 | SELECT COUNT | `users` | `checkHandleAvailability(handle)` |
| 핸들 검색 (@멘션) | SELECT ILIKE | `users` | `searchByHandle(query, limit)` |
| 동네 인증 완료 | UPDATE | `users` | `updateLocationVerification(userId, neighborhoodId)` |
| 아바타 업로드 | Storage Upload | `avatars` 버킷 | 직접 (`edit-profile.tsx`) |

**수정 가능 필드** (`users` UPDATE):
- `handle` — 고유 핸들 (@username)
- `display_name` — 표시 이름
- `avatar_url` — 아바타 URL (Storage 버킷에서 업로드 후 URL 저장)
- `neighborhood_id` — 소속 동네 (재인증 시 변경)
- `location_verified` — 위치 인증 여부
- `push_token` — 푸시 알림 토큰

---

### 🏘️ 동네 (Neighborhoods)

| 작업 | 방법 | 테이블 | 서비스 함수 |
|------|------|--------|------------|
| GPS 좌표로 동네 찾기 | RPC | `neighborhoods` | `findByCoordinates(lat, lng)` |
| 동네 상세 조회 | SELECT | `neighborhoods` | `getById(id)` |
| 전체 동네 목록 | SELECT | `neighborhoods` | `listAll()` |

> **RPC 함수**: `find_neighborhood_by_point(lat, lng)` — PostGIS `ST_Contains()`로 GPS 좌표가 어느 동네 폴리곤 안에 있는지 검색합니다.

---

### 📝 게시물 (Posts)

| 작업 | 방법 | 테이블 | 서비스 함수 |
|------|------|--------|------------|
| 게시물 생성 | INSERT | `posts` | `createPost(data, authorId)` |
| 게시물 상세 조회 | SELECT + JOIN | `posts`, `users`, `comments` (count) | `getPost(id)` |
| 피드 조회 (무한스크롤) | SELECT + 커서 페이지네이션 | `posts`, `users` | `listPosts(params)` |
| 상태 변경 (해결됨) | UPDATE | `posts` | `updatePostStatus(id, 'resolved')` |
| 게시물 삭제 (소프트) | UPDATE deleted_at | `posts` | `softDeletePost(id)` |
| 이미지 업로드 | Storage Upload | `post-images` 버킷 | `useImageUpload` 훅 |

**피드 필터링 옵션** (`listPosts`):
- `neighborhoodId` (필수) — 같은 동네 게시물만
- `category` (선택) — shoes, toy, clothing, bag, other
- `status` (선택) — active, resolved
- 커서: `{ created_at, id }` — 키셋 페이지네이션

**게시물 생성 데이터** (`CreatePostData`):
```typescript
{
  title: string;              // 제목
  description: string;        // 설명
  category: Category;         // 카테고리
  location?: { lat, lng };    // GPS 좌표 (PostGIS POINT로 변환)
  location_name?: string;     // "중앙공원 놀이터" 등
  image_urls?: string[];      // Storage 업로드 후 URL 배열 (최대 5장)
  neighborhood_id: string;    // 동네 ID
  verification_question?: string;     // "끈 색깔이 뭐예요?"
  verification_answer_hash?: string;  // 인증 답변
}
```

> **게시물 생성 후**: `match-lost-alerts` Edge Function이 자동으로 호출되어 매칭되는 분실 알림이 있으면 해당 사용자에게 푸시를 보냅니다.

---

### 💬 댓글 (Comments)

| 작업 | 방법 | 테이블 | 서비스 함수 |
|------|------|--------|------------|
| 댓글 작성 | INSERT | `comments` | `createComment(data)` |
| 댓글 목록 (페이지네이션) | SELECT + 커서 | `comments`, `users` | `listComments(postId, cursor?)` |
| 댓글 삭제 (소프트) | UPDATE deleted_at | `comments` | `softDeleteComment(id)` |

**댓글 데이터**:
```typescript
{
  post_id: string;     // 어느 게시물
  author_id: string;   // 작성자
  content: string;     // 댓글 내용 ("@sarah_mom 이거 아닌가요?")
  mentions?: string[]; // 멘션된 유저 ID 배열
}
```

> **@멘션 흐름**: 댓글 입력 시 `@` 감지 → `useMentionSearch` (연락처 우선, 동네 사용자 검색) → 선택 시 핸들 삽입 → 제출 시 `replaceMentionsWithIds()`로 UUID 배열 추출 → `mentions` 필드에 저장

---

### 🏷️ 소유권 주장 (Claims)

| 작업 | 방법 | 테이블/함수 | 서비스 함수 |
|------|------|------------|------------|
| 소유권 주장 제출 | Edge Function | `verify-claim` | `submitClaim(postId, answer?)` |
| 게시물의 모든 클레임 조회 | SELECT | `claims`, `users` | `getClaimsForPost(postId)` |
| 내 클레임 조회 | SELECT | `claims` | `getMyClaimForPost(postId, userId)` |
| 클레임 승인 | UPDATE | `claims` + `posts` | `approveClaim(claimId, postId)` |
| 클레임 거절 | UPDATE | `claims` | `rejectClaim(claimId)` |

**인증 질문이 있는 경우**:
1. 사용자가 답변 제출 → `verify-claim` Edge Function 호출
2. 답변 비교 (대소문자 무시, 앞뒤 공백 제거)
3. 일치 → status='verified', 게시물 status='resolved'
4. 불일치 → failed_attempts++, 3회 초과 시 영구 거부

**인증 질문이 없는 경우**:
1. status='pending'으로 생성
2. 게시물 작성자가 수동 승인/거절

---

### 🔔 알림 (Notifications)

| 작업 | 방법 | 테이블 | 서비스 함수 |
|------|------|--------|------------|
| 알림 목록 조회 | SELECT + JOIN | `notifications`, `users`, `posts` | `listNotifications(userId, cursor?)` |
| 읽음 처리 | UPDATE | `notifications` | `markRead(id)` |
| 전체 읽음 | UPDATE | `notifications` | `markAllRead(userId)` |
| 안 읽은 수 | SELECT COUNT | `notifications` | `getUnreadCount(userId)` |

**알림 타입 6종**:

| 타입 | 트리거 | 푸시 발송 | 설명 |
|------|--------|----------|------|
| `new_post` | DB 트리거 (미구현) | ❌ 인앱만 | 동네에 새 게시물 |
| `comment` | DB 트리거 (미구현) | ❌ 인앱만 | 내 게시물에 댓글 |
| `mention` | DB 트리거 (미구현) | ❌ 인앱만 | 댓글에서 @멘션 |
| `claim` | `verify-claim` 함수 | ✅ 푸시 | 소유권 주장 접수 |
| `resolved` | DB 트리거 (미구현) | ❌ 인앱만 | 게시물 해결됨 |
| `lost_alert_match` | `match-lost-alerts` 함수 | ✅ 푸시 | 분실 알림 매칭 |

> **참고**: 현재 푸시 알림은 `claim`과 `lost_alert_match` 2종만 발송됩니다. 나머지 4종은 인앱 알림(notifications 테이블)만 생성되며, 푸시 발송을 위해서는 DB 트리거 또는 추가 Edge Function이 필요합니다.

---

### 🚨 분실 알림 (Lost Alerts)

| 작업 | 방법 | 테이블 | 서비스 함수 |
|------|------|--------|------------|
| 알림 생성 | INSERT | `lost_alerts` | `createAlert(data, userId)` |
| 내 알림 목록 | SELECT | `lost_alerts` | `listMyAlerts(userId)` |
| 알림 수정 | UPDATE | `lost_alerts` | `updateAlert(id, data)` |
| 활성/비활성 토글 | UPDATE | `lost_alerts` | `toggleAlert(id, active)` |
| 알림 삭제 | DELETE | `lost_alerts` | `deleteAlert(id)` |

**자동 매칭 흐름**:
```
새 게시물 생성 → match-lost-alerts Edge Function 호출
  → 같은 동네 + 같은 카테고리의 활성 알림 조회
  → 키워드가 게시물 제목/설명에 포함되는지 확인
  → 매칭되면 notification 생성 + send-push 호출
```

---

### 📱 연락처 동기화 (Contact Sync)

| 작업 | 방법 | 테이블 | 서비스 함수 |
|------|------|--------|------------|
| 연락처 동기화 | Edge Function | `sync-contacts` | `syncContacts(contacts)` |
| 매칭된 연락처 조회 | SELECT + JOIN | `contacts_matches`, `users` | `getMatchedContacts(userId)` |

**프라이버시 보호 흐름**:
```
클라이언트: 연락처 → 전화번호 정규화 (+82 형식)
    ↓ (전화번호 + 이름 전송)
Edge Function: HMAC-SHA256 해시 (서버 시크릿 키)
    ↓ (해시로 phone_hashes 테이블 검색)
매칭 결과 → contacts_matches에 저장
    ↓
클라이언트: 매칭된 사용자 프로필 표시
```

> **중요**: 전화번호 원본은 서버에 저장되지 않습니다. HMAC 해시만 비교합니다.

---

### 🚩 신고 (Reports)

| 작업 | 방법 | 테이블 | 서비스 함수 |
|------|------|--------|------------|
| 게시물/댓글 신고 | INSERT | `reports` | `createReport(data)` |

**신고 데이터**:
```typescript
{
  reporter_id: string;       // 신고자
  post_id?: string;          // 신고 대상 게시물 (또는)
  comment_id?: string;       // 신고 대상 댓글
  reason: string;            // 신고 사유
}
```

> **참고**: 신고 조회/처리는 서비스 롤 키(관리자)만 접근 가능합니다. 일반 사용자는 INSERT만 가능합니다.

---

### 🗺️ 지도 (Map)

| 작업 | 방법 | 테이블 | 참고 |
|------|------|--------|------|
| 지도 마커 표시 | SELECT (location != null) | `posts` | `listPosts`로 조회 후 location 파싱 |
| WKT → 좌표 변환 | 클라이언트 파싱 | — | `PostMarker` 컴포넌트에서 POINT 파싱 |

> `posts.location`은 PostGIS GEOMETRY(Point, 4326) 타입으로, `POINT(lng lat)` WKT 형식으로 저장됩니다.

---

### 🔄 실시간 업데이트 (Realtime)

| 채널 | 테이블 | 필터 | 용도 |
|------|--------|------|------|
| `notifications` | notifications | `recipient_id=eq.{userId}` | 새 알림 수신 |
| `posts` | posts | `neighborhood_id=eq.{neighborhoodId}` | 동네 새 게시물 |
| `comments` | comments | 없음 (클라이언트 필터) | 댓글 실시간 갱신 |
| `claims` | claims | 없음 (클라이언트 필터) | 클레임 상태 변경 |

> 각 채널은 `queryClient.invalidateQueries()`를 호출하여 React Query 캐시를 갱신합니다.

---

## 3. 테이블 상세 스키마

### neighborhoods

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `name` | TEXT | NOT NULL | 동네 이름 (예: "서초동") |
| `city` | TEXT | NOT NULL | 시 (예: "서울특별시") |
| `district` | TEXT | NOT NULL | 구 (예: "서초구") |
| `boundary` | GEOMETRY(Polygon, 4326) | | PostGIS 폴리곤 경계 |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

### users

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| `id` | UUID | PK, FK auth.users ON DELETE CASCADE | |
| `handle` | TEXT | UNIQUE, NOT NULL | @핸들 (멘션용) |
| `display_name` | TEXT | NOT NULL | 표시 이름 |
| `avatar_url` | TEXT | | 아바타 이미지 URL |
| `neighborhood_id` | UUID | FK neighborhoods | 소속 동네 |
| `location_verified` | BOOLEAN | DEFAULT false | GPS 인증 여부 |
| `push_token` | TEXT | | Expo 푸시 토큰 |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | 자동 갱신 (트리거) |

### posts

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `author_id` | UUID | FK users, NOT NULL | 작성자 |
| `neighborhood_id` | UUID | FK neighborhoods, NOT NULL | 동네 |
| `title` | TEXT | NOT NULL | 제목 |
| `description` | TEXT | NOT NULL | 설명 |
| `category` | TEXT | CHECK (shoes/toy/clothing/bag/other) | 카테고리 |
| `status` | TEXT | CHECK (active/resolved), DEFAULT 'active' | 상태 |
| `location` | GEOMETRY(Point, 4326) | | GPS 좌표 |
| `location_name` | TEXT | | 장소 이름 |
| `image_urls` | TEXT[] | DEFAULT '{}' | 이미지 URL 배열 |
| `verification_question` | TEXT | | 인증 질문 |
| `verification_answer_hash` | TEXT | | 인증 답변 |
| `deleted_at` | TIMESTAMPTZ | | 소프트 삭제 |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

### comments

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `post_id` | UUID | FK posts, NOT NULL | 게시물 |
| `author_id` | UUID | FK users, NOT NULL | 작성자 |
| `content` | TEXT | NOT NULL | 댓글 내용 |
| `mentions` | UUID[] | DEFAULT '{}' | 멘션된 사용자 ID |
| `deleted_at` | TIMESTAMPTZ | | 소프트 삭제 |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

### claims

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `post_id` | UUID | FK posts, NOT NULL | 대상 게시물 |
| `claimant_id` | UUID | FK users, NOT NULL | 주장자 |
| `answer_hash` | TEXT | | 답변 해시 |
| `status` | TEXT | CHECK (pending/verified/rejected), DEFAULT 'pending' | |
| `failed_attempts` | INTEGER | DEFAULT 0 | 실패 횟수 (최대 3) |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |
| | | UNIQUE (post_id, claimant_id) | 1인 1주장 |

### notifications

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `recipient_id` | UUID | FK users, NOT NULL | 수신자 |
| `type` | TEXT | CHECK (6종) | 알림 타입 |
| `post_id` | UUID | FK posts | 관련 게시물 |
| `actor_id` | UUID | FK users | 행위자 |
| `read` | BOOLEAN | DEFAULT false | 읽음 여부 |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

### lost_alerts

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `user_id` | UUID | FK users, NOT NULL | 알림 소유자 |
| `category` | TEXT | CHECK (shoes/toy/clothing/bag/other) | 분류 |
| `keywords` | TEXT[] | DEFAULT '{}' | 검색 키워드 |
| `neighborhood_id` | UUID | FK neighborhoods, NOT NULL | 동네 |
| `active` | BOOLEAN | DEFAULT true | 활성 상태 |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

### phone_hashes

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `user_id` | UUID | FK users, NOT NULL | |
| `phone_hash` | TEXT | UNIQUE, NOT NULL | HMAC-SHA256 해시 |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

### contacts_matches

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `user_id` | UUID | FK users, NOT NULL | 검색한 사용자 |
| `matched_user_id` | UUID | FK users, NOT NULL | 매칭된 사용자 |
| `contact_name` | TEXT | NOT NULL | 연락처에 저장된 이름 |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

### reports

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `reporter_id` | UUID | FK users, NOT NULL | 신고자 |
| `post_id` | UUID | FK posts | 신고 대상 게시물 |
| `comment_id` | UUID | FK comments | 신고 대상 댓글 |
| `reason` | TEXT | NOT NULL | 사유 |
| `status` | TEXT | CHECK (pending/reviewed/dismissed), DEFAULT 'pending' | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

---

## 4. RLS 정책 매트릭스

| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| `neighborhoods` | ✅ 모든 인증 사용자 | ❌ | ❌ | ❌ |
| `users` | ✅ 같은 동네만 | ❌ (트리거 자동생성) | ✅ 본인만 | ❌ |
| `posts` | ✅ 같은 동네 + deleted_at IS NULL | ✅ 인증 사용자 | ✅ 작성자만 | ❌ (소프트 삭제) |
| `comments` | ✅ 게시물 접근 가능 시 | ✅ 인증 사용자 | ✅ 작성자만 | ✅ 작성자만 |
| `claims` | ✅ 본인 또는 게시물 작성자 | ✅ 인증 사용자 | ✅ 게시물 작성자만 | ❌ |
| `notifications` | ✅ 수신자만 | ✅ 서비스 롤만 | ✅ 수신자만 | ✅ 수신자만 |
| `lost_alerts` | ✅ 본인만 | ✅ 본인만 | ✅ 본인만 | ✅ 본인만 |
| `phone_hashes` | ❌ | ❌ (서버만) | ❌ | ✅ 본인만 |
| `contacts_matches` | ✅ 본인만 | ❌ (서버만) | ❌ | ✅ 본인만 |
| `reports` | ❌ (관리자만) | ✅ 인증 사용자 | ❌ (관리자만) | ❌ |

---

## 5. Storage 버킷

### post-images (게시물 이미지)

| 설정 | 값 |
|------|-----|
| **공개 읽기** | ✅ Yes |
| **파일 크기 제한** | 5 MB |
| **허용 MIME** | image/jpeg, image/png, image/webp |
| **경로 구조** | `{user_id}/{timestamp}_{random}.jpg` |

| 정책 | 대상 |
|------|------|
| SELECT | 모두 (공개) |
| INSERT | 인증 사용자 |
| UPDATE/DELETE | 소유자만 (폴더 경로로 확인) |

**사용 위치**: `useImageUpload` 훅 → 게시물 작성 화면

---

### avatars (프로필 아바타)

| 설정 | 값 |
|------|-----|
| **공개 읽기** | ✅ Yes |
| **파일 크기 제한** | 2 MB |
| **허용 MIME** | image/jpeg, image/png, image/webp |
| **경로 구조** | `{user_id}/{filename}` |

| 정책 | 대상 |
|------|------|
| SELECT | 모두 (공개) |
| INSERT/UPDATE/DELETE | 소유자만 |

**사용 위치**: 프로필 수정 화면 (`edit-profile.tsx`)

---

## 6. Edge Functions

### verify-claim

| 항목 | 값 |
|------|-----|
| **경로** | `/functions/v1/verify-claim` |
| **인증** | Bearer JWT (인증된 사용자) |
| **입력** | `{ post_id: string, answer?: string }` |
| **DB 접근** | SELECT: posts, claims / UPSERT: claims / INSERT: notifications |
| **호출 시점** | 사용자가 "제 물건이에요!" 탭 시 |

### send-push

| 항목 | 값 |
|------|-----|
| **경로** | `/functions/v1/send-push` |
| **인증** | Bearer 서비스 롤 키 (내부용) |
| **입력** | `{ recipient_ids: string[], title: string, body: string, data?: object }` |
| **DB 접근** | SELECT: users (push_token) |
| **외부 API** | Expo Push Service (`https://exp.host/--/api/v2/push/send`) |
| **호출 시점** | 다른 Edge Function에서 내부 호출 |

### sync-contacts

| 항목 | 값 |
|------|-----|
| **경로** | `/functions/v1/sync-contacts` |
| **인증** | Bearer JWT (인증된 사용자) |
| **입력** | `{ contacts: [{ phone: string, name: string }] }` |
| **DB 접근** | SELECT: phone_hashes, users / UPSERT: contacts_matches |
| **보안** | HMAC-SHA256 (HMAC_SECRET_KEY) |
| **호출 시점** | 연락처 동기화 화면 |

### match-lost-alerts

| 항목 | 값 |
|------|-----|
| **경로** | `/functions/v1/match-lost-alerts` |
| **인증** | Bearer 서비스 롤 키 (내부용) |
| **입력** | `{ post_id: string }` |
| **DB 접근** | SELECT: posts, lost_alerts, users / INSERT: notifications |
| **호출** | send-push (매칭 시) |
| **호출 시점** | 게시물 생성 성공 후 (fire-and-forget) |

---

## 7. 데이터베이스 함수 & 트리거

### 함수

| 함수 | 타입 | 인자 | 반환 | 용도 |
|------|------|------|------|------|
| `find_neighborhood_by_point` | SQL, STABLE | lat FLOAT, lng FLOAT | TABLE (id, name, city, district) | GPS → 동네 매칭 |
| `create_notification` | SQL | recipient_id, type, post_id, actor_id | UUID | 알림 생성 (Edge Function용) |
| `handle_new_auth_user` | PLPGSQL | — (트리거) | TRIGGER | 자동 프로필 생성 |

### 트리거

| 트리거 | 테이블 | 이벤트 | 용도 |
|--------|--------|--------|------|
| `on_auth_user_created` | `auth.users` | AFTER INSERT | users 테이블에 프로필 자동 생성 |
| `handle_updated_at_*` | 6개 테이블 | BEFORE UPDATE | `updated_at` 자동 갱신 (moddatetime) |

---

## 8. 인덱스

| 인덱스 | 테이블 (컬럼) | 타입 | 용도 |
|--------|-------------|------|------|
| `idx_posts_feed` | posts (neighborhood_id, status, created_at DESC) | BTREE | 피드 쿼리 최적화 |
| `idx_posts_location` | posts (location) | GIST | 지도 공간 쿼리 |
| `idx_neighborhoods_boundary` | neighborhoods (boundary) | GIST | GPS → 동네 매칭 |
| `idx_notifications_recipient` | notifications (recipient_id, read, created_at DESC) | BTREE | 알림 목록 |
| `idx_comments_post` | comments (post_id, created_at) | BTREE | 게시물별 댓글 |
| `idx_lost_alerts_match` | lost_alerts (neighborhood_id, category, active) | BTREE | 분실 알림 매칭 |
| `idx_posts_fts` | posts (to_tsvector title \|\| description) | GIN | 전문 검색 |

---

## 9. 핵심 데이터 흐름

### 사용자 가입 → 동네 인증

```
OAuth 로그인 → auth.users INSERT
    ↓ (트리거)
public.users 자동 생성 (handle = email prefix)
    ↓ (온보딩)
닉네임 + 핸들 설정 → users UPDATE
    ↓ (위치 인증)
GPS 좌표 → find_neighborhood_by_point RPC
    ↓
neighborhood_id + location_verified=true → users UPDATE
```

### 게시물 생성 → 분실 알림 매칭

```
이미지 선택/촬영 → post-images 버킷 업로드
    ↓ (URL 배열 획득)
게시물 데이터 입력 → posts INSERT
    ↓ (성공 콜백)
match-lost-alerts Edge Function 호출 (fire-and-forget)
    ↓
같은 동네 + 카테고리 알림 조회 → 키워드 매칭
    ↓ (매칭 시)
notifications INSERT + send-push → 푸시 발송
```

### 소유권 인증 플로우

```
"제 물건이에요!" 탭 → verify-claim Edge Function
    ├─ 인증 질문 없음 → claim status='pending'
    │   └─ 게시물 작성자가 수동 승인/거절
    └─ 인증 질문 있음 → 답변 비교
        ├─ 일치 → status='verified' + post status='resolved'
        └─ 불일치 → failed_attempts++ (3회 제한)
```

---

## 10. 환경 변수

| 변수 | 용도 | 사용 위치 |
|------|------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | 클라이언트 (`supabase.ts`) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 (RLS 적용) | 클라이언트 (`supabase.ts`) |
| `SUPABASE_SERVICE_ROLE_KEY` | 서비스 롤 키 (RLS 우회) | Edge Functions만 |
| `HMAC_SECRET_KEY` | 전화번호/답변 해싱 시크릿 | Edge Functions만 |

> **보안 주의**: `SUPABASE_SERVICE_ROLE_KEY`와 `HMAC_SECRET_KEY`는 절대 클라이언트에 노출되면 안 됩니다. Supabase Edge Function 환경 변수로만 설정하세요.

---

## 빠른 참조: "이걸 수정하려면 어디를?"

| 수정하고 싶은 것 | 테이블/버킷 | 서비스 파일 | 화면 |
|-----------------|-----------|------------|------|
| 사용자 닉네임 | `users` | `users.service.ts` | `edit-profile.tsx` |
| 사용자 아바타 | `avatars` 버킷 + `users` | 직접 Storage API | `edit-profile.tsx` |
| 사용자 동네 | `users` | `users.service.ts` | `neighborhood.tsx` |
| 게시물 내용 | `posts` | `posts.service.ts` | — (수정 화면 미구현) |
| 게시물 상태 | `posts` | `posts.service.ts` | `post/[id].tsx` |
| 게시물 이미지 | `post-images` 버킷 | `useImageUpload` | `create.tsx` |
| 댓글 | `comments` | `comments.service.ts` | `post/[id].tsx` |
| 알림 읽음 | `notifications` | `notifications.service.ts` | `notifications.tsx` |
| 분실 알림 | `lost_alerts` | `lost-alerts.service.ts` | `lost-alerts.tsx` |
| 클레임 승인/거절 | `claims` + `posts` | `claims.service.ts` | `claims/[postId].tsx` |
| 신고 | `reports` | `reports.service.ts` | `post/[id].tsx` |
| 동네 목록 | `neighborhoods` | `neighborhoods.service.ts` | Supabase 대시보드 |
