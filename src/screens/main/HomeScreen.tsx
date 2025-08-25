// src/screens/main/HomeScreen.tsx

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  Alert, 
  TouchableOpacity,
  RefreshControl 
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthContext } from '@/context/AuthContext';
import { useUserProducts } from '@/hooks/useProducts';
import { ProductCard } from '@/screens/product/ProductCard';
import { Button } from '@/components/ui/Button';
import { Product, ProductAvailability } from '@/types/product';
import { RootStackParamList } from '@/types';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user, signOut, loading: authLoading } = useAuthContext();
  const { 
    products: userProducts, 
    loading: productsLoading, 
    refreshUserProducts 
  } = useUserProducts(user?.uid);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshUserProducts();
    setRefreshing(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar tu sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  const handleAddProduct = () => {
    navigation.navigate('AddProduct');
  };

  const getProductStats = () => {
    const stats = {
      total: userProducts.length,
      available: userProducts.filter(p => p.availability === ProductAvailability.AVAILABLE).length,
      reserved: userProducts.filter(p => p.availability === ProductAvailability.RESERVED).length,
      donated: userProducts.filter(p => p.availability === ProductAvailability.DONATED).length,
    };
    return stats;
  };

  const stats = getProductStats();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#63ce9b']}
            tintColor="#63ce9b"
          />
        }
      >
        {/* Header del usuario */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>¡Hola! 👋</Text>
          <Text style={styles.subtitle}>
            {user?.displayName || user?.email || 'Usuario'}
          </Text>
        </View>

        {/* Tarjeta de perfil */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.displayName || 'Usuario'}
            </Text>
            <Text style={styles.userEmail}>
              {user?.email || 'No disponible'}
            </Text>
            <Text style={styles.userSince}>
              Miembro de Circulapp
            </Text>
          </View>
        </View>

        {/* Estadísticas de productos */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Mis Productos 📊</Text>
          
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, styles.totalCard]}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            
            <View style={[styles.statCard, styles.availableCard]}>
              <Text style={styles.statNumber}>{stats.available}</Text>
              <Text style={styles.statLabel}>Disponibles</Text>
            </View>
            
            <View style={[styles.statCard, styles.reservedCard]}>
              <Text style={styles.statNumber}>{stats.reserved}</Text>
              <Text style={styles.statLabel}>Reservados</Text>
            </View>
            
            <View style={[styles.statCard, styles.donatedCard]}>
              <Text style={styles.statNumber}>{stats.donated}</Text>
              <Text style={styles.statLabel}>Donados</Text>
            </View>
          </View>
        </View>

        {/* Botón para agregar producto */}
        <View style={styles.addProductSection}>
          <Button
            title="➕ Publicar nuevo producto"
            onPress={handleAddProduct}
            variant="primary"
          />
        </View>

        {/* Lista de productos del usuario */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mis Publicaciones</Text>
            {userProducts.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('MyProducts')}>
                <Text style={styles.viewAllText}>Ver todos →</Text>
              </TouchableOpacity>
            )}
          </View>

          {productsLoading && userProducts.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Cargando tus productos...</Text>
            </View>
          ) : userProducts.length === 0 ? (
            <View style={styles.emptyProductsContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>¡Publica tu primer producto!</Text>
              <Text style={styles.emptyText}>
                Comparte productos que ya no uses con tu comunidad
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleAddProduct}>
                <Text style={styles.emptyButtonText}>Comenzar ahora</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {userProducts.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={handleProductPress}
                  showUserInfo={false}
                />
              ))}
            </View>
          )}
        </View>

        {/* Logros y actividad */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Impacto 🌱</Text>
          
          <View style={styles.achievementCard}>
            <View style={styles.achievementIcon}>
              <Text style={styles.achievementEmoji}>🎯</Text>
            </View>
            <View style={styles.achievementContent}>
              <Text style={styles.achievementTitle}>
                {stats.donated === 0 
                  ? 'Primera donación' 
                  : stats.donated === 1 
                    ? '¡Primera donación completada!' 
                    : `${stats.donated} productos donados`
                }
              </Text>
              <Text style={styles.achievementDescription}>
                {stats.donated === 0 
                  ? 'Completa tu primera donación para contribuir a la economía circular'
                  : `Has ayudado a reutilizar ${stats.donated} producto${stats.donated > 1 ? 's' : ''} 🌍`
                }
              </Text>
            </View>
          </View>

          <View style={styles.achievementCard}>
            <View style={styles.achievementIcon}>
              <Text style={styles.achievementEmoji}>♻️</Text>
            </View>
            <View style={styles.achievementContent}>
              <Text style={styles.achievementTitle}>Eco-Warrior</Text>
              <Text style={styles.achievementDescription}>
                Contribuyendo a reducir residuos y promover la reutilización
              </Text>
            </View>
          </View>
        </View>

        {/* Tips de la comunidad */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Tips de la Comunidad 💡</Text>
          
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>📸</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Fotos de calidad</Text>
              <Text style={styles.tipDescription}>
                Productos con buenas fotos se donan 3x más rápido
              </Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>📝</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Descripción detallada</Text>
              <Text style={styles.tipDescription}>
                Incluye el estado, dimensiones y características principales
              </Text>
            </View>
          </View>
        </View>

        {/* Botón de cerrar sesión */}
        <View style={styles.signOutSection}>
          <Button
            title="Cerrar Sesión"
            onPress={handleSignOut}
            loading={authLoading}
            variant="secondary"
          />
          
          <Text style={styles.versionText}>
            v1.0.0 - Circulapp Beta
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#63ce9b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userSince: {
    fontSize: 12,
    color: '#999',
  },
  statsSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#63ce9b',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 3,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
  },
  totalCard: {
    borderLeftColor: '#007aff',
  },
  availableCard: {
    borderLeftColor: '#4CAF50',
  },
  reservedCard: {
    borderLeftColor: '#FF9800',
  },
  donatedCard: {
    borderLeftColor: '#9C27B0',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  addProductSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  productsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyProductsContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#63ce9b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  achievementCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  tipsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  tipCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#63ce9b',
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  tipDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 16,
  },
  signOutSection: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    marginTop: 20,
    textAlign: 'center',
  },
});