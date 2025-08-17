import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthContext } from '@/context/AuthContext';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';
import { HomeScreen } from '@/screens/main/HomeScreen';
import { RootStackParamList } from '@/types';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

const LoadingScreen: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007AFF" />
  </View>
);

export const AppNavigation: React.FC = () => {
  const { user, loading } = useAuthContext();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {user ? (
          // Usuario autenticado
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{
              title: 'Inicio',
              headerShown: false, // Ocultamos header en Home para mejor diseño
            }}
          />
        ) : (
          // Usuario no autenticado
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{
                title: 'Iniciar Sesión',
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
              options={{
                title: 'Crear Cuenta',
                headerShown: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
});