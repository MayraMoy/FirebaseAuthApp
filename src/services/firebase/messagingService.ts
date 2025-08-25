// src/services/firebase/messagingService.ts

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  onSnapshot, 
  getDoc, 
  getDocs,
  Timestamp,
  writeBatch,
  increment,
  arrayUnion,
  DocumentSnapshot,
  QuerySnapshot,
  Unsubscribe
} from 'firebase/firestore';

import { db, auth } from './config';
import { 
  Conversation, 
  Message, 
  CreateConversationData, 
  SendMessageData, 
  MessageType,
  ConversationFilters,
  MessagePagination 
} from '../../types/messaging';

/**
 * 🎯 Servicio de Mensajería
 * Maneja todas las operaciones de chat y conversaciones
 */
export class MessagingService {
  
  // 📚 Referencias a colecciones
  private conversationsRef = collection(db, 'conversations');
  private messagesRef = collection(db, 'messages');

  /**
   * 💬 Crear nueva conversación
   */
  async createConversation(data: CreateConversationData): Promise<string> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Usuario no autenticado');

      const participants = [currentUser.uid, data.participantId];

      // Verificar si ya existe una conversación entre estos usuarios
      const existingConversation = await this.findExistingConversation(
        currentUser.uid, 
        data.participantId, 
        data.productId
      );

      if (existingConversation) {
        return existingConversation.id;
      }

      // Obtener información de los participantes
      const participantsInfo = await this.getParticipantsInfo(participants);

      // Obtener información del producto si existe
      let productInfo = null;
      if (data.productId) {
        productInfo = await this.getProductInfo(data.productId);
      }

      const batch = writeBatch(db);

