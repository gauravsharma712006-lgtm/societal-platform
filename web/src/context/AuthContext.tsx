import {
  createContext,
  useEffect,
  useState,
} from 'react';

import { api } from '../services/api';
import { auth } from '../services/auth';

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
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;

  useEffect(() => {
  const restoreSession = async () => {
    const token = auth.getToken();

    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const result = await api.getMe();

      setUser(result.data);
    } catch (error) {
      auth.removeToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  restoreSession();
}, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isLoading,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;