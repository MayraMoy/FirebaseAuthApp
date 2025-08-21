// src/navigation/AppNavigation.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthContext } from '@/context/AuthContext';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';
import { HomeScreen } from '@/screens/main/HomeScreen';
import { ProductsListScreen } from '@/screens/product/ProductListScreen';
import { AddProductScreen } from '@/screens/product/AddProductScreen';
import { ProductDetailScreen } from '@/screens/product/ProductDetailScreen';
import { RootStackParamList } from '@/types';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
// En tu AppNavigator.tsx principal
import MessagingStackNavigator from './MessagingStackNavigator';

// Agregar al stack principal o como nueva tab

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const LoadingScreen: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#63ce9b" />
  </View>
);

// Navegación principal con tabs
const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#63ce9b',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#F0F0F0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#63ce9b',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="ProductsList"
        component={ProductsListScreen}
        options={{
          title: 'Productos',
          headerTitle: 'CirculApp',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🏪</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Perfil',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Stack principal para usuarios autenticados
const AuthenticatedStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#63ce9b',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddProduct"
        component={AddProductScreen}
        options={{
          title: 'Publicar Producto',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{
          title: 'Detalle del Producto',
        }}
      />
      {/* Más pantallas aquí */}
    </Stack.Navigator>
  );
};

// Stack para usuarios no autenticados
const UnauthenticatedStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

export const AppNavigation: React.FC = () => {
  const { user, loading } = useAuthContext();

  if (loading) {
    return <LoadingScreen />;
  }

  return user ? <AuthenticatedStack /> : <UnauthenticatedStack />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
});
