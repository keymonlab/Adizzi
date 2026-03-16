# 위치기반 분실물 커뮤니티 앱 — MVP 설계 스펙

> **프로젝트명**: mampa (가칭)
> **작성일**: 2026-03-14
> **상태**: 설계 완료, 구현 계획 대기

---

## 1. 핵심 비전

동네 부모들이 아이 분실물을 사진+위치와 함께 게시하고, @멘션과 알림을 통해 신속하게 주인을 찾아주는 위치기반 커뮤니티 앱.

**핵심 가치**: "놀이터에서 아이 신발 발견 → 사진 찍고 게시 → 동네 부모들이 @멘션으로 전파 → 주인이 찾아감"

**차별점**: 당근은 중고거래 중심이고 커뮤니티는 부차적. 이 앱은 동네 부모 간 분실물 알림에 특화된 피드+댓글 기반 서비스.

---

## 2. 기술 스택

| 영역 | 기술 | 선택 이유 |
|------|------|-----------|
| 프론트엔드 | React Native (Expo) | iOS/Android 동시 지원, 빠른 MVP 개발 |
| 백엔드 | Supabase | Auth + Storage + Realtime + PostgreSQL 올인원 |
| 위치 | PostGIS | 행정동 폴리곤 매칭, 좌표 기반 쿼리 |
| 인증 | Supabase Auth | 카카오/네이버/구글 소셜 로그인 |
| 이미지 저장 | Supabase Storage | 분실물 사진 업로드/관리 |
| 실시간 알림 | Supabase Realtime | 새 게시물/댓글/멘션 즉시 알림 |
| 푸시 알림 | Expo Notifications | 앱 백그라운드/종료 시에도 알림 수신 |

---

## 3. 시스템 아키텍처

```
React Native (Expo) App
  ├── 홈 피드 (분실물 목록)
  ├── 게시 작성
  ├── 상세 페이지 (댓글 + 소유권 주장)
  ├── 지도 뷰
  ├── 알림
  └── 프로필/설정
        │
        ▼ Supabase Client SDK (HTTPS / WebSocket)
        │
Supabase Backend
  ├── Auth (카카오/네이버/구글 소셜 로그인)
  ├── Storage (분실물 사진)
  ├── Realtime (새 글/댓글/멘션 알림)
  └── PostgreSQL + PostGIS
        ├── users (프로필 + 동네)
        ├── neighborhoods (행정동 경계 데이터)
        ├── posts (분실물 게시글)
        ├── comments (댓글 + @멘션)
        ├── claims (소유권 주장)
        ├── notifications (알림)
        ├── lost_alerts (분실 알림 태그)
        ├── phone_hashes (전화번호 해시)
        └── contacts_matches (연락처 매칭)
```

---

## 4. 데이터 모델

### users
```sql
users
├── id (UUID, PK)
├── handle (text, UNIQUE)        -- @juni_mom (멘션용, 고유)
├── display_name (text)          -- "준이맘" (표시용, 중복 허용)
├── avatar_url (text)            -- 프로필 사진
├── neighborhood_id (FK → neighborhoods)
├── location_verified (boolean)  -- 동네 인증 여부
├── push_token (text, nullable) -- Expo 푸시 알림 토큰
├── created_at (timestamp)
└── updated_at (timestamp)
```

### neighborhoods
```sql
neighborhoods
├── id (UUID, PK)
├── name (text)           -- "서초동"
├── city (text)           -- "서울시"
├── district (text)       -- "서초구"
├── boundary (geometry)   -- PostGIS 폴리곤 (행정동 경계)
└── created_at (timestamp)
```

