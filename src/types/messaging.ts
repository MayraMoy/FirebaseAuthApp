// src/types/messaging.ts

import { Timestamp } from 'firebase/firestore';

/**
 * 💬 Modelo de Conversación
 * Representa un chat entre dos usuarios
 */
export interface Conversation {
  id: string;
  participants: string[]; // IDs de usuarios participantes
  participantsInfo: {
    [userId: string]: {
      name: string;
      avatar?: string;
      email: string;
    };
  };
  productId?: string; // ID del producto relacionado (opcional)
  productInfo?: {
    id: string;
    title: string;
    images: string[];
    price?: number;
  };
  lastMessage: {
    text: string;
    senderId: string;
    timestamp: Timestamp;
    type: MessageType;
  };
  unreadCount: {
    [userId: string]: number; // Contador de no leídos por usuario
  };
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 📝 Modelo de Mensaje
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  type: MessageType;
  timestamp: Timestamp;
  isRead: boolean;
  readAt?: Timestamp;
  
  // Para mensajes especiales
  productInfo?: {
    id: string;
    title: string;
    image: string;
  };
  
  // Para mensajes del sistema
  systemData?: {
    action: 'product_reserved' | 'product_donated' | 'user_joined' | 'user_left';
    metadata?: any;
  };
}

/**
 * 🔤 Tipos de Mensajes
 */
export enum MessageType {
  TEXT = 'text',
  PRODUCT = 'product', // Mensaje con información de producto
  SYSTEM = 'system',   // Mensaje automático del sistema
  IMAGE = 'image',     // Para futuras funcionalidades
}

/**
 * 📱 Estado de Tipeo
 */
export interface TypingStatus {
  userId: string;
  isTyping: boolean;
  timestamp: Timestamp;
}

/**
 * 📋 DTO para crear conversación
 */
export interface CreateConversationData {
  participantId: string; // ID del otro usuario
  productId?: string;    // Producto relacionado (opcional)
  initialMessage: string; // Primer mensaje
}

/**
 * 📋 DTO para enviar mensaje
 */
export interface SendMessageData {
  conversationId: string;
  text: string;
  type: MessageType;
  productInfo?: Message['productInfo'];
}

/**
 * 📊 Estado del Chat
 */
export interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  unreadTotal: number;
}

/**
 * 🔍 Filtros para conversaciones
 */
export interface ConversationFilters {
  hasUnread?: boolean;
  productId?: string;
  participantName?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * 📄 Paginación para mensajes
 */
export interface MessagePagination {
  lastMessage?: Message;
  limit: number;
  hasMore: boolean;
}