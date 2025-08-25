// src/types/index.ts

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
  MainTabs: undefined;
  ProductsList: undefined;
  AddProduct: undefined;
  ProductDetail: { productId: string };
  EditProduct: { productId: string };
  Chat: { 
    otherUserId: string; 
    otherUserName: string; 
    productId?: string;
  };
  UserProfile: { userId: string };
  MyProducts: undefined;
  Settings: undefined;
  Conversations: undefined;
  ChatScreen: { conversationId: string };
};

