# Adizzi E2E Test Plan

## Application Overview

Adizzi (어디찌) is a Korean neighborhood-based lost-and-found community app built with Expo Router + React Native Web, backed by Supabase. All tests run against a local dev server at http://localhost:8081 with all Supabase APIs mocked via Playwright route interception. Auth is injected via localStorage. The viewport is 390x844 (iPhone-sized). Tests import from tests/e2e/fixtures/index.ts which provides authenticatedPage and unauthenticatedPage fixtures with pre-wired mocks. The existing suite covers 69 passing tests across auth, onboarding, verify-location, home-feed, create-post, post-detail, claims, notifications, lost-alerts, profile, edit-profile, neighborhood-settings, and navigation. This plan covers the gaps in the ten focus areas: button interactions, permission-based UI, post type switching, comment CRUD, report flow, category filtering, image slider, profile updates, error states, and responsive interactions.

## Test Scenarios

### 1. Comment CRUD

**Seed:** `tests/e2e/seed.spec.ts`

#### 1.1. submits a new comment and shows it in the list

**File:** `tests/e2e/comment-crud.spec.ts`

**Steps:**
  1. Call setupAuthenticatedUser(page), mockPostsApi(page, MOCK_POSTS), mockCommentsApi(page, MOCK_COMMENTS), mockNotificationsApi, mockNeighborhoodsApi, then navigate to /post/post-001
    - expect: Post title '놀이터에서 아이 신발 발견' is visible within 15 s
  2. Mock a successful POST to /rest/v1/comments that returns a new comment object with content '테스트 댓글입니다'
    - expect: Route is registered before any interaction
  3. Locate the comment input via placeholder '댓글을 입력하세요...' and type '테스트 댓글입니다'
    - expect: Input value matches the typed text
    - expect: '등록' submit button becomes visually active (primary color)
  4. Click the '등록' button and await the POST /rest/v1/comments network response
    - expect: POST request is made to the comments API
    - expect: The comment input is cleared after submission

#### 1.2. shows empty comments state when post has no comments

**File:** `tests/e2e/comment-crud.spec.ts`

**Steps:**
  1. Call setupAuthenticatedUser(page), mockPostsApi(page, [MOCK_POSTS[3]]) (post-004 with comment_count 0), mockCommentsApi(page, []), navigate to /post/post-004
    - expect: Post title '강아지를 잃어버렸어요' is visible within 15 s
  2. Wait for the comment list area to render
    - expect: The empty comment text '아직 댓글이 없어요. 첫 댓글을 남겨보세요!' is visible

#### 1.3. delete button is only shown for the comment owner

**File:** `tests/e2e/comment-crud.spec.ts`

**Steps:**
  1. Call setupAuthenticatedUser(page) so MOCK_USER (id: test-user-id-001) is the logged-in user. Mock comments that include one comment authored by MOCK_USER (comment-002 with author_id test-user-id-001) and one authored by MOCK_OTHER_USER_1 (comment-001). Navigate to /post/post-001
    - expect: Both comments are visible within 10 s
  2. Inspect the DOM for '삭제' delete buttons
    - expect: Exactly one '삭제' button is present and it belongs to the comment authored by MOCK_USER (comment-002 content '네, 연락 주세요!')
  3. Confirm '삭제' is NOT visible adjacent to the comment authored by MOCK_OTHER_USER_1 (comment-001 content '@testuser 이거 우리 아이꺼 같아요!')
    - expect: No delete affordance is shown for another user's comment

#### 1.4. clicking delete on own comment sends PATCH soft-delete request

**File:** `tests/e2e/comment-crud.spec.ts`

**Steps:**
  1. Set up auth as MOCK_USER, mock comments with comment-002 (owned by MOCK_USER), navigate to /post/post-001
    - expect: Comment content '네, 연락 주세요!' and its '삭제' button are visible
  2. Register a listener for PATCH /rest/v1/comments that returns 200, then click the '삭제' button
    - expect: A PATCH or DELETE network request is sent to the comments API

#### 1.5. submit button is disabled when comment input is empty

**File:** `tests/e2e/comment-crud.spec.ts`

