// src/navigation/MessagingStackNavigator.tsx

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform, StyleSheet } from 'react-native';

import ConversationsScreen from '../screens/messaging/ConversationsScreen';
import ChatScreen from '../screens/messaging/ChatScreen';

// Tipos de parámetros para las pantallas
export type MessagingStackParamList = {
  Conversations: undefined;
  Chat: {
    conversationId: string;
    otherUser: {
      name: string;
      avatar?: string;
      email: string;
    };
  };
};

const Stack = createStackNavigator<MessagingStackParamList>();

const MessagingStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: '#e0e0e0',
        },
        headerTintColor: '#007AFF',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
        },
        headerBackTitle: '', // ✅ oculta el texto en iOS
      }}
    >
      <Stack.Screen
        name="Conversations"
        component={ConversationsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerTitle: 'Chat',
        }}
      />
    </Stack.Navigator>
  );
};


export default MessagingStackNavigator;