### posts
```sql
posts
├── id (UUID, PK)
├── author_id (FK → users)
├── neighborhood_id (FK → neighborhoods)
├── title (text)                        -- "놀이터에서 아이 신발 발견"
├── description (text)                  -- 상세 설명
├── category (enum)                     -- shoes/toy/clothing/bag/other
├── status (enum)                       -- active/resolved
├── location (geometry, Point)          -- 발견 위치 좌표
├── location_name (text)                -- "반포 래미안 놀이터"
├── image_urls (text[])                 -- 사진 URL 배열 (최대 5장)
├── verification_question (text, nullable) -- "이 신발의 브랜드는?"
├── verification_answer_hash (text, nullable) -- 정답의 HMAC-SHA256 해시 (서버 키로 서명, 원문 미저장)
├── deleted_at (timestamp, nullable) -- soft delete (신고 처리용)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### comments
```sql
comments
├── id (UUID, PK)
├── post_id (FK → posts)
├── author_id (FK → users)
├── content (text)          -- "@준이맘 이거 준이꺼 아니야?"
├── mentions (UUID[])       -- 멘션된 사용자 ID 배열
├── deleted_at (timestamp, nullable) -- soft delete (신고 처리용)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### claims (소유권 주장)
```sql
claims
├── id (UUID, PK)
├── post_id (FK → posts)          -- UNIQUE(post_id, claimant_id) 제약으로 중복 claim 방지
├── claimant_id (FK → users)
├── answer_hash (text, nullable) -- 검증 답변 HMAC 해시 (비교는 Edge Function에서 서버사이드 처리)
├── status (enum)               -- pending/verified/rejected
├── failed_attempts (integer)   -- 해당 사용자+게시물 기준 실패 횟수 (3회 초과 시 차단)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### notifications
```sql
notifications
├── id (UUID, PK)
├── recipient_id (FK → users)
├── type (enum)           -- new_post/comment/mention/claim/resolved/lost_alert_match
├── post_id (FK → posts)
├── actor_id (FK → users) -- 알림 발생시킨 사용자
├── read (boolean)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### lost_alerts (분실 알림 태그)
```sql
lost_alerts
├── id (UUID, PK)
├── user_id (FK → users)
├── category (enum)              -- shoes/toy/clothing/bag/other
├── keywords (text[])            -- ["나이키", "160"]
├── neighborhood_id (FK → neighborhoods)
├── active (boolean)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### phone_hashes (전화번호 매칭)
```sql
phone_hashes
├── id (UUID, PK)
├── user_id (FK → users)
├── phone_hash (text, UNIQUE)    -- HMAC-SHA256 해시 (서버 시크릿 키로 서명, DB 유출만으로 역추적 불가)
├── created_at (timestamp)
```

### contacts_matches (연락처 매칭 캐시)
```sql
contacts_matches
├── id (UUID, PK)
├── user_id (FK → users)         -- 연락처 소유자
├── matched_user_id (FK → users) -- 매칭된 앱 사용자
├── contact_name (text)          -- 내 폰에 저장된 이름 ("혁이맘")
├── created_at (timestamp)
```

---

## 5. 핵심 화면 (5개 + 서브)

### 메인 화면

| # | 화면 | 주요 요소 |
|---|------|-----------|
| ① | 홈 피드 | 동네명, 카테고리 필터 탭, 분실물 카드 리스트 (썸네일+제목+장소+시간+댓글수), 해결된 건 반투명 |
| ② | 게시 작성 | 사진 업로드 (최대 5장), 제목, 설명, 카테고리 선택, GPS 위치+장소명, 검증 질문/정답 (선택) |
| ③ | 상세 페이지 | 사진 슬라이더, 게시 정보, 상태 배지, "제 거예요!" 버튼, 댓글 영역 (@멘션 자동완성) |
| ④ | 지도 뷰 | 동네 지도, 분실물 핀 마커 (빨강=게시중, 초록=해결됨), 핀 클릭 시 미니 카드 |
| ⑤ | 알림 | 유형별 색상 구분 (빨강=새글, 초록=멘션, 노랑=소유권주장, 회색=댓글), 읽음/안읽음 |

### 하단 탭 네비게이션
🏠홈 | 🗺️지도 | ➕등록 | 🔔알림 | 👤내정보

### 서브 화면
- 온보딩: 소셜 로그인 → 표시이름 + 핸들 설정 → GPS 동네 인증
- 내 정보: 프로필, 내 게시물, 동네 설정, 연락처 동기화 설정
- 소유권 주장 관리: 게시자가 들어온 claim 확인/승인/거절
- 분실 알림 설정: 카테고리 + 키워드 태그 등록/관리

---

## 6. 사용자 플로우

### 플로우 1: 온보딩
```
앱 설치 → 소셜 로그인 (카카오/네이버/구글)
  → 표시이름 입력 ("준이맘")
  → 핸들 자동 제안 (이메일 prefix 기반, 수정 가능)
  → (선택) 연락처 접근 동의 → 전화번호 해시 매칭
  → GPS 위치 확인 → 행정동 매칭 ("서초동이 맞나요?")
  → 동네 인증 완료 → 홈 피드 진입
