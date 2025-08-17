import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Configuración usando variables de entorno
const firebaseConfig = {
  apiKey: "AIzaSyDELjxVG7PLYBKnJ3ByrqeBYFl6IatSCfc",
  authDomain: "circulapp-b9564.firebaseapp.com",
  projectId: "circulapp-b9564",
  storageBucket: "circulapp-b9564.firebasestorage.app",
  messagingSenderId: "18177888188",
  appId: "1:18177888188:web:5a6c444e303d5ae91a25b9",
  measurementId: "G-JKGEE8YWJ0"
};

// Validación de configuración
const requiredKeys = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', 
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID'
];

const missingKeys = requiredKeys.filter(key => !process.env[key]);

if (missingKeys.length > 0) {
  console.error('🔥 Firebase Configuration Error:');
  console.error('Missing environment variables:', missingKeys.join(', '));
  console.error('Please check your .env file');
  throw new Error(`Missing Firebase configuration: ${missingKeys.join(', ')}`);
}

// Inicializar Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

if (__DEV__) {
  console.log('🔥 Firebase initialized successfully');
  console.log('📋 Project ID:', firebaseConfig.projectId);
}