import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { api, tokenStorage, StoredUser } from './api';
import { AuthResponse, UserProfile } from './types';

type AuthContextValue = {
  user: StoredUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<StoredUser>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) => Promise<StoredUser>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(() => tokenStorage.getUser());
  const [loading, setLoading] = useState(true);

  // Hydrate session on first mount: confirm token still valid via /profile
  useEffect(() => {
    const stored = tokenStorage.getUser();
    if (!stored || !tokenStorage.getAccessToken()) {
      setLoading(false);
      return;
    }
    api
      .get<UserProfile>('/auth/profile')
      .then((profile) => {
        const updated: StoredUser = {
          id: profile.id,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          role: profile.role,
        };
        tokenStorage.setSession(
          tokenStorage.getAccessToken()!,
          tokenStorage.getRefreshToken()!,
          updated
        );
        setUser(updated);
      })
      .catch(() => {
        tokenStorage.clear();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<AuthResponse>('/auth/login', { email, password }, { skipAuth: true });
    tokenStorage.setSession(data.accessToken, data.refreshToken, data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(
    async (input: { email: string; password: string; firstName: string; lastName: string; phone?: string }) => {
      const data = await api.post<AuthResponse>('/auth/register', input, { skipAuth: true });
      tokenStorage.setSession(data.accessToken, data.refreshToken, data.user);
      setUser(data.user);
      return data.user;
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      if (tokenStorage.getAccessToken()) {
        await api.post('/auth/logout');
      }
    } catch {
      // ignore — clearing local state is what matters
    }
    tokenStorage.clear();
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await api.get<UserProfile>('/auth/profile');
      const access = tokenStorage.getAccessToken();
      const refresh = tokenStorage.getRefreshToken();
      if (access && refresh) {
        const updated: StoredUser = {
          id: profile.id,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          role: profile.role,
        };
        tokenStorage.setSession(access, refresh, updated);
        setUser(updated);
      }
      return profile;
    } catch {
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
