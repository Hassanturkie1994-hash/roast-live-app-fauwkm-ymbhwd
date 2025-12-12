
import { useState, useEffect } from 'react';
import { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading user data
    setTimeout(() => {
      setUser({
        id: '1',
        username: '@roastmaster',
        displayName: 'Roast Master',
        bio: 'Professional roaster 🔥',
        followers: 12500,
        following: 342,
        verified: true,
      });
      setLoading(false);
    }, 1000);
  }, []);

  const login = async (username: string, password: string) => {
    console.log('Login attempt:', username);
    // Implement login logic
  };

  const logout = async () => {
    console.log('Logout');
    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    console.log('Update profile:', updates);
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    updateProfile,
  };
}
