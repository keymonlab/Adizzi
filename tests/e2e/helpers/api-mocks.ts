import { Page } from '@playwright/test';

const SUPABASE_URL = 'https://iqmnoebrlbanarxopziw.supabase.co';

/** Check if a Supabase request expects a single object (.single()) */
function isSingleRequest(request: { headers(): Record<string, string> }): boolean {
  const accept = request.headers()['accept'] || '';
  return accept.includes('application/vnd.pgrst.object+json');
}

/** Fulfill with array or single object based on request Accept header */
function fulfillData(route: any, request: any, data: any[], status = 200) {
  const single = isSingleRequest(request);
  route.fulfill({
    status,
    contentType: single ? 'application/vnd.pgrst.object+json' : 'application/json',
    body: JSON.stringify(single ? (data[0] ?? null) : data),
  });
}

// ---------------------------------------------------------------------------
// Auth mocking
// ---------------------------------------------------------------------------

export async function mockSupabaseAuth(page: Page, session: any) {
  // GET /auth/v1/session
  await page.route(`${SUPABASE_URL}/auth/v1/session`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(session),
    });
  });

  // POST /auth/v1/token?grant_type=password (email login) and refresh variants
  await page.route(`${SUPABASE_URL}/auth/v1/token**`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(session),
    });
  });

  // GET /auth/v1/user
  await page.route(`${SUPABASE_URL}/auth/v1/user`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(session.user),
    });
  });

  // POST /auth/v1/logout
  await page.route(`${SUPABASE_URL}/auth/v1/logout`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    });
  });
}

export async function mockUnauthenticated(page: Page) {
  // Clear any existing session from localStorage before page scripts run
  await page.addInitScript((key: string) => {
    localStorage.removeItem(key);
  }, 'sb-iqmnoebrlbanarxopziw-auth-token');

  await page.route(`${SUPABASE_URL}/auth/v1/session`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { session: null } }),
    });
  });

  await page.route(`${SUPABASE_URL}/auth/v1/user`, (route) => {
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'not authenticated' }),
    });
  });

  // Mock token refresh to return error so the client treats the session as expired
  await page.route(`${SUPABASE_URL}/auth/v1/token**`, (route) => {
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid Refresh Token' }),
    });
  });
}

// ---------------------------------------------------------------------------
// REST API mocking helpers
// ---------------------------------------------------------------------------

export async function mockPostsApi(
  page: Page,
  posts: any[],
  options?: { status?: number },
) {
  await page.route(`${SUPABASE_URL}/rest/v1/posts*`, (route, request) => {
    const method = request.method();

    if (method === 'GET') {
      // Single-row requests come with ?id=eq.<id>; return first match or empty array
      const url = new URL(request.url());
      const idFilter = url.searchParams.get('id');
      const data = idFilter
        ? posts.filter((p) => String(p.id) === idFilter.replace('eq.', ''))
        : posts;

      fulfillData(route, request, data, options?.status ?? 200);
    } else if (method === 'POST') {
      const body = request.postData();
      const incoming = body ? JSON.parse(body) : {};
      const incomingRow = Array.isArray(incoming) ? incoming[0] : incoming;
      // Merge with posts[0] so DB-generated fields (id, created_at, etc.) are present
      const created = { ...(posts[0] ?? {}), ...(incomingRow ?? {}) };
      const single = isSingleRequest(request);
      route.fulfill({
        status: 201,
        contentType: single ? 'application/vnd.pgrst.object+json' : 'application/json',
        body: JSON.stringify(created),
      });
    } else if (method === 'PATCH') {
      const body = request.postData();
      const updates = body ? JSON.parse(body) : {};
      const url = new URL(request.url());
      const idFilter = url.searchParams.get('id');
      const target = idFilter
        ? posts.find((p) => String(p.id) === idFilter.replace('eq.', ''))
        : posts[0];
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...(target || {}), ...updates }),
      });
    } else if (method === 'DELETE') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}',
      });
    } else {
      route.continue();
    }
  });
}

