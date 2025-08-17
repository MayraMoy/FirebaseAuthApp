import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
  AuthError as FirebaseAuthError
} from 'firebase/auth';
import { auth } from './config';
import { LoginCredentials, RegisterCredentials, User, AuthError } from '@/types';

export class AuthService {
  static async signIn(credentials: LoginCredentials): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );
      return this.mapFirebaseUser(userCredential.user);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  static async signUp(credentials: RegisterCredentials): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );
      
      if (credentials.displayName) {
        await updateProfile(userCredential.user, {
          displayName: credentials.displayName
        });
      }
      
      return this.mapFirebaseUser(userCredential.user);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  static async signOut(): Promise<void> {
    return signOut(auth);
  }

  static getCurrentUser(): User | null {
    const user = auth.currentUser;
    return user ? this.mapFirebaseUser(user) : null;
  }

  static onAuthStateChanged(callback: (user: User | null) => void) {
    return auth.onAuthStateChanged((user) => {
      callback(user ? this.mapFirebaseUser(user) : null);
    });
  }

  private static mapFirebaseUser(user: FirebaseUser): User {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    };
  }

  private static handleAuthError(error: FirebaseAuthError): AuthError {
    let message = 'Error desconocido';
    
    switch (error.code) {
      case 'auth/user-not-found':
        message = 'Usuario no encontrado';
        break;
      case 'auth/wrong-password':
        message = 'Contraseña incorrecta';
        break;
      case 'auth/email-already-in-use':
        message = 'El email ya está registrado';
        break;
      case 'auth/weak-password':
        message = 'La contraseña es muy débil';
        break;
      case 'auth/invalid-email':
        message = 'Email inválido';
        break;
      case 'auth/invalid-credential':
        message = 'Credenciales inválidas';
        break;
      default:
        message = error.message || 'Error de autenticación';
    }

    return {
      code: error.code || 'unknown',
      message
    };
  }
}