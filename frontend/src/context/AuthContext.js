import { createContext, useContext, useState, useEffect } from 'react';
import apiClient, { wakeUpServer } from '../utils/apiClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [serverReady, setServerReady] = useState(false);

  // Wake up server on app load
  useEffect(() => {
    const initServer = async () => {
      const isAwake = await wakeUpServer();
      setServerReady(isAwake);
    };
    initServer();
  }, []);

  useEffect(() => {
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async (authToken) => {
    try {
      const response = await apiClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // Only logout if the token is invalid (401)
      if (error.response && error.response.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    setToken(response.data.token);
    setUser(response.data.user);
    localStorage.setItem('token', response.data.token);
    return response.data;
  };

  const register = async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    setToken(response.data.token);
    setUser(response.data.user);
    localStorage.setItem('token', response.data.token);
    return response.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        serverReady,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser: () => fetchUser(token)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

console.log("API configured with retry logic for cold starts");
