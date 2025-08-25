// src/screens/messaging/ChatScreen.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';

import { useConversation, useMessaging } from '../../hooks/useMessaging';
import { Message, MessageType } from '../../types/messaging';
import { formatTime, formatChatDate, isSameDay } from '../../utils/dateUtils';
import { auth } from '../../services/firebase/config';

const { width: screenWidth } = Dimensions.get('window');
const maxBubbleWidth = screenWidth * 0.75;

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar: boolean;
  otherUserName: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  showAvatar,
  otherUserName
}) => {
  return (
    <View style={[
      styles.messageContainer,
      isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
    ]}>
      {!isOwnMessage && showAvatar && (
        <View style={styles.avatarContainer}>
          <View style={styles.messageAvatar}>
            <Text style={styles.avatarText}>
              {otherUserName.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
      )}
      
      <View style={[
        styles.messageBubble,
        isOwnMessage ? styles.ownBubble : styles.otherBubble,
        !isOwnMessage && !showAvatar && styles.otherBubbleWithoutAvatar
      ]}>
        <Text style={[
          styles.messageText,
          isOwnMessage ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {message.text}
        </Text>
        
        <View style={styles.messageFooter}>
          <Text style={[
            styles.messageTime,
            isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
          ]}>
            {formatTime(message.timestamp)}
          </Text>
          
          {isOwnMessage && (
            <View style={styles.messageStatus}>
              <Ionicons
                name={message.isRead ? "checkmark-done" : "checkmark"}
                size={12}
                color={message.isRead ? "#007AFF" : "#999"}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

interface DateSeparatorProps {
  date: string;
}

const DateSeparator: React.FC<DateSeparatorProps> = ({ date }) => (
  <View style={styles.dateSeparatorContainer}>
    <View style={styles.dateSeparatorLine} />
    <Text style={styles.dateSeparatorText}>{date}</Text>
    <View style={styles.dateSeparatorLine} />
  </View>
);

interface ChatScreenProps {}

const ChatScreen: React.FC<ChatScreenProps> = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { conversationId, otherUser } = route.params;
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  const { sendMessage } = useMessaging();
  const {
    messages,
    loading,
    error,
    hasMore,
    loadMoreMessages,
    markConversationAsRead
  } = useConversation(conversationId);

  const currentUserId = auth.currentUser?.uid;

  // Marcar mensajes como leídos cuando se abre la conversación
  useEffect(() => {
    markConversationAsRead();
  }, [conversationId]);

  // Scroll al final cuando llegan nuevos mensajes
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: 0, animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Configurar header
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitle}>
          <View style={styles.headerAvatar}>
            {otherUser?.avatar ? (
              <Image source={{ uri: otherUser.avatar }} style={styles.headerAvatarImage} />
            ) : (
              <View style={styles.headerDefaultAvatar}>
                <Text style={styles.headerAvatarText}>
                  {otherUser?.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{otherUser?.name || 'Usuario'}</Text>
            {isTyping && (
              <Text style={styles.typingIndicator}>escribiendo...</Text>
            )}
          </View>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => {
            // Navegar al perfil del usuario o mostrar opciones
            Alert.alert('Opciones', 'Funcionalidad próximamente');
          }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#007AFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, otherUser, isTyping]);

  // Enviar mensaje
  const handleSendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !conversationId) return;

    try {
      setInputText('');
      
      await sendMessage({
        conversationId,
        text,
        type: MessageType.TEXT
      });

    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar el mensaje');
      setInputText(text); // Restaurar texto si falla
    }
  }, [inputText, conversationId, sendMessage]);

  // Preparar datos para renderizado con separadores de fecha
  const prepareMessagesWithSeparators = useCallback(() => {
    const items: Array<Message | { type: 'date'; date: string; id: string }> = [];
    let lastDate: string | null = null;

    // Los mensajes vienen ordenados del más reciente al más antiguo
    // Los invertimos para procesarlos cronológicamente
    const sortedMessages = [...messages].reverse();

    sortedMessages.forEach((message, index) => {
      const messageDate = formatChatDate(message.timestamp);
      
      // Agregar separador de fecha si es necesario
      if (messageDate !== lastDate) {
        items.push({
          type: 'date',
          date: messageDate,
          id: `date-${messageDate}-${index}`
        });
        lastDate = messageDate;
      }
      
      items.push(message);
    });

    // Volver a invertir para mostrar los más recientes arriba
    return items.reverse();
  }, [messages]);

  // Renderizar item (mensaje o separador de fecha)
  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    if (item.type === 'date') {
      return <DateSeparator date={item.date} />;
    }

    const message = item as Message;
    const isOwnMessage = message.senderId === currentUserId;
    
    // Determinar si mostrar avatar (solo para mensajes del otro usuario)
    let showAvatar = false;
    if (!isOwnMessage) {
      const nextIndex = index + 1;
      if (nextIndex < prepareMessagesWithSeparators().length) {
        const nextItem = prepareMessagesWithSeparators()[nextIndex];
        if (nextItem.type !== 'date') {
          const nextMessage = nextItem as Message;
          showAvatar = nextMessage.senderId !== message.senderId;
        } else {
          showAvatar = true;
        }
      } else {
        showAvatar = true;
      }
    }

    return (
      <MessageBubble
        message={message}
        isOwnMessage={isOwnMessage}
        showAvatar={showAvatar}
        otherUserName={otherUser?.name || 'Usuario'}
      />
    );
  }, [currentUserId, otherUser, prepareMessagesWithSeparators]);

  // Manejar carga de mensajes anteriores
  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadMoreMessages();
    }
  }, [hasMore, loading, loadMoreMessages]);

  const messagesWithSeparators = prepareMessagesWithSeparators();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {/* Lista de mensajes */}
        <FlatList
          ref={flatListRef}
          data={messagesWithSeparators}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          inverted
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
        />

        {/* Input de mensaje */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Escribe un mensaje..."
              multiline
              maxLength={1000}
              onFocus={() => setIsTyping(true)}
              onBlur={() => setIsTyping(false)}
              blurOnSubmit={false}
            />
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                inputText.trim().length > 0 ? styles.sendButtonActive : styles.sendButtonInactive
              ]}
              onPress={handleSendMessage}
              disabled={inputText.trim().length === 0}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim().length > 0 ? '#fff' : '#999'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  
  // Header styles
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    marginRight: 12,
  },
  headerAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerDefaultAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  typingIndicator: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  headerButton: {
    padding: 8,
  },

  // Messages list styles
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContainer: {
    paddingBottom: 20,
  },

  // Date separator styles
  dateSeparatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dateSeparatorText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    fontWeight: '500',
  },

  // Message bubble styles
  messageContainer: {
    marginVertical: 2,
    flexDirection: 'row',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },

  avatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  messageBubble: {
    maxWidth: maxBubbleWidth,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginVertical: 1,
  },
  ownBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 6,
  },
  otherBubble: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 6,
  },
  otherBubbleWithoutAvatar: {
    marginLeft: 32, // Compensar espacio del avatar
  },

  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#333',
  },

  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#666',
  },
  messageStatus: {
    marginLeft: 4,
  },

  // Input styles
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
    backgroundColor: '#f8f8f8',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#007AFF',
  },
  sendButtonInactive: {
    backgroundColor: '#f0f0f0',
  },
});

export default ChatScreen;