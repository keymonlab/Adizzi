import { test as base, Page } from '@playwright/test';
import { setupAuthenticatedUser, clearAuthState } from '../helpers/auth';
import { mockUnauthenticated } from '../helpers/api-mocks';
import { mockPostsApi, mockNotificationsApi, mockNeighborhoodsApi, mockCommentsApi } from '../helpers/api-mocks';
import { MOCK_POSTS, MOCK_NOTIFICATIONS, MOCK_NEIGHBORHOODS, MOCK_COMMENTS } from '../helpers/mock-data';

type Fixtures = {
  authenticatedPage: Page;
  unauthenticatedPage: Page;
};

export const test = base.extend<Fixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Set up full auth mocks + common API mocks
    await setupAuthenticatedUser(page);
    await mockPostsApi(page, MOCK_POSTS);
    await mockNotificationsApi(page, MOCK_NOTIFICATIONS);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);
    await mockCommentsApi(page, MOCK_COMMENTS);
    await use(page);
  },
  unauthenticatedPage: async ({ page }, use) => {
    await clearAuthState(page);
    await mockUnauthenticated(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
