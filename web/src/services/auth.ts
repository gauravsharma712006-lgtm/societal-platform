export const TOKEN_KEY = 'societal_platform_access_token';
export const AUTH_CHANGED_EVENT = 'societal-platform-auth-changed';
const SESSION_MESSAGE_KEY = 'societal_platform_session_message';

// This is a UI expiry check. Only the API verifies signatures and permissions.
export const tokenExpiresAt = (token: string): number | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return Number.isSafeInteger(payload.exp) && payload.exp > 0 ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

export const auth = {
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(SESSION_MESSAGE_KEY);
  },

  getToken(): string | null {
    let token: string | null;
    try { token = localStorage.getItem(TOKEN_KEY); } catch { return null; }
    if (!token) return null;
    const expiresAt = tokenExpiresAt(token);
    if (!expiresAt || expiresAt <= Date.now()) {
      auth.removeToken('Your session expired. Please sign in again.');
      return null;
    }
    return token;
  },

  removeToken(message?: string): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      if (message) sessionStorage.setItem(SESSION_MESSAGE_KEY, message);
      else sessionStorage.removeItem(SESSION_MESSAGE_KEY);
    } catch { /* The context still clears if storage is unavailable. */ }
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  },

  isAuthenticated(): boolean {
    return Boolean(auth.getToken());
  },
  takeSessionMessage(): string {
    try {
      const message = sessionStorage.getItem(SESSION_MESSAGE_KEY) || '';
      sessionStorage.removeItem(SESSION_MESSAGE_KEY);
      return message;
    } catch { return ''; }
  },
};
