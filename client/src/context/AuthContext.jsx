import { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const response = await axiosInstance.get('/auth/session');
      if (response.data && response.data.data) {
        setUser(response.data.data.user);
        setRole(response.data.data.role);
        setPermissions(response.data.data.permissions || []);
      }
    } catch (error) {
      setUser(null);
      setRole(null);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchSession();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await axiosInstance.post('/auth/login', { email, password });
    const { accessToken } = response.data.data.tokens;

    // Store only the short-lived access token in localStorage
    // The refresh token is set by the server as an HttpOnly cookie
    localStorage.setItem('accessToken', accessToken);

    await fetchSession();
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
      setPermissions([]);
      window.location.href = '/login';
    }
  };

  const hasPermission = (permissionString) => {
    if (role?.name === 'Super Admin') return true;
    return permissions.includes(permissionString);
  };

  return (
    <AuthContext.Provider value={{ user, role, permissions, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
