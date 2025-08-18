// src/components/products/ProductCard.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Product, PRODUCT_CONDITIONS, PRODUCT_CATEGORIES } from '@/types/product';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  showUserInfo?: boolean;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 columnas con margin

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onPress, 
  showUserInfo = true 
}) => {
  const categoryInfo = PRODUCT_CATEGORIES.find(cat => cat.key === product.category);
  const conditionInfo = PRODUCT_CONDITIONS.find(cond => cond.key === product.condition);

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hoy';
    if (diffDays === 2) return 'Ayer';
    if (diffDays <= 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => onPress(product)}
      activeOpacity={0.8}
    >
      {/* Imagen del producto */}
      <View style={styles.imageContainer}>
        {product.images && product.images.length > 0 ? (
          <Image 
            source={{ uri: product.images[0] }} 
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>
              {categoryInfo?.icon || '📦'}
            </Text>
          </View>
        )}
        
        {/* Badge de estado */}
        <View style={[styles.statusBadge, { backgroundColor: conditionInfo?.color || '#666' }]}>
          <Text style={styles.statusText}>
            {conditionInfo?.label || 'N/A'}
          </Text>
        </View>
      </View>

      {/* Información del producto */}
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.category}>
            {categoryInfo?.icon} {categoryInfo?.label}
          </Text>
          <Text style={styles.date}>
            {formatDate(product.createdAt)}
          </Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        
        <Text style={styles.description} numberOfLines={2}>
          {product.description}
        </Text>

        <View style={styles.footer}>
          <View style={styles.locationContainer}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.location} numberOfLines={1}>
              {product.location.address}
            </Text>
          </View>
          
          {showUserInfo && (
            <View style={styles.userContainer}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {product.userInfo.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.userName} numberOfLines={1}>
                {product.userInfo.displayName}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 140,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 32,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  contentContainer: {
    padding: 12,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  date: {
    fontSize: 11,
    color: '#999',
    marginLeft: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#777',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  location: {
    fontSize: 12,
    color: '#555',
    flex: 1,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    flexShrink: 1,
  },
  userAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  userAvatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
  },
  userName: {
    fontSize: 12,
    color: '#333',
    maxWidth: 80,
  },
});