**Steps:**
  1. Navigate to /post/post-001 as authenticated user
    - expect: Comment input is visible and empty on page load
  2. Confirm the '등록' button state without typing anything
    - expect: The '등록' button has the inactive (non-primary) background style and is not clickable to submit
  3. Type a single space in the input
    - expect: The '등록' button remains disabled because trimmed text is empty

#### 1.6. long-pressing another user's comment triggers report alert

**File:** `tests/e2e/comment-crud.spec.ts`

**Steps:**
  1. Set up auth as MOCK_USER, load post-001 with comment-001 authored by MOCK_OTHER_USER_1
    - expect: Comment '이거 우리 아이꺼 같아요!' is visible
  2. Long-press the comment authored by MOCK_OTHER_USER_1 for at least 400 ms
    - expect: An Alert dialog appears with '신고하기' and '취소' options
  3. Dismiss the alert by pressing '취소'
    - expect: The alert is dismissed and the post detail is still visible

### 2. Report Flow

**Seed:** `tests/e2e/seed.spec.ts`

#### 2.1. post options menu shows 신고하기 for non-owner

**File:** `tests/e2e/report-flow.spec.ts`

**Steps:**
  1. Set up auth as MOCK_USER, navigate to /post/post-002 (owned by MOCK_OTHER_USER_1, so MOCK_USER is NOT the owner)
    - expect: Post title '지갑을 잃어버렸어요' is visible within 15 s
  2. Click the ellipsis (three-dot) menu button in the post header
    - expect: A popup menu appears with the option '신고하기'
  3. Confirm '삭제하기' is NOT in the menu
    - expect: The destructive delete option is absent because the user does not own this post

#### 2.2. post options menu shows 삭제하기 for the post owner

**File:** `tests/e2e/report-flow.spec.ts`

**Steps:**
  1. Set up auth as MOCK_USER, navigate to /post/post-001 (owned by MOCK_USER with author_id test-user-id-001)
    - expect: Post title '놀이터에서 아이 신발 발견' is visible
  2. Click the ellipsis menu button in the post header
    - expect: A popup menu appears with '삭제하기' in red/destructive style
  3. Confirm '신고하기' is NOT shown
    - expect: Owners cannot report their own post

#### 2.3. report modal opens with all reason options

**File:** `tests/e2e/report-flow.spec.ts`

**Steps:**
  1. Navigate to /post/post-002, click the ellipsis menu, then click '신고하기'
    - expect: The report modal opens with title '게시물 신고'
  2. Inspect all radio options in the report modal
    - expect: All five reasons are present: '스팸/광고', '부적절한 내용', '사기/허위 정보', '괴롭힘/혐오', '기타'
  3. Confirm the additional description textarea is present
    - expect: A multiline input with placeholder '추가 설명 (선택사항)' is visible

#### 2.4. submitting a report without selecting a reason shows an alert

**File:** `tests/e2e/report-flow.spec.ts`

**Steps:**
  1. Open the report modal for post-002 by clicking ellipsis menu then '신고하기'
    - expect: Report modal is visible
  2. Click '신고하기' in the modal without selecting any reason
    - expect: An alert appears with text '신고 사유를 선택해주세요'

#### 2.5. report is submitted successfully with a selected reason

**File:** `tests/e2e/report-flow.spec.ts`

**Steps:**
  1. Mock a POST to /rest/v1/reports returning 201. Open the report modal for post-002
    - expect: Report modal is visible
  2. Select the '스팸/광고' radio option
    - expect: The radio button for '스팸/광고' shows as selected (filled dot)
  3. Click '신고하기' and await the POST /rest/v1/reports network response
    - expect: A POST is made to the reports API
    - expect: A success alert '신고가 접수되었습니다' appears
    - expect: The modal closes after submission

#### 2.6. report modal can be cancelled

**File:** `tests/e2e/report-flow.spec.ts`

**Steps:**
  1. Open the report modal for post-002, select '기타' reason
    - expect: Modal is open with '기타' selected
  2. Click '취소' button
    - expect: The modal closes without making any network request
  3. Reopen the modal by clicking ellipsis then '신고하기' again
    - expect: The modal state is reset — no reason is pre-selected from the previous session

#### 2.7. report modal closes when tapping the overlay

