/**
 * An array of routes that are accessible to the public
 * These routes do not require authentication
 * @type {string[]}
 */
export const publicRoutes = [
  '/serverTest/mui',
  '/public/*',
  '/login/code',
] as const;

/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to /settings
 * @type {string[]}
 */
export const authRoutes = [
  '/login',
  '/register',
  '/error',
  '/reset',
  '/new-password',
  '/forgot-password',
  '/login/code',
];

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API authentication purposes
 * @type {string}
 */
export const apiAuthPrefix = '/api/auth';

/**
 * The default redirect path after logging in
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = '/dashboard';

export const ROUTES = {
  // ========== AUTENTICAÇÃO ==========
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    LOGOUT: '/logout',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    VERIFY_EMAIL: '/verify-email',
    TWO_FACTOR: '/two-factor',
  },

  // ========== PÁGINAS PRINCIPAIS ==========
  PUBLIC: {
    HOME: '/',
    ABOUT: '/about',
    CONTACT: '/contact',
    PRIVACY: '/privacy',
    TERMS: '/terms',
  },

  // ========== ÁREA PROTEGIDA ==========
  PROTECTED: {
    DASHBOARD: '/dashboard',
    PROFILE: '/profile',
    SETTINGS: '/settings',
    USERS: '/users',
    RETREATS: '/retreats',
    BOOKINGS: '/bookings',
  },

  // ========== RETIROS ==========
  RETREATS: {
    LIST: '/retreats',
    DETAILS: (id: string) => `/retreats/${id}`,
    BOOK: (id: string) => `/retreats/${id}/book`,
    SCHEDULE: '/retreats/schedule',
  },

  // ========== PERFIL DO USUÁRIO ==========
  USER: {
    PROFILE: '/profile',
    EDIT: '/profile/edit',
    BOOKINGS: '/profile/bookings',
    HISTORY: '/profile/history',
  },
};

export function isPublicPath(pathname: string): boolean {
  return publicRoutes.some((pattern) => {
    if (pattern === pathname) return true;
    if (pattern.includes('*')) {
      // Simple glob: only '*' supported, matches any remainder (including nested paths)
      // Ensure pattern like '/public/*' also matches '/public' (without trailing slash)
      const base = pattern.replace(/\*/g, '');
      if (pathname === base.slice(0, -1)) return true; // '/public'
      return pathname.startsWith(base);
    }
    return false;
  });
}
