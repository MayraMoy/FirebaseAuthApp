import { useState, useEffect } from 'react';
import { AuthService } from '@/services/firebase/auth';
import { User, LoginCredentials, RegisterCredentials, AuthError } from '@/types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (credentials: LoginCredentials): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      await AuthService.signIn(credentials);
    } catch (err) {
      const authError = err as AuthError;
      setError(authError.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (credentials: RegisterCredentials): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      await AuthService.signUp(credentials);
    } catch (err) {
      const authError = err as AuthError;
      setError(authError.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      await AuthService.signOut();
    } catch (err) {
      setError('Error al cerrar sesión');
    } finally {
      setLoading(false);
    }
  };

  const clearError = (): void => {
    setError('');
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    clearError,
    isAuthenticated: !!user
  };
};