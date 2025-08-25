import { useState, useEffect } from 'react';
import { AuthService } from '@/services/firebase/auth';
import { User, LoginCredentials, RegisterCredentials, AuthError } from '@/types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>({
    uid: 'demo-user-id',
    email: 'demo@example.com',
    displayName: 'Usuario Demo',
    photoURL: null
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Comentado para saltar la autenticación real
  // useEffect(() => {
  //   const unsubscribe = AuthService.onAuthStateChanged((user) => {
  //     setUser(user);
  //     setLoading(false);
  //   });

  //   return unsubscribe;
  // }, []);

  const signIn = async (credentials: LoginCredentials): Promise<void> => {
    // Simulación de login exitoso
    setLoading(true);
    setError('');
    try {
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));
      // El usuario ya está autenticado, no necesitamos hacer nada
    } catch (err) {
      const authError = err as AuthError;
      setError(authError.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (credentials: RegisterCredentials): Promise<void> => {
    // Simulación de registro exitoso
    setLoading(true);
    setError('');
    try {
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));
      // El usuario ya está autenticado, no necesitamos hacer nada
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
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 500));
      // Para salir del modo demo, comentar la línea de abajo
      // setUser(null);
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