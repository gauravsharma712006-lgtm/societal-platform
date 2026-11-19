import {
  createContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';

import { api } from '../services/api';
import { auth, AUTH_CHANGED_EVENT, TOKEN_KEY, tokenExpiresAt } from '../services/auth';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  sessionError: string;
  retrySession: () => void;

  hasRole: (role: string) => boolean;
  hasAnyRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const restoreVersion = useRef(0);

  const isAuthenticated = user !== null;

  const logout = () => {
    auth.removeToken();
    setUser(null);
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (...roles: string[]): boolean => {
    return user !== null && roles.includes(user.role);
  };

  const restoreSession = useCallback(async () => {
      const version = ++restoreVersion.current;
      const token = auth.getToken();
      setSessionError('');

      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      try {
        const result = await api.getMe();

        if (version === restoreVersion.current && auth.getToken() === token) setUser(result.data);
      } catch (error) {
        if (version === restoreVersion.current) {
          setUser(null);
          if (auth.getToken() === token) setSessionError(error instanceof Error ? error.message : 'Unable to restore your session.');
        }
      } finally {
        if (version === restoreVersion.current) setIsLoading(false);
      }
  }, []);

  useEffect(() => {
    const changed = () => { void restoreSession(); };
    const storageChanged = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY || event.key === null) changed();
    };
    window.addEventListener(AUTH_CHANGED_EVENT, changed);
    window.addEventListener('storage', storageChanged);
    void restoreSession();
    return () => {
      restoreVersion.current += 1;
      window.removeEventListener(AUTH_CHANGED_EVENT, changed);
      window.removeEventListener('storage', storageChanged);
    };
  }, [restoreSession]);

  useEffect(() => {
    if (!user) return;
    setSessionError('');
    const token = auth.getToken();
    const expiresAt = token && tokenExpiresAt(token);
    if (!expiresAt) { setUser(null); return; }
    const deadline = setTimeout(() => auth.removeToken('Your session expired. Please sign in again.'), Math.max(0, expiresAt - Date.now()));
    return () => clearTimeout(deadline);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isLoading,
        isAuthenticated,
        logout,
        sessionError,
        retrySession: () => { void restoreSession(); },
        hasRole,
        hasAnyRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
