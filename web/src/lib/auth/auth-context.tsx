'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { setAuthToken } from '@/lib/api/client';
import { loginWithGoogle } from '@/lib/api/endpoints';
import { trackSignupConversion } from '@/lib/google-ads';
import type { AppUser } from '@/lib/types';

const TOKEN_STORAGE_KEY = 'askme_jwt';
const USER_STORAGE_KEY = 'askme_user';

type AuthStatus = 'unknown' | 'unauthenticated' | 'authenticating' | 'authenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: AppUser | null;
  errorMessage: string | null;
  isAuthenticated: boolean;
  signInWithGoogleIdToken: (idToken: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('unknown');
  const [user, setUser] = useState<AppUser | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Restaura a sessão a partir do JWT salvo, se houver — sem validar contra o
  // backend aqui; se estiver expirado, a primeira chamada autenticada retorna
  // 401 e a UI trata como deslogado (mesma estratégia do AuthViewModel Flutter).
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (!storedToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('unauthenticated');
      return;
    }

    setAuthToken(storedToken);
    if (storedUser) setUser(JSON.parse(storedUser) as AppUser);
    setStatus('authenticated');
  }, []);

  const signInWithGoogleIdToken = useCallback(async (idToken: string) => {
    setStatus('authenticating');
    setErrorMessage(null);

    try {
      const result = await loginWithGoogle(idToken);
      localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
      setAuthToken(result.token);
      setUser(result.user);
      setStatus('authenticated');
      if (result.isNewUser) trackSignupConversion();
    } catch {
      setErrorMessage('Não foi possível entrar com o Google. Tente novamente.');
      setStatus('unauthenticated');
    }
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setAuthToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        errorMessage,
        isAuthenticated: status === 'authenticated',
        signInWithGoogleIdToken,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
