import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setOnSessionExpired } from '../../api/client';
import * as authApi from './api';
import * as tokenStorage from './tokenStorage';
import type { AdminUser } from './types';

type AuthStatus = 'bootstrapping' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('bootstrapping');
  const [user, setUser] = useState<AdminUser | null>(null);

  // Rehydrate the session on load using the persisted refresh token — this is
  // what lets a page reload keep the admin logged in instead of always
  // bouncing to /login.
  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      const storedRefreshToken = tokenStorage.getRefreshToken();
      if (!storedRefreshToken) {
        if (isMounted) setStatus('unauthenticated');
        return;
      }
      try {
        const refreshed = await authApi.refreshToken({ refresh_token: storedRefreshToken });
        tokenStorage.setAccessToken(refreshed.access_token);
        tokenStorage.setRefreshToken(refreshed.refresh_token);
        const admin = await authApi.autologin();
        if (isMounted) {
          setUser(admin);
          setStatus('authenticated');
        }
      } catch {
        tokenStorage.clearAll();
        if (isMounted) setStatus('unauthenticated');
      }
    }

    bootstrap();
    return () => {
      isMounted = false;
    };
  }, []);

  // Lets a silent refresh failure anywhere in the app (triggered from
  // api/client.ts's 401 interceptor) force a clean logout.
  useEffect(() => {
    setOnSessionExpired(() => {
      tokenStorage.clearAll();
      setUser(null);
      setStatus('unauthenticated');
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    tokenStorage.setAccessToken(response.access_token);
    tokenStorage.setRefreshToken(response.refresh_token);
    setUser(response.admin);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    const storedRefreshToken = tokenStorage.getRefreshToken();
    if (storedRefreshToken) {
      try {
        await authApi.logout({ refresh_token: storedRefreshToken });
      } catch {
        // Best-effort revoke — always clear local state below regardless of
        // whether the server call succeeded.
      }
    }
    tokenStorage.clearAll();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, logout }),
    [status, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
