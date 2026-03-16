// Route parameter types for type-safe navigation

export type RootStackParamList = {
  '(auth)': undefined;
  '(tabs)': undefined;
  'post/[id]': {
    id: string;
  };
  'claims/[postId]': {
    postId: string;
  };
  'settings/edit-profile': undefined;
  'settings/neighborhood': undefined;
  'settings/lost-alerts': undefined;
  'settings/contacts': undefined;
};

export type AuthStackParamList = {
  login: undefined;
  onboarding: undefined;
  'verify-location': undefined;
};

export type TabsStackParamList = {
  index: undefined;
  map: undefined;
  create: undefined;
  notifications: undefined;
  profile: undefined;
};

// Helper type for route names
export type RouteNames = keyof RootStackParamList;