      // Crear conversación
      const conversationRef = doc(this.conversationsRef);
      const conversationData: Omit<Conversation, 'id'> = {
        participants,
        participantsInfo,
        productId: data.productId,
        productInfo,
        lastMessage: {
          text: data.initialMessage,
          senderId: currentUser.uid,
          timestamp: Timestamp.now(),
          type: MessageType.TEXT
        },
        unreadCount: {
          [currentUser.uid]: 0,
          [data.participantId]: 1
        },
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      batch.set(conversationRef, conversationData);

      // Crear primer mensaje
      const messageRef = doc(this.messagesRef);
      const messageData: Omit<Message, 'id'> = {
        conversationId: conversationRef.id,
        senderId: currentUser.uid,
        receiverId: data.participantId,
        text: data.initialMessage,
        type: MessageType.TEXT,
        timestamp: Timestamp.now(),
        isRead: false
      };

      batch.set(messageRef, messageData);

      await batch.commit();

      console.log('✅ Conversación creada:', conversationRef.id);
      return conversationRef.id;

    } catch (error) {
      console.error('❌ Error creando conversación:', error);
      throw error;
    }
  }

  /**
   * 📝 Enviar mensaje
   */
  async sendMessage(data: SendMessageData): Promise<string> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Usuario no autenticado');

      // Obtener conversación para saber el receptor
      const conversationDoc = await getDoc(doc(this.conversationsRef, data.conversationId));
      if (!conversationDoc.exists()) throw new Error('Conversación no encontrada');

      const conversation = { id: conversationDoc.id, ...conversationDoc.data() } as Conversation;
      const receiverId = conversation.participants.find(id => id !== currentUser.uid);
      if (!receiverId) throw new Error('Receptor no encontrado');

      const batch = writeBatch(db);

      // Crear mensaje
      const messageRef = doc(this.messagesRef);
      const messageData: Omit<Message, 'id'> = {
        conversationId: data.conversationId,
        senderId: currentUser.uid,
        receiverId,
        text: data.text,
        type: data.type,
        timestamp: Timestamp.now(),
        isRead: false,
        productInfo: data.productInfo
      };

      batch.set(messageRef, messageData);

      // Actualizar conversación
      const conversationUpdateData = {
        lastMessage: {
          text: data.text,
          senderId: currentUser.uid,
          timestamp: Timestamp.now(),
          type: data.type
        },
        [`unreadCount.${receiverId}`]: increment(1),
        updatedAt: Timestamp.now()
      };

      batch.update(doc(this.conversationsRef, data.conversationId), conversationUpdateData);

      await batch.commit();

      console.log('✅ Mensaje enviado:', messageRef.id);
      return messageRef.id;

    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      throw error;
    }
  }

  /**
   * 👀 Marcar mensajes como leídos
   */
  async markMessagesAsRead(conversationId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Usuario no autenticado');

      // Obtener mensajes no leídos
      const unreadMessagesQuery = query(
        this.messagesRef,
        where('conversationId', '==', conversationId),
        where('receiverId', '==', currentUser.uid),
        where('isRead', '==', false)
      );

      const unreadMessagesSnapshot = await getDocs(unreadMessagesQuery);
      
      if (unreadMessagesSnapshot.empty) return;

      const batch = writeBatch(db);

      // Marcar mensajes como leídos
      unreadMessagesSnapshot.forEach(doc => {
        batch.update(doc.ref, {
          isRead: true,
          readAt: Timestamp.now()
        });
      });

      // Resetear contador de no leídos en conversación
      batch.update(doc(this.conversationsRef, conversationId), {
        [`unreadCount.${currentUser.uid}`]: 0
      });

      await batch.commit();
      console.log('✅ Mensajes marcados como leídos');

    } catch (error) {
      console.error('❌ Error marcando mensajes como leídos:', error);
      throw error;
    }
  }

  /**
   * 📋 Obtener conversaciones del usuario
   */
  getUserConversations(
    userId: string, 
    filters?: ConversationFilters,
    callback?: (conversations: Conversation[]) => void
  ): Unsubscribe {
    try {
      let conversationsQuery = query(
        this.conversationsRef,
        where('participants', 'array-contains', userId),
        where('isActive', '==', true),
        orderBy('updatedAt', 'desc')
      );

      return onSnapshot(conversationsQuery, (snapshot) => {
        const conversations: Conversation[] = [];
        
        snapshot.forEach(doc => {
          const data = { id: doc.id, ...doc.data() } as Conversation;
          
          // Aplicar filtros si existen
          if (filters?.hasUnread && data.unreadCount[userId] === 0) return;
          if (filters?.productId && data.productId !== filters.productId) return;
          
          conversations.push(data);
        });

        if (callback) callback(conversations);
      });

    } catch (error) {
      console.error('❌ Error obteniendo conversaciones:', error);
      throw error;
    }
  }

  /**
   * 💬 Obtener mensajes de una conversación
   */
  getConversationMessages(
    conversationId: string,
    pagination?: MessagePagination,
    callback?: (messages: Message[], hasMore: boolean) => void
  ): Unsubscribe {
    try {
      let messagesQuery = query(
        this.messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'desc'),
        limit(pagination?.limit || 50)
      );

      if (pagination?.lastMessage) {
        messagesQuery = query(
          messagesQuery,
          startAfter(pagination.lastMessage.timestamp)
        );
      }

      return onSnapshot(messagesQuery, (snapshot) => {
        const messages: Message[] = [];
        
        snapshot.forEach(doc => {
          messages.push({ id: doc.id, ...doc.data() } as Message);
        });

        // Invertir para mostrar más recientes al final
        messages.reverse();

        const hasMore = messages.length === (pagination?.limit || 50);
        
        if (callback) callback(messages, hasMore);
      });

    } catch (error) {
      console.error('❌ Error obteniendo mensajes:', error);
      throw error;
    }
  }

  /**
   * 🔍 Buscar conversación existente
   */
  private async findExistingConversation(
    user1Id: string, 
    user2Id: string, 
    productId?: string
  ): Promise<Conversation | null> {
    try {
      let conversationsQuery = query(
        this.conversationsRef,
        where('participants', 'array-contains', user1Id),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(conversationsQuery);
      
      for (const doc of snapshot.docs) {
        const conversation = { id: doc.id, ...doc.data() } as Conversation;
        
        if (conversation.participants.includes(user2Id)) {
          // Si no hay producto específico, devolver la primera conversación encontrada
          if (!productId) return conversation;
          
          // Si hay producto específico, buscar conversación con ese producto
          if (conversation.productId === productId) return conversation;
        }
      }

      return null;

    } catch (error) {
      console.error('❌ Error buscando conversación existente:', error);
      return null;
    }
  }

  /**
   * 👥 Obtener información de participantes
   */
  private async getParticipantsInfo(userIds: string[]): Promise<{[userId: string]: any}> {
    const participantsInfo: {[userId: string]: any} = {};
    
    for (const userId of userIds) {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          participantsInfo[userId] = {
            name: userData.displayName || userData.email || 'Usuario',
            email: userData.email,
            avatar: userData.photoURL
          };
        }
      } catch (error) {
        console.error(`❌ Error obteniendo info del usuario ${userId}:`, error);
        participantsInfo[userId] = {
          name: 'Usuario',
          email: 'email@example.com'
        };
      }
    }

    return participantsInfo;
  }

  /**
   * 📦 Obtener información del producto
   */
  private async getProductInfo(productId: string): Promise<any> {
    try {
      const productDoc = await getDoc(doc(db, 'products', productId));
      if (productDoc.exists()) {
        const productData = productDoc.data();
        return {
          id: productId,
          title: productData.title,
          images: productData.images || [],
          price: productData.price
        };
      }
      return null;
    } catch (error) {
      console.error(`❌ Error obteniendo info del producto ${productId}:`, error);
      return null;
    }
  }

  /**
   * 🗑️ Eliminar conversación
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Usuario no autenticado');

      // En lugar de eliminar, marcar como inactiva para el usuario
      await updateDoc(doc(this.conversationsRef, conversationId), {
        isActive: false,
        updatedAt: Timestamp.now()
      });

      console.log('✅ Conversación eliminada');

    } catch (error) {
      console.error('❌ Error eliminando conversación:', error);
      throw error;
    }
  }

  /**
   * 📊 Obtener total de mensajes no leídos
   */
  getTotalUnreadCount(userId: string, callback: (count: number) => void): Unsubscribe {
    try {
      const conversationsQuery = query(
        this.conversationsRef,
        where('participants', 'array-contains', userId),
        where('isActive', '==', true)
      );

      return onSnapshot(conversationsQuery, (snapshot) => {
        let totalUnread = 0;
        
        snapshot.forEach(doc => {
          const conversation = doc.data() as Conversation;
          totalUnread += conversation.unreadCount[userId] || 0;
        });

        callback(totalUnread);
      });

    } catch (error) {
      console.error('❌ Error obteniendo total no leídos:', error);
      throw error;
    }
  }
}

// 📤 Exportar instancia singleton
export const messagingService = new MessagingService();