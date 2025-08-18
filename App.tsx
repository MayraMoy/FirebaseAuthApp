// App.tsx o App.js
import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { AuthProvider } from "@/context/AuthContext";

// Importar configuración Firebase
import './src/services/firebase/config';
import { enableFirestoreNetwork, disableFirestoreNetwork } from './src/services/firebase/config';

// Importar navegación principal
import { AppNavigation } from './src/navigation/AppNavigation';

// Suprimir warnings específicos de Firebase
LogBox.ignoreLogs([
  '@firebase/firestore: Firestore',
  'WebChannelConnection RPC',
  'transport errored',
  'AsyncStorage has been extracted',
  'expo-permissions is now deprecated',
]);

export default function App() {
  useEffect(() => {
    // Monitorear conexión de red
    const unsubscribe = NetInfo.addEventListener(state => {
      if (__DEV__) {
        console.log('🌐 Network status:', state.isConnected ? 'Online' : 'Offline');
      }
      
      // Opcional: Manejar conexión/desconexión de Firestore
      if (state.isConnected) {
        enableFirestoreNetwork();
      } else {
        // Firestore maneja automáticamente el modo offline
        console.log('📴 App working offline');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
  <SafeAreaProvider>
    <AuthProvider>
      <NavigationContainer>
        <AppNavigation />
        <StatusBar style="auto" />
      </NavigationContainer>
    </AuthProvider>
  </SafeAreaProvider>
);
}
