import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cargo_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('cargo_token') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const profile = await api.getMe();
        setUser(profile);
      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    }

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    checkAuth();

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [token]);

  const login = async (username, password) => {
    const data = await api.login(username, password);
    const tokenVal = data.token || data.access_token;
    const userObj = {
      username: data.username || data.user?.username || username,
      full_name: data.full_name || data.user?.full_name || username,
    };
    if (tokenVal) {
      localStorage.setItem('cargo_token', tokenVal);
      localStorage.setItem('cargo_user', JSON.stringify(userObj));
      setToken(tokenVal);
      setUser(userObj);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('cargo_token');
    localStorage.removeItem('cargo_user');
    setToken('');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