**File:** `tests/e2e/report-flow.spec.ts`

**Steps:**
  1. Open the report modal for post-002
    - expect: The modal overlay is visible
  2. Click on the semi-transparent overlay area outside the modal card
    - expect: The modal dismisses and the post detail is visible again

### 3. Claim Button Interactions

**Seed:** `tests/e2e/seed.spec.ts`

#### 3.1. found post shows 제 물건이에요! claim button for non-owner

**File:** `tests/e2e/claim-button.spec.ts`

**Steps:**
  1. Set up auth as MOCK_USER. Mock posts with MOCK_POSTS[0] (post-001, post_type: 'found', author_id: MOCK_USER.id). Since MOCK_USER is the author, confirm no button. Then use MOCK_POSTS[4] (post-005, post_type: 'found', author_id: MOCK_OTHER_USER_2.id) so MOCK_USER is NOT the owner. Mock claims returning [] for that post. Navigate to /post/post-005
    - expect: Post title '아이폰 충전기 발견' is visible within 15 s
  2. Wait for the claim button to render
    - expect: Button with text '제 물건이에요!' is visible

#### 3.2. lost post shows 찾았어요! claim button for non-owner

**File:** `tests/e2e/claim-button.spec.ts`

**Steps:**
  1. Set up auth as MOCK_USER. Mock posts with MOCK_POSTS[1] (post-002, post_type: 'lost', author_id: MOCK_OTHER_USER_1.id). Mock claims returning []. Navigate to /post/post-002
    - expect: Post title '지갑을 잃어버렸어요' is visible
  2. Wait for the claim button
    - expect: Button with text '찾았어요!' is visible

#### 3.3. claim button is hidden for post owner

**File:** `tests/e2e/claim-button.spec.ts`

**Steps:**
  1. Set up auth as MOCK_USER. Navigate to /post/post-001 (owned by MOCK_USER)
    - expect: Post title '놀이터에서 아이 신발 발견' is visible
  2. Look for '찾았어요!' or '제 물건이에요!' or '다시 시도하기' buttons
    - expect: No claim button is rendered because the user is the post owner

#### 3.4. claim button is hidden when post status is not active

**File:** `tests/e2e/claim-button.spec.ts`

**Steps:**
  1. Set up auth as MOCK_USER. Navigate to /post/post-003 (status: 'resolved', author_id: MOCK_OTHER_USER_2.id). Mock claims returning []
    - expect: Post title '열쇠 발견했습니다' is visible
  2. Inspect the page for any claim button
    - expect: No claim button is shown because the post status is 'resolved'

#### 3.5. pending claim shows waiting status banner

**File:** `tests/e2e/claim-button.spec.ts`

**Steps:**
  1. Set up auth as MOCK_OTHER_USER_1. Mock claims with MOCK_CLAIMS[0] (claim-001: post-001, claimant_id: MOCK_OTHER_USER_1.id, status: 'pending'). Navigate to /post/post-001
    - expect: Post detail is visible
  2. Wait for the claim status area to render
    - expect: A status banner with text containing '발견 신고 중... 글쓴이 확인을 기다리고 있어요' is visible (since post-001 is found type — but checking the type: post-001 is 'found' so text is '인증 신청 중... 주인님 확인을 기다리고 있어요')

#### 3.6. found post with verification question opens answer modal

**File:** `tests/e2e/claim-button.spec.ts`

**Steps:**
  1. Set up auth as MOCK_USER. Navigate to /post/post-005 (has verification_question: '충전기 색상은?'). Mock claims returning [] so button shows
    - expect: '제 물건이에요!' button is visible
  2. Click '제 물건이에요!'
    - expect: A modal appears with title '소유 확인' and the question text '충전기 색상은?' is displayed
  3. Check the modal action buttons
    - expect: '취소' and '제출' buttons are present; '제출' is disabled while the answer input is empty
  4. Type '흰색' in the answer input
    - expect: '제출' button becomes enabled
  5. Click '취소' to close the modal
    - expect: Modal dismisses without sending any network request

#### 3.7. max attempts reached shows lockout banner

**File:** `tests/e2e/claim-button.spec.ts`

