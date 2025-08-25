// src/services/firebase/config.ts

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { Platform } from 'react-native';

import { 
  getFirestore, 
  connectFirestoreEmulator,
  enableNetwork, 
  disableNetwork 
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Configuración de Firebase
const firebaseConfig = {

  apiKey: "No te puedo decir",

  authDomain: "circulapp-b9564.firebaseapp.com",
  projectId: "circulapp-b9564",
  storageBucket: "circulapp-b9564.firebasestorage.app",
  messagingSenderId: "18177888188",
  appId: "1:18177888188:web:5a6c444e303d5ae91a25b9",
  measurementId: "G-JKGEE8YWJ0"
};

// ✅ Evitar inicializar más de una vez
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 🔑 Auth (Firebase maneja automáticamente la persistencia en React Native)
const auth = getAuth(app);

// 🗃️ Firestore
const db = getFirestore(app);

// 📱 Storage
const storage = getStorage(app);

// 🔧 Persistencia offline en Firestore (solo para web)
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  // Importación dinámica para evitar errores en React Native
  import('firebase/firestore').then(({ enableIndexedDbPersistence }) => {
    enableIndexedDbPersistence(db, {
      forceOwnership: false // Permite múltiples tabs
    }).catch((err) => {
      if (__DEV__) {
        if (err.code === 'failed-precondition') {
          console.warn("⚠️ Múltiples tabs abiertas, persistencia deshabilitada");
        } else if (err.code === 'unimplemented') {
          console.warn("⚠️ Navegador no soporta persistencia");
        } else {
          console.warn("⚠️ Error de persistencia:", err.code);
        }
      }
    });
  }).catch(() => {
    // No hacer nada si falla la importación
  });
}

// 🔧 Logs en modo desarrollo
if (__DEV__) {
  console.log('🔥 Firebase initialized successfully');
  console.log('📋 Project ID:', firebaseConfig.projectId);

  console.log('🗃️ Firestore enabled');
  console.log('📱 Storage enabled');
  console.log('🔐 Auth enabled (persistencia automática)');
  console.log('📱 Platform:', Platform.OS);
}

// 🔌 Emuladores (opcional, solo si los usas en local)
if (__DEV__ && false) { // Cambiar a true si quieres usar emuladores
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('🔧 Emuladores conectados');
  } catch (error) {
    console.log('⚠️ Emuladores ya conectados o no disponibles');
  }
}

// 🌐 Control de red (útil con NetInfo en App.tsx)
export const enableFirestoreNetwork = async () => {
  try {
    await enableNetwork(db);
    if (__DEV__) console.log('🌐 Firestore network enabled');
  } catch (error) {
    if (__DEV__) console.error('❌ Error enabling network:', error);
  }
};

export const disableFirestoreNetwork = async () => {
  try {
    await disableNetwork(db);
    if (__DEV__) console.log('📴 Firestore network disabled');
  } catch (error) {
    if (__DEV__) console.error('❌ Error disabling network:', error);
  }
};

// 👇 Exportar instancias listas para usar
export { app, auth, db, storage };