```

### 플로우 2: 분실물 발견자 → 게시
```
발견자가 놀이터에서 신발 발견
  → ➕ 등록 → 사진 촬영 (최대 5장)
  → 제목 + 설명 입력
  → 카테고리 선택 (신발)
  → 위치 자동 입력 (GPS) + 장소명 수정 가능
  → (선택) 검증 질문 설정: "브랜드는?" / 정답: "나이키"
  → 등록 → 공개 피드에 게시
  → 같은 동네 사용자에게 알림 + 매칭 태그 사용자에게 알림
```

### 플로우 3: 분실자 → 태그 등록
```
아이 신발을 잃어버린 부모
  → "분실 알림 설정" (카테고리: 신발, 키워드: "나이키 160")
  → 동네에 매칭되는 분실물 게시 시 푸시 알림 수신
  → 알림 클릭 → 상세 페이지 → "제 거예요!" 진행
```

### 플로우 4: @멘션으로 전파
```
댓글에 "@" 입력
  → 자동완성 표시:
    [내 연락처] 혁이맘 (방방이네) @bangbang
    [우리 동네] 동동이네 @dongdong
  → 선택하여 "@방방이네 이거 방방이꺼 아니야?" 전송
  → 해당 사용자에게 멘션 알림 → 게시글로 이동
```

### 플로우 5: 소유권 주장 → 해결
```
"제 거예요!" 클릭
  → [검증 질문 있음] 답변 입력 → 일치 시 게시자에게 알림
  → [검증 질문 없음] 바로 게시자에게 알림
  → 게시자가 claims 목록에서 확인 → 승인
  → 게시글 상태 → "해결됨"