**Steps:**
  1. Set up auth as MOCK_USER. Mock claims with MOCK_CLAIMS[2] (claim-003: post-005, claimant_id: MOCK_USER.id, status: 'rejected', failed_attempts: 3). Navigate to /post/post-005
    - expect: Post detail for '아이폰 충전기 발견' is visible
  2. Inspect the claim area
    - expect: A status banner showing '인증 횟수를 초과했어요 (3/3)' is displayed instead of any claim button

#### 3.8. clicking approve on a pending claim sends PATCH request

**File:** `tests/e2e/claim-button.spec.ts`

**Steps:**
  1. Navigate to /claims/post-001 as MOCK_USER. Mock claims with the two post-001 claims (claim-001: pending, claim-002: verified)
    - expect: '소유 요청 관리' header and both claimant names are visible
  2. Register a PATCH listener on /rest/v1/claims, then click the '승인' button for claim-001 (이웃주민 / pending claim)
    - expect: A PATCH request is sent to the claims API with status 'approved' or equivalent

#### 3.9. clicking reject on a pending claim sends PATCH request

**File:** `tests/e2e/claim-button.spec.ts`

**Steps:**
  1. Navigate to /claims/post-001 as MOCK_USER. Mock claims with claim-001 (pending)
    - expect: '승인' and '거절' buttons are visible for the pending claim
  2. Register a PATCH listener, then click '거절'
    - expect: A PATCH request is sent to the claims API with reject status

### 4. Post Type Switching and Verification Form

**Seed:** `tests/e2e/seed.spec.ts`

#### 4.1. verification form only appears when post type is found

**File:** `tests/e2e/post-type-verification.spec.ts`

**Steps:**
  1. Navigate to /(tabs)/create as authenticated user. Default post type is 'lost'
    - expect: '잃어버렸어요' toggle is active
    - expect: No verification form section is visible
  2. Click the '주웠어요' toggle
    - expect: '주웠어요' toggle becomes active
    - expect: A verification question section becomes attached/visible in the DOM
  3. Click back to '잃어버렸어요'
    - expect: The verification section disappears from the DOM

#### 4.2. switching to found clears verification state

**File:** `tests/e2e/post-type-verification.spec.ts`

**Steps:**
  1. Navigate to /(tabs)/create, click '주웃어요' toggle
    - expect: Verification section is visible
  2. Enable the verification question toggle (if present) and fill in a question and answer
    - expect: Question and answer inputs contain text
  3. Click '잃어버렸어요' toggle to switch back to lost
    - expect: Verification form is hidden
  4. Click '주웠어요' toggle again
    - expect: Verification fields are cleared/reset to empty

#### 4.3. header title updates immediately when switching post type

**File:** `tests/e2e/post-type-verification.spec.ts`

**Steps:**
  1. Navigate to /(tabs)/create
    - expect: Header title shows '잃어버렸어요'
  2. Click '주웠어요' toggle
    - expect: Header title changes to '주웠어요' within 1 s
  3. Click '잃어버렸어요' toggle
    - expect: Header title reverts to '잃어버렸어요'

#### 4.4. title and description placeholders change with post type

**File:** `tests/e2e/post-type-verification.spec.ts`

**Steps:**
  1. Navigate to /(tabs)/create. Observe placeholder text in the title and description inputs while post type is 'lost'
    - expect: Title placeholder is '잃어버린 물건을 입력해주세요'
    - expect: Description placeholder is '어디서 잃어버렸는지 자세히 설명해주세요'
  2. Click '주웠어요' toggle
    - expect: Title placeholder changes to '주운 물건을 입력해주세요'
    - expect: Description placeholder changes to '어디서 주웠는지 자세히 설명해주세요'

#### 4.5. found post with verification question submits with question and answer

**File:** `tests/e2e/post-type-verification.spec.ts`

**Steps:**
  1. Navigate to /(tabs)/create, click '주웠어요'
    - expect: Found mode is active
  2. Fill in title '테스트 습득물', description '카페에서 발견했습니다', select category '전자기기'
    - expect: All fields are populated
  3. If a verification toggle is present, enable it and enter question '브랜드는?' and answer '삼성'
    - expect: Question and answer fields accept input
  4. Mock POST /rest/v1/posts returning 201. Click '등록하기' and await the network response
    - expect: POST is sent to the posts API
    - expect: The submitted payload contains post_type: 'found'

