// src/screens/messaging/ConversationsScreen.tsx

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useMessaging, useConversationSearch } from '../../hooks/useMessaging';
import { Conversation } from '../../types/messaging';
import { formatTimestamp, getTimeAgo } from '../../utils/dateUtils';

interface ConversationItemProps {
  conversation: Conversation;
  currentUserId: string;
  onPress: () => void;
  onLongPress: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  currentUserId,
  onPress,
  onLongPress
}) => {
  // Obtener info del otro usuario
  const otherUserId = conversation.participants.find(id => id !== currentUserId);
  const otherUser = otherUserId ? conversation.participantsInfo[otherUserId] : null;
  const unreadCount = conversation.unreadCount[currentUserId] || 0;
  const isUnread = unreadCount > 0;

  return (
    <TouchableOpacity 
      style={[styles.conversationItem, isUnread && styles.unreadItem]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {otherUser?.avatar ? (
          <Image source={{ uri: otherUser.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.defaultAvatar}>
            <Text style={styles.avatarText}>
              {otherUser?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        {isUnread && <View style={styles.unreadIndicator} />}
      </View>

      {/* Contenido */}
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.userName, isUnread && styles.unreadText]} numberOfLines={1}>
            {otherUser?.name || 'Usuario Desconocido'}
          </Text>
          <Text style={styles.timestamp}>
            {getTimeAgo(conversation.lastMessage.timestamp)}
          </Text>
        </View>

        {/* Último mensaje */}
        <View style={styles.messageRow}>
          <Text 
            style={[styles.lastMessage, isUnread && styles.unreadMessage]} 
            numberOfLines={2}
          >
            {conversation.lastMessage.senderId === currentUserId && "Tú: "}
            {conversation.lastMessage.text}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>

        {/* Info del producto si existe */}
        {conversation.productInfo && (
          <View style={styles.productInfo}>
            <Ionicons name="cube-outline" size={14} color="#666" />
            <Text style={styles.productTitle} numberOfLines={1}>
              {conversation.productInfo.title}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const ConversationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  const { 
    user, 
    conversations, 
    loading, 
    error, 
    totalUnread, 
    deleteConversation 
  } = useMessaging();

  const {
    searchTerm,
    filteredConversations,
    setSearchTerm,
    searchConversations
  } = useConversationSearch();

  // Filtrar conversaciones basado en búsqueda
  const displayConversations = useMemo(() => {
    if (!searchTerm) return conversations;
    
    searchConversations(conversations, searchTerm, {});
    return filteredConversations;
  }, [conversations, searchTerm, searchConversations, filteredConversations]);

  // Manejar refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    // El hook ya maneja la actualización automática
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Navegar a conversación
  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate('Chat', { 
      conversationId: conversation.id,
      otherUser: conversation.participantsInfo[
        conversation.participants.find(id => id !== user?.uid) || ''
      ]
    });
  };

  // Opciones de conversación (eliminar, etc.)
  const handleConversationLongPress = (conversation: Conversation) => {
    const otherUserId = conversation.participants.find(id => id !== user?.uid);
    const otherUser = otherUserId ? conversation.participantsInfo[otherUserId] : null;

    Alert.alert(
      'Opciones de conversación',
      `Conversación con ${otherUser?.name || 'Usuario'}`,
      [
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => handleDeleteConversation(conversation.id)
        },
        {
          text: 'Cancelar',
          style: 'cancel'
        }
      ]
    );
  };

  // Eliminar conversación
  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId);
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar la conversación');
    }
  };

  // Renderizar item de conversación
  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <ConversationItem
      conversation={item}
      currentUserId={user?.uid || ''}
      onPress={() => handleConversationPress(item)}
      onLongPress={() => handleConversationLongPress(item)}
    />
  );

  // Renderizar contenido vacío
  const renderEmptyContent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No tienes conversaciones</Text>
      <Text style={styles.emptySubtitle}>
        {searchTerm 
          ? 'No se encontraron conversaciones con ese término' 
          : 'Contacta a otros usuarios desde los productos para comenzar a chatear'
        }
      </Text>
    </View>
  );

  // Renderizar header con búsqueda
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Text style={styles.screenTitle}>Mensajes</Text>
        <View style={styles.headerActions}>
          {totalUnread > 0 && (
            <View style={styles.totalUnreadBadge}>
              <Text style={styles.totalUnreadText}>
                {totalUnread > 99 ? '99+' : totalUnread}
              </Text>
            </View>
          )}
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Ionicons 
              name={showSearch ? "close" : "search"} 
              size={24} 
              color="#007AFF" 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {showSearch && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar conversaciones..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  if (loading && conversations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando conversaciones...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <FlatList
        data={displayConversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={
          displayConversations.length === 0 ? styles.emptyList : undefined
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyContent}
      />

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalUnreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  totalUnreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  list: {
    flex: 1,
  },
  emptyList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  unreadItem: {
    backgroundColor: '#f8f9ff',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  unreadIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginRight: 10,
  },
  unreadMessage: {
    color: '#333',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  productTitle: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    flex: 1,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  errorContainer: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ConversationsScreen;

