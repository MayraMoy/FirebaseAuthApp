import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/context/AuthContext';
import { AppNavigation } from '@/navigation/AppNavigation';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppNavigation />
    </AuthProvider>
  );
}
