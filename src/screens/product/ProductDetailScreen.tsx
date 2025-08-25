// src/screens/products/ProductDetailScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ProductService } from '@/services/firebase/products';
import { useAuthContext } from '@/context/AuthContext';
import { useProductManagement } from '@/hooks/useProducts';
import { Button } from '@/components/ui/Button';
import { Platform } from 'react-native';

// Importar componentes de contacto
import ContactSellerButton, { ContactSellerButtonCompact } from '@/components/messaging/ContactSellerButton';

import { 
  Product, 
  ProductAvailability, 
  PRODUCT_CONDITIONS, 
  PRODUCT_CATEGORIES 
} from '@/types/product';
import { RootStackParamList } from '@/types';

const { width } = Dimensions.get('window');

type ProductDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ProductDetail'
>;

type ProductDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  'ProductDetail'
>;

interface Props {
  navigation: ProductDetailScreenNavigationProp;
  route: ProductDetailScreenRouteProp;
}

export const ProductDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId } = route.params;
  const { user } = useAuthContext();
  const { updateProductAvailability, deleteProduct, loading: actionLoading } = useProductManagement();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError('');
      const productData = await ProductService.getProductById(productId);
      
      if (productData) {
        setProduct(productData);
      } else {
        setError('Producto no encontrado');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDistance = (location: { latitude: number; longitude: number }) => {
    // Placeholder para cálculo de distancia
    return 'A 2.5 km de ti';
  };

  const handleMarkAsDonated = async () => {
    if (!product || !user || product.userId !== user.uid) return;

    Alert.alert(
      'Marcar como donado',
      '¿Este producto ya fue entregado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, marcar como donado',
          style: 'default',
          onPress: async () => {
            const success = await updateProductAvailability(
              product.id,
              ProductAvailability.DONATED
            );
            if (success) {
              setProduct(prev => prev ? {
                ...prev,
                availability: ProductAvailability.DONATED
              } : null);
              Alert.alert('¡Felicitaciones!', 'Gracias por contribuir a la economía circular 🌱');
            }
          }
        }
      ]
    );
  };

  const handleReserveProduct = async () => {
    if (!product || !user) return;

    Alert.alert(
      'Reservar producto',
      '¿Estás seguro de que quieres reservar este producto? El usuario será notificado.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reservar',
          style: 'default',
          onPress: async () => {
            const success = await updateProductAvailability(
              product.id, 
              ProductAvailability.RESERVED
            );
            if (success) {
              setProduct(prev => prev ? {
                ...prev,
                availability: ProductAvailability.RESERVED
              } : null);
              Alert.alert('Éxito', 'Producto reservado. ¡Contacta al usuario para coordinar!');
            }
          }
        }
      ]
    );
  };

  const handleDeleteProduct = async () => {
    if (!product || !user || product.userId !== user.uid) return;

    Alert.alert(
      'Eliminar producto',
      '¿Estás seguro de que quieres eliminar esta publicación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteProduct(product.id);
            if (success) {
              Alert.alert(
                'Producto eliminado',
                'La publicación ha sido eliminada correctamente',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            }
          }
        }
      ]
    );
  };

  const handleOpenMap = () => {
    if (!product) return;

    const { latitude, longitude } = product.location;
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  const renderImageCarousel = () => {
    if (!product?.images || product.images.length === 0) {
      const categoryInfo = PRODUCT_CATEGORIES.find(cat => cat.key === product?.category);
      return (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderIcon}>
            {categoryInfo?.icon || '📦'}
          </Text>
          <Text style={styles.placeholderText}>Sin imagen</Text>
        </View>
      );
    }

    return (
      <View style={styles.imageContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(index);
          }}
        >
          {product.images.map((imageUri, index) => (
            <Image
              key={index}
              source={{ uri: imageUri }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
        
        {product.images.length > 1 && (
          <View style={styles.imageIndicators}>
            {product.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentImageIndex && styles.activeIndicator,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#63ce9b" />
        <Text style={styles.loadingText}>Cargando producto...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>
          {error || 'No se pudo cargar el producto'}
        </Text>
        <Button
          title="Reintentar"
          onPress={loadProduct}
          variant="secondary"
        />
      </View>
    );
  }

  const categoryInfo = PRODUCT_CATEGORIES.find(cat => cat.key === product.category);
  const conditionInfo = PRODUCT_CONDITIONS.find(cond => cond.key === product.condition);
  const isOwner = user?.uid === product.userId;
  const canInteract = product.availability === ProductAvailability.AVAILABLE && !isOwner;
  const canReserve = canInteract;
  const canContact = !isOwner;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Carrusel de imágenes */}
        {renderImageCarousel()}

        {/* Información del producto */}
        <View style={styles.productInfo}>
          {/* Header con título y botón compacto */}
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.productTitle}>{product.title}</Text>
              <View style={styles.categoryRow}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryIcon}>{categoryInfo?.icon}</Text>
                  <Text style={styles.categoryLabel}>{categoryInfo?.label}</Text>
                </View>
                <View style={[
                  styles.conditionBadge,
                  { backgroundColor: conditionInfo?.color || '#666' }
                ]}>
                  <Text style={styles.conditionText}>{conditionInfo?.label}</Text>
                </View>
              </View>
            </View>
            
            {/* Botón compacto de contactar en el header (solo si no es owner) */}
            {canContact && (
              <ContactSellerButtonCompact
                product={product}
                sellerId={product.userId}
                sellerName={product.userInfo?.displayName}
              />
            )}
          </View>

          {/* Estado de disponibilidad */}
          <View style={[
            styles.availabilityContainer,
            product.availability === ProductAvailability.AVAILABLE && styles.availableContainer,
            product.availability === ProductAvailability.RESERVED && styles.reservedContainer,
            product.availability === ProductAvailability.DONATED && styles.donatedContainer,
          ]}>
            <Text style={styles.availabilityText}>
              {product.availability === ProductAvailability.AVAILABLE && '✅ Disponible'}
              {product.availability === ProductAvailability.RESERVED && '⏳ Reservado'}
              {product.availability === ProductAvailability.DONATED && '🎉 Ya fue donado'}
              {product.availability === ProductAvailability.UNAVAILABLE && '❌ No disponible'}
            </Text>
          </View>

          {/* Descripción */}
          <Text style={styles.productDescription}>{product.description}</Text>

          {/* Detalles adicionales */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Estado:</Text>
              <Text style={styles.detailValue}>{conditionInfo?.label}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Disponibilidad:</Text>
              <Text style={[
                styles.detailValue,
                { color: product.availability === ProductAvailability.AVAILABLE ? '#34C759' : '#FF9500' }
              ]}>
                {product.availability}
              </Text>
            </View>
          </View>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Etiquetas</Text>
              <View style={styles.tagsContainer}>
                {product.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Ubicación */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ubicación</Text>
            <TouchableOpacity style={styles.locationContainer} onPress={handleOpenMap}>
              <View style={styles.locationInfo}>
                <Text style={styles.locationIcon}>📍</Text>
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationAddress}>
                    {product.location?.address || 'No especificada'}
                  </Text>
                  <Text style={styles.locationDistance}>
                    {formatDistance(product.location)}
                  </Text>
                </View>
              </View>
              <Text style={styles.viewMapText}>Ver en mapa →</Text>
            </TouchableOpacity>
          </View>

          {/* Información del vendedor */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vendedor</Text>
            <View style={styles.sellerContainer}>
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerAvatarText}>
                  {product.userInfo?.displayName?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName}>
                  {product.userInfo?.displayName || 'Usuario'}
                </Text>
                <Text style={styles.sellerDate}>
                  Publicado el {formatDate(product.createdAt)}
                </Text>
                <Text style={styles.sellerEmail}>
                  {product.userInfo?.email || ''}
                </Text>
                {product.userInfo?.rating && (
                  <Text style={styles.sellerRating}>
                    ⭐ {product.userInfo.rating.toFixed(1)} / 5.0
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Botones de acción fijos en la parte inferior */}
      <View style={styles.bottomContainer}>
        {isOwner ? (
          // Acciones para el propietario
          <View style={styles.ownerActions}>
            {product.availability === ProductAvailability.AVAILABLE && (
              <Button
                title="✅ Marcar como donado"
                onPress={handleMarkAsDonated}
                loading={actionLoading}
                variant="primary"
              />
            )}
            <View style={styles.ownerButtonsRow}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('EditProduct', { productId: product.id })}
              >
                <Text style={styles.editButtonText}>✏️ Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteProduct}
                disabled={actionLoading}
              >
                <Text style={styles.deleteButtonText}>🗑️ Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Acciones para otros usuarios
          <View style={styles.userActions}>
            {/* Botón principal de contactar vendedor */}
            {canContact && (
              <ContactSellerButton
                product={product}
                sellerId={product.userId}
                sellerName={product.userInfo?.displayName}
              />
            )}
            
            {/* Botón de reservar */}
            {canReserve && (
              <Button
                title="📌 Reservar producto"
                onPress={handleReserveProduct}
                loading={actionLoading}
                variant="secondary"
              />
            )}

            {/* Mensajes informativos */}
            {!canInteract && product.availability === ProductAvailability.RESERVED && canContact && (
              <View style={styles.infoMessage}>
                <Text style={styles.infoText}>
                  Este producto está reservado, pero puedes contactar al usuario por si queda libre.
                </Text>
              </View>
            )}

            {product.availability === ProductAvailability.DONATED && (
              <View style={styles.infoMessage}>
                <Text style={styles.infoText}>
                  🎉 Este producto ya fue donado. ¡Gracias al usuario por contribuir!
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 140, // Espacio para los botones fijos
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width,
    height: width * 0.75,
  },
  placeholderImage: {
    width,
    height: width * 0.75,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#fff',
  },
  productInfo: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#63ce9b',
    fontWeight: '500',
  },
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  conditionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  availabilityContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  availableContainer: {
    backgroundColor: '#E8F5E8',
  },
  reservedContainer: {
    backgroundColor: '#FFF3E0',
  },
  donatedContainer: {
    backgroundColor: '#F3E5F5',
  },
  availabilityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  productDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 24,
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#63ce9b',
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  locationDistance: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  viewMapText: {
    fontSize: 14,
    color: '#63ce9b',
    fontWeight: '500',
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sellerAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  sellerDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  sellerEmail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  sellerRating: {
    fontSize: 12,
    color: '#FF9800',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ownerActions: {
    gap: 12,
  },
  ownerButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#F0F8FF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#63ce9b',
  },
  editButtonText: {
    color: '#63ce9b',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FFEBEE',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  userActions: {
    gap: 12,
  },
  contactButton: {
    // Estilos adicionales si es necesario para ContactSellerButton
  },
  infoMessage: {
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#63ce9b',
  },
  infoText: {
    fontSize: 14,
    color: '#63ce9b',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ProductDetailScreen;