#### 4.6. create form validation — missing title shows error

**File:** `tests/e2e/post-type-verification.spec.ts`

**Steps:**
  1. Navigate to /(tabs)/create. Do not fill in the title. Fill in description '설명만 있어요' and select a category '지갑'. Click '등록하기'
    - expect: No POST is sent to the API
    - expect: A validation error message appears near the title field

#### 4.7. create form validation — missing category shows error

**File:** `tests/e2e/post-type-verification.spec.ts`

**Steps:**
  1. Navigate to /(tabs)/create. Fill in title '제목만 있어요' and description '설명도 있어요'. Leave category unselected. Click '등록하기'
    - expect: No POST is sent to the API
    - expect: A validation error appears near the category field

### 5. Category Filtering

**Seed:** `tests/e2e/seed.spec.ts`

#### 5.1. selecting a category filter re-fetches posts with that category

**File:** `tests/e2e/category-filter.spec.ts`

**Steps:**
  1. Set up authenticated user, mock posts API with MOCK_POSTS. Navigate to /
    - expect: All five mock post titles are visible
  2. Register a request listener on GET /rest/v1/posts that captures the query string. Click the '지갑' category tab
    - expect: A GET request to /rest/v1/posts is made containing 'category=eq.wallet' in the query parameters

#### 5.2. selecting 전체 (all) clears the category filter

**File:** `tests/e2e/category-filter.spec.ts`

**Steps:**
  1. Navigate to /, click '전자기기' to filter
    - expect: Category filter changes to 전자기기
  2. Click '전체' to reset
    - expect: The 전체 tab is visually selected
    - expect: A GET request without category filter is made to the posts API

#### 5.3. active category tab is visually distinguished

**File:** `tests/e2e/category-filter.spec.ts`

**Steps:**
  1. Navigate to /. Observe the '전체' tab initial state
    - expect: '전체' tab appears selected/highlighted by default
  2. Click '신발' category tab
    - expect: '신발' tab is now highlighted as the active selection
    - expect: '전체' tab is no longer highlighted

#### 5.4. empty state appears when filtered category has no posts

**File:** `tests/e2e/category-filter.spec.ts`

**Steps:**
  1. Set up authenticated user. Mock posts API to return [] for any request. Navigate to /
    - expect: Empty state '아직 게시물이 없어요' is visible
  2. Click any category filter tab (e.g., '열쇠')
    - expect: Empty state is still shown — no posts appear for the selected category

#### 5.5. category filter tabs are all accessible in the scroll view

**File:** `tests/e2e/category-filter.spec.ts`

**Steps:**
  1. Navigate to / as authenticated user
    - expect: '전체' category tab is visible
  2. Verify all nine category tabs are attached to the DOM (some may be scrolled out of viewport)
    - expect: 전체, 전자기기, 지갑, 열쇠, 반려동물, 가방, 의류, 신발, 장난감, 기타 tabs are all present in the DOM

### 6. Image Slider

**Seed:** `tests/e2e/seed.spec.ts`

#### 6.1. image slider renders when post has images

**File:** `tests/e2e/image-slider.spec.ts`

**Steps:**
  1. Set up auth, mock posts with MOCK_POSTS[0] (post-001, image_urls: ['https://example.com/img1.jpg']). Mock the storage API to return a 1x1 PNG for any image GET. Navigate to /post/post-001
    - expect: An <img> element is rendered in the image slider area within 15 s

#### 6.2. pagination dots are shown for multi-image posts

**File:** `tests/e2e/image-slider.spec.ts`

**Steps:**
  1. Mock posts with MOCK_POSTS[1] (post-002, image_urls: ['https://example.com/img2.jpg', 'https://example.com/img3.jpg']). Navigate to /post/post-002
    - expect: Post detail is visible
  2. Inspect the DOM for pagination dot indicators
    - expect: Two dot indicators are rendered (one active wide dot, one inactive narrow dot)

#### 6.3. no image slider or dots rendered for posts with no images

**File:** `tests/e2e/image-slider.spec.ts`

