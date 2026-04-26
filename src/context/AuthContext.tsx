import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { API_BASE_URL, clearCachedCsrfToken, ensureCsrfToken } from '../lib/api';
import type { InterestsProfile } from '../lib/interestsOnboarding';

interface UserData {
  id: string;
  email: string;
  displayName: string | null;
  username: string | null;
  avatar: string | null;
  bio: string | null;
  status: string;
  interests?: InterestsProfile | null;
  /** Present when returned by auth `/me`; false for OAuth-only accounts. */
  hasPassword?: boolean;
}

export interface SignupInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SigninInput {
  email: string;
  password: string;
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  refreshUser: () => Promise<UserData | null>;
  signup: (data: SignupInput) => Promise<UserData | null>;
  signin: (data: SigninInput) => Promise<UserData | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async (showLoadingSpinner = true): Promise<UserData | null> => {
    try {
      if (showLoadingSpinner) setLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: 'include',
      });

      if (res.ok) {
        const data = (await res.json()) as UserData;
        setUser(data);
        return data;
      }
      setUser(null);
      return null;
    } catch {
      setUser(null);
      return null;
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const csrf = await ensureCsrfToken();
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRF-Token': csrf },
      });
    } catch {
      // ignore
    } finally {
      clearCachedCsrfToken();
      setUser(null);
    }
  };

  /** Re-fetch `/me` without toggling global `loading` (avoids ProtectedRoute full-screen flash). */
  const refreshUser = async () => fetchUser(false);

  const signup = async (data: SignupInput) => {
    const csrf = await ensureCsrfToken();
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || 'Registration failed');
    }
    await res.json().catch(() => ({}));
    return fetchUser();
  };

  const signin = async (data: SigninInput) => {
    const csrf = await ensureCsrfToken();
    const res = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || 'Invalid email or password');
    }
    await res.json().catch(() => ({}));
    return fetchUser();
  };

  useEffect(() => {
    void fetchUser(true);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, logout, refreshUser, signup, signin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
