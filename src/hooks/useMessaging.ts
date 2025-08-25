// src/hooks/useMessaging.ts

import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../services/firebase/config';
import { messagingService } from '../services/firebase/messagingService';
import { 
  Conversation, 
  Message, 
  CreateConversationData, 
  SendMessageData, 
  MessagePagination,
  ConversationFilters 
} from '../types/messaging';

/**
 * 🎯 Hook principal para el sistema de mensajería
 */
export const useMessaging = () => {
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);

  // 👤 Monitorear usuario autenticado
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (!user) {
        setConversations([]);
        setTotalUnread(0);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // 📋 Cargar conversaciones del usuario
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    setError(null);

    const unsubscribe = messagingService.getUserConversations(
      user.uid,
      undefined,
      (conversations) => {
        setConversations(conversations);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  // 🔢 Monitorear total de mensajes no leídos
  useEffect(() => {
    if (!user) return;

    const unsubscribe = messagingService.getTotalUnreadCount(
      user.uid,
      setTotalUnread
    );

    return unsubscribe;
  }, [user]);

  // 💬 Crear nueva conversación
  const createConversation = useCallback(async (data: CreateConversationData) => {
    try {
      setError(null);
      const conversationId = await messagingService.createConversation(data);
      return conversationId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error creando conversación';
      setError(errorMessage);
      throw error;
    }
  }, []);

  // 📝 Enviar mensaje
  const sendMessage = useCallback(async (data: SendMessageData) => {
    try {
      setError(null);
      const messageId = await messagingService.sendMessage(data);
      return messageId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error enviando mensaje';
      setError(errorMessage);
      throw error;
    }
  }, []);

  // 👀 Marcar mensajes como leídos
  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      setError(null);
      await messagingService.markMessagesAsRead(conversationId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error marcando como leído';
      setError(errorMessage);
    }
  }, []);

  // 🗑️ Eliminar conversación
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      setError(null);
      await messagingService.deleteConversation(conversationId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error eliminando conversación';
      setError(errorMessage);
      throw error;
    }
  }, []);

  return {
    user,
    conversations,
    loading,
    error,
    totalUnread,
    createConversation,
    sendMessage,
    markAsRead,
    deleteConversation
  };
};

/**
 * 💬 Hook para manejar una conversación específica
 */
export const useConversation = (conversationId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState<MessagePagination>({
    limit: 50,
    hasMore: true
  });

  // 💬 Cargar mensajes de la conversación
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = messagingService.getConversationMessages(
      conversationId,
      pagination,
      (newMessages, hasMoreMessages) => {
        setMessages(newMessages);
        setHasMore(hasMoreMessages);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [conversationId, pagination.limit]);

  // 📄 Cargar más mensajes
  const loadMoreMessages = useCallback(() => {
    if (!conversationId || !hasMore || loading) return;

    const lastMessage = messages[0]; // El más antiguo
    if (!lastMessage) return;

    setPagination(prev => ({
      ...prev,
      lastMessage
    }));
  }, [conversationId, hasMore, loading, messages]);

  // 👀 Marcar conversación como leída
  const markConversationAsRead = useCallback(async () => {
    if (!conversationId) return;

    try {
      await messagingService.markMessagesAsRead(conversationId);
    } catch (error) {
      console.error('Error marcando conversación como leída:', error);
    }
  }, [conversationId]);

  return {
    messages,
    loading,
    error,
    hasMore,
    loadMoreMessages,
    markConversationAsRead
  };
};

/**
 * 🔍 Hook para buscar conversaciones
 */
export const useConversationSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ConversationFilters>({});
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);

  const searchConversations = useCallback((
    conversations: Conversation[], 
    term: string, 
    activeFilters: ConversationFilters
  ) => {
    let filtered = conversations;

    // Filtrar por término de búsqueda
    if (term) {
      const lowerTerm = term.toLowerCase();
      filtered = filtered.filter(conv => {
        // Buscar en nombres de participantes
        const participantMatch = Object.values(conv.participantsInfo).some(info => 
          info.name.toLowerCase().includes(lowerTerm)
        );

        // Buscar en último mensaje
        const messageMatch = conv.lastMessage.text.toLowerCase().includes(lowerTerm);

        // Buscar en título del producto
        const productMatch = conv.productInfo?.title?.toLowerCase().includes(lowerTerm);

        return participantMatch || messageMatch || productMatch;
      });
    }

    // Aplicar filtros adicionales
    if (activeFilters.hasUnread) {
      filtered = filtered.filter(conv => {
        const currentUserId = auth.currentUser?.uid;
        return currentUserId ? conv.unreadCount[currentUserId] > 0 : false;
      });
    }

    if (activeFilters.productId) {
      filtered = filtered.filter(conv => conv.productId === activeFilters.productId);
    }

    setFilteredConversations(filtered);
  }, []);

  return {
    searchTerm,
    filters,
    filteredConversations,
    setSearchTerm,
    setFilters,
    searchConversations
  };
};

/**
 * ⌨️ Hook para estado de tipeo
 */
export const useTypingStatus = (conversationId: string | null) => {
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  // Implementación básica - se puede expandir con Firestore real-time
  const startTyping = useCallback(() => {
    setIsTyping(true);
  }, []);

  const stopTyping = useCallback(() => {
    setIsTyping(false);
  }, []);

  return {
    isTyping,
    otherUserTyping,
    startTyping,
    stopTyping
  };

};