```

---

## 7. @멘션 시스템

### 핸들 + 표시이름 분리
- **핸들** (@juni_mom): 시스템 고유 식별자, 멘션용
- **표시이름** ("준이맘"): 자유 입력, 중복 허용, UI 표시용
- 가입 시 소셜 이메일 prefix로 핸들 자동 제안 + 직접 수정 가능

### 전화번호부 연동
- 가입 시 연락처 접근 선택 동의
- 전화번호 원본은 저장하지 않음 — HMAC-SHA256 해시만 저장 (서버 시크릿 키 사용)
- 연락처 동기화 시 해시끼리 매칭 → contacts_matches 테이블에 캐시
- 멘션 자동완성에서 내 연락처 이름 + 앱 표시이름 함께 표시

### 멘션 범위
- 연락처 동의 O: 내 연락처에 있는 앱 사용자 + 같은 동네 사용자
- 연락처 동의 X: 같은 동네 사용자만

---

## 8. 소유권 검증 (사기 방지)

### 혼합 방식 (C안)
1. 게시 시 **검증 질문 설정** (선택사항)
2. "제 거예요" 클릭 → 검증 질문이 있으면 답변 입력
3. 답변 일치 → 게시자에게 알림 + 클레이머 정보 전달
4. 답변 불일치 → "정보가 일치하지 않습니다" (사용자+게시물 기준 3회 제한, 새 claim 생성으로 우회 불가)
5. 검증 질문 없는 게시글 → 게시자에게 바로 알림, 게시자가 직접 판단

---

## 9. 동네 인증

- **행정동 기반**: GPS 좌표 → PostGIS로 행정동 폴리곤 매칭
- 가입 시 1회 인증, 이후 동네 변경 시 재인증
- 피드는 인증된 행정동의 게시물만 표시

---

## 10. 에러 처리 & 엣지 케이스

| 상황 | 처리 |
|------|------|
| GPS 꺼져 있음 | "위치 서비스를 켜주세요" 안내 + 수동 동네 선택 폴백 |
| 사진 업로드 실패 | 재시도 버튼 + 로컬 임시 저장 |
| 동네 인증 실패 | "현재 위치가 행정동과 맞지 않습니다" + 재시도 |
| 검증 답변 틀림 | 재시도 제한 3회 |
| 허위 소유권 주장 반복 | 3회 이상 거절 시 claim 기능 일시 제한 |
| 부적절한 게시물/댓글 | 신고 버튼 → 관리자 검토 (MVP에서는 수동) |
| 연락처 동의 거부 | 동네 사용자 목록에서만 멘션 가능 |
| 오래된 분실물 | 30일 경과 시 자동 아카이브 + "아직 찾고 있나요?" 알림 |

> 에러 처리는 CBT를 통해 검증하며 점진적으로 보완할 예정.

---

## 11. MVP 범위

### 포함
- 소셜 로그인 (카카오/네이버/구글) + 동네 인증
- 핸들 + 표시이름 시스템
- 분실물 게시 (사진 + 위치 + 카테고리 + 검증 질문)
- 홈 피드 (카테고리 필터 + 상태 표시)
- 상세 페이지 (댓글 + @멘션)
- 소유권 주장 ("제 거예요" + 검증)
- 지도 뷰 (핀 마커)
- 알림 (새 글/멘션/소유권/댓글)
- 분실 알림 태그 (카테고리 + 키워드 매칭)
- 전화번호부 연동 (연락처 매칭)

### 미포함 (추후 확장)
- DM / 채팅
- 팔로우 시스템
- 동네 정보 공유 (분실물 외 일반 피드)
- 수익화 모델
- 관리자 대시보드

---

## 12. 보안: RLS 정책

Supabase는 Row Level Security로 접근 제어. 모든 테이블에 RLS 활성화.

| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| `users` | 같은 동네 사용자 (프로필 조회용) | Auth 트리거 자동 생성 | 본인만 | 불가 (soft delete) |
| `posts` | 같은 동네 사용자 | 인증된 사용자 | 작성자만 (status 변경) | 불가 (soft delete) |
| `comments` | 해당 post 조회 가능 사용자 | 인증된 사용자 | 작성자만 | 작성자만 |
| `claims` | 게시자: 자기 게시물의 claims / 클레이머: 자기 claims | 인증된 사용자 | 게시자 (status) | 불가 |
| `notifications` | 수신자만 | 서버 함수만 (service role) | 수신자만 (read 상태) | 수신자만 |
| `phone_hashes` | 불가 (매칭은 Edge Function에서 처리) | Edge Function만 | 불가 | 본인만 |
| `contacts_matches` | 본인만 | Edge Function만 | 불가 | 본인만 |
| `lost_alerts` | 본인만 | 인증된 사용자 | 본인만 | 본인만 |
| `reports` | 불가 (관리자만) | 인증된 사용자 | 불가 | 불가 |

**검증 답변 비교**: `verification_answer_hash`는 클라이언트에 노출되지 않음. 비교는 Supabase Edge Function에서 서버사이드로 처리. 답변을 소문자+트림 정규화 후 HMAC-SHA256 비교.

---

## 13. 보안: 해시 & 암호화

- **전화번호 해시**: HMAC-SHA256 with 서버 시크릿 키 (환경변수, DB 외부 저장). DB 유출만으로 역추적 불가.
- **검증 답변 해시**: 동일 HMAC-SHA256 방식. 소문자 변환 + 공백 트림 후 해시.
- **시크릿 키**: Supabase Vault 또는 환경변수로 관리. 코드/DB에 직접 저장하지 않음.
- **연락처 이름 (`contact_name`)**: MVP에서는 서버에 저장하되 DB 암호화 적용. 추후 클라이언트 전용 저장으로 전환 검토.

---

## 14. 인덱스

```sql
-- 피드 쿼리 (동네별 + 상태별 + 최신순)
CREATE INDEX idx_posts_feed ON posts(neighborhood_id, status, created_at DESC);