**Steps:**
  1. Mock posts with MOCK_POSTS[2] (post-003, image_urls: []). Navigate to /post/post-003
    - expect: Post detail '열쇠 발견했습니다' is visible within 15 s
  2. Confirm no image element or dot indicators are present in the image slider area
    - expect: The ImageSlider component returns null and no slider or dots are in the DOM

#### 6.4. single-image post shows no pagination dots

**File:** `tests/e2e/image-slider.spec.ts`

**Steps:**
  1. Navigate to /post/post-001 which has exactly one image_url
    - expect: One image is rendered
  2. Inspect for dot indicators
    - expect: No dot container is rendered when there is only one image (images.length > 1 guard in ImageSlider)

### 7. Profile Updates

**Seed:** `tests/e2e/seed.spec.ts`

#### 7.1. editing display name and saving triggers PATCH and shows updated name

**File:** `tests/e2e/profile-updates.spec.ts`

**Steps:**
  1. Set up auth as MOCK_USER, navigate to /settings/edit-profile
    - expect: '프로필 수정' header is visible
    - expect: Display name input shows '테스트유저' (MOCK_USER.display_name)
  2. Clear the display name input and type '새이름'
    - expect: Input value is '새이름'
  3. Wait for the PATCH /rest/v1/users response, then click '저장'
    - expect: A PATCH request is sent to the users API containing the new display_name '새이름'

#### 7.2. editing handle and saving triggers PATCH with new handle

**File:** `tests/e2e/profile-updates.spec.ts`

**Steps:**
  1. Navigate to /settings/edit-profile. Locate the handle input (placeholder 'handle') which should show 'testuser'
    - expect: Handle input is visible with value 'testuser'
  2. Clear the handle input and type 'newhandle'
    - expect: Handle input shows 'newhandle'
  3. Click '저장' and await PATCH response
    - expect: PATCH is sent with the updated handle 'newhandle'

#### 7.3. save button is disabled when display name is only whitespace

**File:** `tests/e2e/profile-updates.spec.ts`

**Steps:**
  1. Navigate to /settings/edit-profile
    - expect: Form is loaded with MOCK_USER data
  2. Triple-click the display name input, press Backspace to empty it, then type three spaces
    - expect: The '저장' button becomes visually disabled (opacity < 0.9 on a parent node)
  3. Click '저장'
    - expect: No PATCH request is sent

#### 7.4. navigating to profile settings from profile tab works

**File:** `tests/e2e/profile-updates.spec.ts`

**Steps:**
  1. Set up auth, navigate to /(tabs)/profile
    - expect: '내 프로필' header and '프로필 수정' menu item are visible
  2. Click '프로필 수정'
    - expect: URL changes to /settings/edit-profile within 10 s

#### 7.5. profile screen shows correct display name and handle

**File:** `tests/e2e/profile-updates.spec.ts`

**Steps:**
  1. Navigate to /(tabs)/profile as MOCK_USER
    - expect: Display name '테스트유저' and handle '@testuser' are both visible

#### 7.6. neighborhood settings link navigates to /settings/neighborhood

**File:** `tests/e2e/profile-updates.spec.ts`

**Steps:**
  1. Navigate to /(tabs)/profile
    - expect: '동네 설정' menu item is visible
  2. Click '동네 설정'
    - expect: URL changes to /settings/neighborhood within 10 s

#### 7.7. lost-alerts settings link navigates to /settings/lost-alerts

**File:** `tests/e2e/profile-updates.spec.ts`

**Steps:**
  1. Navigate to /(tabs)/profile
    - expect: '분실물 알림' menu item is visible
  2. Click '분실물 알림'
    - expect: URL changes to /settings/lost-alerts within 10 s

### 8. Error States and Empty States

**Seed:** `tests/e2e/seed.spec.ts`

#### 8.1. post detail shows error state when API returns 500

**File:** `tests/e2e/error-states.spec.ts`

**Steps:**
  1. Set up auth, mock /rest/v1/posts to return HTTP 500. Navigate to /post/post-001
    - expect: The error view '게시물을 불러올 수 없어요' is visible within 15 s
  2. Confirm a '돌아가기' back button is present
    - expect: The '돌아가기' button is visible and clickable

