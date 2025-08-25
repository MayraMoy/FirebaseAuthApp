// src/components/messaging/UnreadBadge.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface UnreadBadgeProps {
  count: number;
  size?: 'small' | 'medium' | 'large';
  style?: any;
  maxCount?: number;
}

const UnreadBadge: React.FC<UnreadBadgeProps> = ({
  count,
  size = 'medium',
  style,
  maxCount = 99,
}) => {
  if (count <= 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  const sizeStyles = {
    small: {
      badge: styles.smallBadge,
      text: styles.smallText,
    },
    medium: {
      badge: styles.mediumBadge,
      text: styles.mediumText,
    },
    large: {
      badge: styles.largeBadge,
      text: styles.largeText,
    },
  };

  return (
    <View style={[styles.badge, sizeStyles[size].badge, style]}>
      <Text style={[styles.text, sizeStyles[size].text]}>
        {displayCount}
      </Text>
    </View>
  );
};

// Badge específico para tabs
export const TabUnreadBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count <= 0) return null;

  return (
    <View style={styles.tabBadge}>
      <Text style={styles.tabText}>
        {count > 99 ? '99+' : count.toString()}
      </Text>
    </View>
  );
};

// Badge para avatars
export const AvatarUnreadBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count <= 0) return null;

  return (
    <View style={styles.avatarBadge}>
      <Text style={styles.avatarText}>
        {count > 99 ? '99+' : count.toString()}
      </Text>
    </View>
  );
};

// Badge simple para indicar solo que hay mensajes no leídos
export const UnreadDot: React.FC<{ hasUnread: boolean; style?: any }> = ({ 
  hasUnread, 
  style 
}) => {
  if (!hasUnread) return null;

  return <View style={[styles.dot, style]} />;
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Small size
  smallBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  smallText: {
    fontSize: 10,
  },

  // Medium size (default)
  mediumBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
  },
  mediumText: {
    fontSize: 12,
  },

  // Large size
  largeBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  largeText: {
    fontSize: 14,
  },

  // Tab badge (positioned absolute)
  tabBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  tabText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Avatar badge
  avatarBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Simple dot indicator
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
});

export default UnreadBadge;