export async function mockUsersApi(page: Page, profile: any) {
  await page.route(`${SUPABASE_URL}/rest/v1/users*`, (route, request) => {
    const method = request.method();
    const accept = request.headers()['accept'] || '';
    const isSingle = accept.includes('application/vnd.pgrst.object+json');

    if (method === 'GET') {
      route.fulfill({
        status: 200,
        contentType: isSingle ? 'application/vnd.pgrst.object+json' : 'application/json',
        body: JSON.stringify(isSingle ? profile : [profile]),
      });
    } else if (method === 'PATCH') {
      const body = request.postData();
      const updates = body ? JSON.parse(body) : {};
      route.fulfill({
        status: 200,
        contentType: isSingle ? 'application/vnd.pgrst.object+json' : 'application/json',
        body: JSON.stringify({ ...profile, ...updates }),
      });
    } else {
      route.continue();
    }
  });
}

export async function mockCommentsApi(page: Page, comments: any[]) {
  await page.route(`${SUPABASE_URL}/rest/v1/comments*`, (route, request) => {
    const method = request.method();

    if (method === 'GET') {
      const url = new URL(request.url());
      const postIdFilter = url.searchParams.get('post_id');
      const data = postIdFilter
        ? comments.filter(
            (c) => String(c.post_id) === postIdFilter.replace('eq.', ''),
          )
        : comments;
      fulfillData(route, request, data);
    } else if (method === 'POST') {
      const body = request.postData();
      const incoming = body ? JSON.parse(body) : {};
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(incoming || comments[0] || {}),
      });
    } else if (method === 'PATCH') {
      const body = request.postData();
      const updates = body ? JSON.parse(body) : {};
      const url = new URL(request.url());
      const idFilter = url.searchParams.get('id');
      const target = idFilter
        ? comments.find(
            (c) => String(c.id) === idFilter.replace('eq.', ''),
          )
        : comments[0];
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...(target || {}), ...updates }),
      });
    } else if (method === 'DELETE') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}',
      });
    } else {
      route.continue();
    }
  });
}

export async function mockNotificationsApi(page: Page, notifications: any[]) {
  await page.route(
    `${SUPABASE_URL}/rest/v1/notifications*`,
    (route, request) => {
      const method = request.method();

      if (method === 'GET') {
        const url = new URL(request.url());
        const userIdFilter = url.searchParams.get('user_id');
        const data = userIdFilter
          ? notifications.filter(
              (n) =>
                String(n.user_id) === userIdFilter.replace('eq.', ''),
            )
          : notifications;
        fulfillData(route, request, data);
      } else if (method === 'PATCH') {
        // Typically used to mark notifications as read
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '{}',
        });
      } else {
        route.continue();
      }
    },
  );
}

export async function mockClaimsApi(page: Page, claims: any[]) {
  await page.route(`${SUPABASE_URL}/rest/v1/claims*`, (route, request) => {
    const method = request.method();

    if (method === 'GET') {
      const url = new URL(request.url());
      const postIdFilter = url.searchParams.get('post_id');
      const data = postIdFilter
        ? claims.filter(
            (c) => String(c.post_id) === postIdFilter.replace('eq.', ''),
          )
        : claims;
      fulfillData(route, request, data);
    } else if (method === 'POST') {
      const body = request.postData();
      const incoming = body ? JSON.parse(body) : {};
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(incoming || claims[0] || {}),
      });
    } else if (method === 'PATCH') {
      const body = request.postData();
      const updates = body ? JSON.parse(body) : {};
      const url = new URL(request.url());
      const idFilter = url.searchParams.get('id');
      const target = idFilter
        ? claims.find((c) => String(c.id) === idFilter.replace('eq.', ''))
        : claims[0];
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...(target || {}), ...updates }),
      });
    } else if (method === 'DELETE') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}',
      });
    } else {
      route.continue();
    }
  });
}