#### 8.2. clicking 돌아가기 on post error screen navigates back

**File:** `tests/e2e/error-states.spec.ts`

**Steps:**
  1. Navigate to / then to /post/post-001 with mocked 500 error for the posts API
    - expect: '게시물을 불러올 수 없어요' is visible
  2. Click '돌아가기'
    - expect: The app navigates back (URL changes or the home feed becomes visible)

#### 8.3. home feed shows empty state when API returns empty array

**File:** `tests/e2e/error-states.spec.ts`

**Steps:**
  1. Set up auth, mock posts API to return []. Navigate to /
    - expect: '아직 게시물이 없어요' empty state text is visible within 10 s

#### 8.4. profile My Posts section shows empty state when user has no posts

**File:** `tests/e2e/error-states.spec.ts`

**Steps:**
  1. Set up auth, mock posts API to return []. Navigate to /(tabs)/profile
    - expect: '내 게시물' section header is visible
    - expect: '아직 작성한 게시물이 없어요' is visible within 10 s

#### 8.5. claims page shows empty state when post has no claims

**File:** `tests/e2e/error-states.spec.ts`

**Steps:**
  1. Set up auth, mock posts with MOCK_POSTS[0], mock claims with []. Navigate to /claims/post-001
    - expect: '소유 요청 관리' header is visible
    - expect: '아직 소유 요청이 없어요' empty state is visible

#### 8.6. notifications page shows empty state when there are no notifications

**File:** `tests/e2e/error-states.spec.ts`

**Steps:**
  1. Set up auth, mock notifications API to return []. Navigate to /(tabs)/notifications
    - expect: The notifications list area is visible
  2. Confirm no notification items are present
    - expect: An empty state message or empty list is shown without any notification items

#### 8.7. lost alerts settings shows empty state when user has no alerts

**File:** `tests/e2e/error-states.spec.ts`

**Steps:**
  1. Set up auth, mock /rest/v1/lost_alerts to return []. Navigate to /settings/lost-alerts
    - expect: Lost alerts settings page is visible
  2. Inspect for an empty state indicator
    - expect: An empty state message or empty list is shown indicating no alerts have been created

#### 8.8. login page is shown when user is not authenticated

**File:** `tests/e2e/error-states.spec.ts`

**Steps:**
  1. Use clearAuthState and mockUnauthenticated. Navigate to /
    - expect: The login page at /login is shown with '어디찌' branding and login buttons

### 9. Delete Post Interaction

**Seed:** `tests/e2e/seed.spec.ts`

#### 9.1. post owner sees 삭제하기 in options menu

**File:** `tests/e2e/delete-post.spec.ts`

**Steps:**
  1. Set up auth as MOCK_USER. Navigate to /post/post-001 (owned by MOCK_USER)
    - expect: Post detail is visible
  2. Click the three-dot ellipsis menu button in the post header
    - expect: A popup menu with '삭제하기' in a red/destructive color is shown

#### 9.2. clicking 삭제하기 shows confirmation alert

**File:** `tests/e2e/delete-post.spec.ts`

**Steps:**
  1. Open the options menu on /post/post-001 as the post owner and click '삭제하기'
    - expect: An Alert dialog appears with title '삭제' asking '게시물을 삭제하시겠습니까?' and buttons '취소' and '삭제'

#### 9.3. cancelling delete confirmation does not delete the post

**File:** `tests/e2e/delete-post.spec.ts`

**Steps:**
  1. Open the delete confirmation dialog on /post/post-001 and click '취소'
    - expect: The dialog dismisses
    - expect: The post detail page is still visible with the post content intact

#### 9.4. confirming delete calls softDeletePost API and navigates back

**File:** `tests/e2e/delete-post.spec.ts`

**Steps:**
  1. Register a listener for PATCH /rest/v1/posts (soft-delete sets deleted_at). Open the delete confirmation dialog on /post/post-001 and click '삭제'
    - expect: A PATCH request to the posts API is made (soft-delete)
    - expect: The app navigates back to the feed after deletion

### 10. Logout Button

**Seed:** `tests/e2e/seed.spec.ts`

#### 10.1. logout button is visible on profile tab

**File:** `tests/e2e/logout.spec.ts`

