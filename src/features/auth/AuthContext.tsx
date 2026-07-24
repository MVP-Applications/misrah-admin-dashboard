import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { getRefreshedAccessToken, setOnSessionExpired } from '../../api/client';
import { isLocalhost } from '../../config/env';
import * as authApi from './api';
import * as tokenStorage from './tokenStorage';
import type { AdminUser } from './types';

type AuthStatus = 'bootstrapping' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /**
   * Dev-only escape hatch for working on the UI before a real x-api-key is
   * available — bypasses the API entirely and fakes a session. No-ops unless
   * isLocalhost() is true, so it can never activate on a deployed build even
   * if env vars are misconfigured. Doesn't touch tokenStorage, so it never
   * persists across a reload and can't be confused with a real session.
   * TODO: safe to delete once real login is fully verified end-to-end, though
   * harmless to leave since it's hostname-gated.
   */
  loginWithMock: () => void;
}

// Fixed fake admin used only by loginWithMock() — never sent to or received
// from the API.
const MOCK_ADMIN_USER: AdminUser = {
  id: 'mock-admin-id',
  email: 'mock-admin@localhost.dev',
  userType: 'admin',
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('bootstrapping');
  const [user, setUser] = useState<AdminUser | null>(null);
  const hasBootstrapped = useRef(false);

  // Rehydrate the session on load using the persisted refresh token — this is
  // what lets a page reload keep the admin logged in instead of always
  // bouncing to /login.
  //
  // hasBootstrapped guards against React StrictMode's dev-mode double-invoke
  // of effects on mount: without it, this fired two concurrent refreshes with
  // the same (single-use, rotating) refresh token on every page load, and
  // whichever lost the race threw and wiped out the session the winner had
  // just established — that WAS the "refresh the page and I'm logged out"
  // bug. Also routes through the shared getRefreshedAccessToken (api/client.ts)
  // instead of calling authApi.refreshToken() independently, so this and the
  // 401-retry interceptor can never race each other either.
  //
  // Deliberately no isMounted/cleanup guard on the async work below: with
  // hasBootstrapped ensuring this only ever runs once, an isMounted flag set
  // by the effect's cleanup would actually break things — StrictMode runs
  // that cleanup synchronously right after the first invocation, well before
  // the bootstrap() promise resolves, which would flip isMounted to false and
  // silently swallow the eventual setStatus/setUser calls (the app would sit
  // on the loading spinner forever). AuthProvider wraps the whole app and is
  // never genuinely unmounted while it's running, so there's no real
  // set-state-after-unmount risk here to guard against.
  useEffect(() => {
    if (hasBootstrapped.current) return;
    hasBootstrapped.current = true;

    async function bootstrap() {
      const storedRefreshToken = tokenStorage.getRefreshToken();
      if (!storedRefreshToken) {
        setStatus('unauthenticated');
        return;
      }
      try {
        await getRefreshedAccessToken();
        const response = await authApi.autologin();
        // autologin mints its own fresh token pair (confirmed live, different
        // JWTs than the /refresh call right before it) — persist these, not
        // just the ones getRefreshedAccessToken already stored, or the next
        // reload's /refresh call would use an already-superseded token.
        tokenStorage.setAccessToken(response.access_token);
        tokenStorage.setRefreshToken(response.refresh_token);
        setUser(response.user);
        setStatus('authenticated');
      } catch {
        tokenStorage.clearAll();
        setStatus('unauthenticated');
      }
    }

    bootstrap();
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
    setUser(response.user);
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

  const loginWithMock = useCallback(() => {
    if (!isLocalhost()) return;
    setUser(MOCK_ADMIN_USER);
    setStatus('authenticated');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, logout, loginWithMock }),
    [status, user, login, logout, loginWithMock],
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
