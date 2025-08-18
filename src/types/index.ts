export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

export interface AuthError {
  code: string;
  message: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}

export interface FormData {
  email: string;
  password: string;
  displayName: string;
  confirmPassword: string;
}

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Products: undefined; // La lista de productos no necesita parámetros
  ProductDetail: { product: { title: string; description: string; /* ... otras propiedades del producto */ } }; // Define la estructura del objeto 'product'
};