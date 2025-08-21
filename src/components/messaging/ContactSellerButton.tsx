// src/components/messaging/ContactSellerButton.tsx

import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useMessaging } from '../../hooks/useMessaging';
import { auth } from '../../services/firebase/config';
import { Product } from '../../types/product'; // Asumiendo que tienes este tipo

interface ContactSellerButtonProps {
  product: Product;
  sellerId: string;
  sellerName?: string;
  style?: any;
  disabled?: boolean;
}

const ContactSellerButton: React.FC<ContactSellerButtonProps> = ({
  product,
  sellerId,
  sellerName = 'Vendedor',
  style,
  disabled = false,
}) => {
  const navigation = useNavigation<any>();
  const { createConversation } = useMessaging();
  const [loading, setLoading] = useState(false);

  const currentUser = auth.currentUser;

  // No mostrar el botón si es el propio producto del usuario
  if (currentUser?.uid === sellerId) {
    return null;
  }

  const handleContactSeller = async () => {
    if (!currentUser) {
      Alert.alert(
        'Inicia sesión',
        'Necesitas iniciar sesión para contactar al vendedor',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Iniciar sesión', 
            onPress: () => navigation.navigate('Login') 
          }
        ]
      );
      return;
    }

    try {
      setLoading(true);

      // Mensaje inicial personalizado
      const initialMessage = `Hola, me interesa tu producto "${product.title}". ¿Está disponible?`;

      // Crear o encontrar conversación existente
      const conversationId = await createConversation({
        participantId: sellerId,
        productId: product.id,
        initialMessage,
      });

      // Navegar al chat
      navigation.navigate('MessagingStack', {
        screen: 'Chat',
        params: {
          conversationId,
          otherUser: {
            name: sellerName,
            email: '', // Se obtendrá automáticamente del servicio
          },
        },
      });

    } catch (error) {
      console.error('Error contactando vendedor:', error);
      Alert.alert(
        'Error',
        'No se pudo contactar al vendedor. Inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style, disabled && styles.disabledButton]}
      onPress={handleContactSeller}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.loadingText}>Conectando...</Text>
        </View>
      ) : (
        <View style={styles.buttonContent}>
          <Ionicons name="chatbubble" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Contactar Vendedor</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Versión compacta para listas
export const ContactSellerButtonCompact: React.FC<ContactSellerButtonProps> = ({
  product,
  sellerId,
  sellerName = 'Vendedor',
  style,
  disabled = false,
}) => {
  const navigation = useNavigation<any>();
  const { createConversation } = useMessaging();
  const [loading, setLoading] = useState(false);

  const currentUser = auth.currentUser;

  if (currentUser?.uid === sellerId) {
    return null;
  }

  const handleContactSeller = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'Inicia sesión para contactar');
      return;
    }

    try {
      setLoading(true);

      const initialMessage = `Me interesa "${product.title}"`;

      const conversationId = await createConversation({
        participantId: sellerId,
        productId: product.id,
        initialMessage,
      });

      navigation.navigate('MessagingStack', {
        screen: 'Chat',
        params: {
          conversationId,
          otherUser: {
            name: sellerName,
            email: '',
          },
        },
      });

    } catch (error) {
      Alert.alert('Error', 'No se pudo contactar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.compactButton, style, disabled && styles.disabledCompactButton]}
      onPress={handleContactSeller}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : (
        <Ionicons name="chatbubble" size={16} color="#007AFF" />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  compactButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  disabledCompactButton: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
  },
});

export default ContactSellerButton;