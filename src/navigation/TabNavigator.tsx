// src/navigation/TabNavigator.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

// Importar tus pantallas existentes
import { HomeScreen } from '@/screens/main/HomeScreen';
import ProductsScreen  from '@/screens/product/ProductsScreen';
import { AddProductScreen } from '@/screens/product/AddProductScreen';
import ProfileScreen  from '@/screens/profile/ProfileScreen';

// Importar el nuevo stack de mensajería
import MessagingStackNavigator from './MessagingStackNavigator';

// Importar componentes de mensajería
import { TabUnreadBadge } from '../screens/messaging/UnreadBadge';
import { useMessaging } from '../hooks/useMessaging';

const Tab = createBottomTabNavigator();

// Componente para el ícono de mensajes con badge
const MessagesTabIcon: React.FC<{ focused: boolean; color: string; size: number }> = ({
  focused,
  color,
  size,
}) => {
  const { totalUnread } = useMessaging();

  return (
    <View style={{ position: 'relative' }}>
      <Ionicons
        name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
        size={size}
        color={color}
      />
      <TabUnreadBadge count={totalUnread} />
    </View>
  );
};

const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Products':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'Add':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'Messages':
              // Usar el componente personalizado para mensajes
              return <MessagesTabIcon focused={focused} color={color} size={size} />;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Inicio',
        }}
      />
      
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          title: 'Productos',
        }}
      />
      
      <Tab.Screen
        name="Add"
        component={AddProductScreen}
        options={{
          title: 'Agregar',
        }}
      />
      
      {/* Nueva tab de mensajes */}
      <Tab.Screen
        name="Messages"
        component={MessagingStackNavigator}
        options={{
          title: 'Mensajes',
          headerShown: false, // El header se maneja en el stack
        }}
      />
      
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;