-- 공간 인덱스 (지도 뷰, 동네 매칭)
CREATE INDEX idx_posts_location ON posts USING GIST(location);
CREATE INDEX idx_neighborhoods_boundary ON neighborhoods USING GIST(boundary);

-- 알림 조회 (수신자별 + 읽음 상태 + 최신순)
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, read, created_at DESC);

-- 댓글 조회 (게시글별 + 시간순)
CREATE INDEX idx_comments_post ON comments(post_id, created_at);

-- 분실 알림 매칭 (동네별 + 카테고리 + 활성)
CREATE INDEX idx_lost_alerts_match ON lost_alerts(neighborhood_id, category, active);

-- 전화번호 해시 조회 (UNIQUE 제약에 btree 자동 생성)
-- phone_hashes.phone_hash는 UNIQUE 제약으로 이미 인덱스됨

-- 풀텍스트 검색 (분실 알림 키워드 매칭용)
CREATE INDEX idx_posts_fts ON posts USING GIN(to_tsvector('simple', title || ' ' || description));
```

---

## 15. 분실 알림 키워드 매칭 알고리즘

게시물 등록 시 → 매칭되는 `lost_alerts` 사용자에게 알림 발송.

**매칭 로직** (Supabase Edge Function 또는 DB 트리거):
```
1. 새 게시물의 neighborhood_id + category로 활성 lost_alerts 필터
2. 필터된 alerts의 keywords를 게시물 title + description에서 ILIKE 매칭
3. 모든 keyword 중 하나라도 일치하면 해당 alert 소유자에게 알림 발송
```

**매칭 방식**: PostgreSQL `ILIKE` + `ANY` 연산자. MVP에서는 단순 부분 문자열 매칭으로 시작하고, CBT 피드백에 따라 `tsvector` 풀텍스트 검색으로 개선.

---

## 16. 신고 & 모더레이션

### reports 테이블
```sql
reports
├── id (UUID, PK)
├── reporter_id (FK → users)
├── post_id (FK → posts, nullable)      -- 게시글 신고
├── comment_id (FK → comments, nullable) -- 댓글 신고
├── reason (text)                         -- 신고 사유
├── status (enum)                         -- pending/reviewed/dismissed
├── created_at (timestamp)
```

### Soft Delete
- `posts`와 `comments`에 `deleted_at (timestamp, nullable)` 추가
- 피드/댓글 쿼리에 `WHERE deleted_at IS NULL` 조건 적용
- 관리자가 신고 검토 후 soft delete 처리

---

## 17. 푸시 알림

분실물 앱의 핵심 가치(시간에 민감한 알림)를 위해 MVP에 포함.

- **Expo Notifications** (`expo-notifications`) 사용
- `users` 테이블에 `push_token (text, nullable)` 컬럼 추가
- 알림 발송은 Supabase Edge Function에서 Expo Push API 호출
- 발송 대상: 새 분실물(동네), @멘션, 소유권 주장, 분실 알림 태그 매칭

---

## 18. 페이지네이션

커서 기반 페이지네이션 적용 (`created_at` + `id` 복합 커서):
- 홈 피드: 20건/페이지
- 댓글: 30건/페이지
- 알림: 50건/페이지

---

## 19. 와이어프레임

와이어프레임은 `.superpowers/brainstorm/` 디렉토리에 HTML로 저장됨.
- `screens-overview.html`: 5개 핵심 화면 모바일 와이어프레임