**Steps:**
  1. Set up auth as MOCK_USER, mock all required APIs. Navigate to /(tabs)/profile
    - expect: '로그아웃' button is visible within 15 s

#### 10.2. clicking logout sends POST to auth/v1/logout

**File:** `tests/e2e/logout.spec.ts`

**Steps:**
  1. Set up auth, override /auth/v1/logout to return 200 and /auth/v1/session to return null session. Navigate to /(tabs)/profile
    - expect: '로그아웃' button is visible
  2. Register a listener for POST /auth/v1/logout, then click '로그아웃'
    - expect: A POST to /auth/v1/logout is made
    - expect: The user's display name '테스트유저' becomes hidden after logout
    - expect: The app redirects to the login page

#### 10.3. after logout, navigating to / redirects to login

**File:** `tests/e2e/logout.spec.ts`

**Steps:**
  1. Set up auth with null session mock (already logged out state). Navigate to /
    - expect: The URL is /login or the login screen with '어디찌' branding is shown

### 11. Notifications Interactions

**Seed:** `tests/e2e/seed.spec.ts`

#### 11.1. unread notification badge count is visible on the tab bar

**File:** `tests/e2e/notifications-interactions.spec.ts`

**Steps:**
  1. Set up auth, mock notifications with MOCK_NOTIFICATIONS (4 unread: notif-001, notif-002, notif-004, notif-006). Navigate to /
    - expect: The Notifications tab in the tab bar shows a badge indicator with the unread count

#### 11.2. all notification types are rendered in the list

**File:** `tests/e2e/notifications-interactions.spec.ts`

**Steps:**
  1. Set up auth, mock MOCK_NOTIFICATIONS, navigate to /(tabs)/notifications
    - expect: Notifications page is visible within 15 s
  2. Inspect the notification list for items covering all notification types
    - expect: Notifications from actors '이웃주민' and '착한사람' are visible
    - expect: Post titles '놀이터에서 아이 신발 발견' and '지갑을 잃어버렸어요' appear in the list

#### 11.3. clicking a notification navigates to the related post

**File:** `tests/e2e/notifications-interactions.spec.ts`

**Steps:**
  1. Navigate to /(tabs)/notifications. Mock posts API so post-001 can load
    - expect: Notification for '놀이터에서 아이 신발 발견' is visible
  2. Click the notification item for post-001
    - expect: URL changes to /post/post-001 within 10 s

#### 11.4. marking notification as read sends PATCH request

**File:** `tests/e2e/notifications-interactions.spec.ts`

**Steps:**
  1. Navigate to /(tabs)/notifications with MOCK_NOTIFICATIONS loaded
    - expect: Unread notifications are visible
  2. Register a PATCH /rest/v1/notifications listener, then click an unread notification
    - expect: A PATCH request is sent to mark the notification as read

### 12. Post Status Badge and Post Card Display

**Seed:** `tests/e2e/seed.spec.ts`

#### 12.1. active lost post shows 찾는중 status badge in feed

**File:** `tests/e2e/post-status.spec.ts`

**Steps:**
  1. Set up auth, mock posts with MOCK_POSTS[1] (post-002, post_type: 'lost', status: 'active'). Navigate to /
    - expect: A status badge with text '찾는중' is visible on the post card within 10 s

#### 12.2. resolved post shows 해결됨 or equivalent resolved badge

**File:** `tests/e2e/post-status.spec.ts`

**Steps:**
  1. Set up auth, mock posts with MOCK_POSTS[2] (post-003, status: 'resolved'). Navigate to /
    - expect: A status badge indicating resolved/completed state is visible on the post card

#### 12.3. post card in feed shows comment count

**File:** `tests/e2e/post-status.spec.ts`

**Steps:**
  1. Navigate to / with all MOCK_POSTS. MOCK_POSTS[0] has comment_count: 3
    - expect: The comment count '3' is visible on the post-001 card

#### 12.4. post detail shows status badge alongside title

**File:** `tests/e2e/post-status.spec.ts`

**Steps:**
  1. Navigate to /post/post-002 (post_type: 'lost', status: 'active')
    - expect: The PostStatusBadge is visible next to the title in the detail view