export async function mockNeighborhoodsApi(page: Page, neighborhoods: any[]) {
  await page.route(
    `${SUPABASE_URL}/rest/v1/neighborhoods*`,
    (route, request) => {
      const method = request.method();

      if (method === 'GET') {
        const url = new URL(request.url());
        const idFilter = url.searchParams.get('id');
        const data = idFilter
          ? neighborhoods.filter(
              (n) => String(n.id) === idFilter.replace('eq.', ''),
            )
          : neighborhoods;
        fulfillData(route, request, data);
      } else {
        route.continue();
      }
    },
  );
}

export async function mockLostAlertsApi(page: Page, alerts: any[]) {
  await page.route(
    `${SUPABASE_URL}/rest/v1/lost_alerts*`,
    (route, request) => {
      const method = request.method();

      if (method === 'GET') {
        const url = new URL(request.url());
        const idFilter = url.searchParams.get('id');
        const data = idFilter
          ? alerts.filter(
              (a) => String(a.id) === idFilter.replace('eq.', ''),
            )
          : alerts;
        fulfillData(route, request, data);
      } else if (method === 'POST') {
        const body = request.postData();
        const incoming = body ? JSON.parse(body) : {};
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(incoming || alerts[0] || {}),
        });
      } else if (method === 'PATCH') {
        const body = request.postData();
        const updates = body ? JSON.parse(body) : {};
        const url = new URL(request.url());
        const idFilter = url.searchParams.get('id');
        const target = idFilter
          ? alerts.find(
              (a) => String(a.id) === idFilter.replace('eq.', ''),
            )
          : alerts[0];
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...(target || {}), ...updates }),
        });
      } else if (method === 'DELETE') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '{}',
        });
      } else {
        route.continue();
      }
    },
  );
}

export async function mockStorageApi(page: Page) {
  await page.route(`${SUPABASE_URL}/storage/v1/**`, (route, request) => {
    const method = request.method();

    if (method === 'POST' || method === 'PUT') {
      // Simulate a successful upload
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ Key: 'mock-image.jpg' }),
      });
    } else if (method === 'GET') {
      // Return a minimal 1x1 transparent PNG for image fetches
      route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          'base64',
        ),
      });
    } else if (method === 'DELETE') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Successfully deleted' }),
      });
    } else {
      route.continue();
    }
  });
}

// ---------------------------------------------------------------------------
// RPC call mocking (PostGIS functions, etc.)
// ---------------------------------------------------------------------------

export async function mockRpc(
  page: Page,
  functionName: string,
  response: any,
) {
  await page.route(
    `${SUPABASE_URL}/rest/v1/rpc/${functionName}`,
    (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    },
  );
}

// ---------------------------------------------------------------------------
// Convenience: mock all APIs at once with optional overrides
// ---------------------------------------------------------------------------

export interface MockAllApisOptions {
  posts?: any[];
  user?: any;
  notifications?: any[];
  comments?: any[];
  claims?: any[];
  neighborhoods?: any[];
  lostAlerts?: any[];
  session?: any;
}

export async function mockAllApis(
  page: Page,
  overrides: MockAllApisOptions = {},
) {
  const defaultUser = overrides.user ?? {
    id: 'user-default-id',
    email: 'test@example.com',
    user_metadata: { full_name: 'Test User' },
  };

  const defaultSession = overrides.session ?? {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: defaultUser,
  };

  await mockSupabaseAuth(page, defaultSession);
  await mockPostsApi(page, overrides.posts ?? []);
  await mockUsersApi(page, defaultUser);
  await mockCommentsApi(page, overrides.comments ?? []);
  await mockNotificationsApi(page, overrides.notifications ?? []);
  await mockClaimsApi(page, overrides.claims ?? []);
  await mockNeighborhoodsApi(page, overrides.neighborhoods ?? []);
  await mockLostAlertsApi(page, overrides.lostAlerts ?? []);
  await mockStorageApi(page);
}
