// src/screens/products/ProductsListScreen.tsx

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProductCard } from '@/screens/product/ProductCard';
import { useProducts, useProductSearch } from '@/hooks/useProducts';
import { Product, ProductCategory, PRODUCT_CATEGORIES } from '@/types/product';
import { RootStackParamList } from '@/types';

type ProductsListScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ProductsList'
>;

interface Props {
  navigation: ProductsListScreenNavigationProp;
}

export const ProductsListScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const { 
    products, 
    loading, 
    error, 
    hasMore, 
    loadMoreProducts, 
    refreshProducts 
  } = useProducts({ category: selectedCategory });

  const {
    searchResults,
    loading: searchLoading,
    searchProducts,
    clearSearch
  } = useProductSearch();

  const handleSearch = useCallback((text: string) => {
    setSearchTerm(text);
    if (text.trim()) {
      searchProducts(text.trim());
    } else {
      clearSearch();
    }
  }, [searchProducts, clearSearch]);

  const handleCategoryFilter = (category: ProductCategory) => {
    if (selectedCategory === category) {
      setSelectedCategory(undefined);
    } else {
      setSelectedCategory(category);
    }
    setShowSearch(false);
    setSearchTerm('');
    clearSearch();
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchTerm('');
      clearSearch();
    }
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  const handleAddProduct = () => {
    navigation.navigate('AddProduct');
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      onPress={handleProductPress}
      showUserInfo={true}
    />
  );

  const renderCategoryFilter = ({ item }: { item: typeof PRODUCT_CATEGORIES[0] }) => (
    <TouchableOpacity
      style={[
        styles.categoryFilter,
        selectedCategory === item.key && styles.categoryFilterActive,
      ]}
      onPress={() => handleCategoryFilter(item.key)}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item.key && styles.categoryTextActive,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderLoadingFooter = () => {
    if (!loading || products.length === 0) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator color="#63ce9b" />
        <Text style={styles.loadingText}>Cargando más productos...</Text>
      </View>
    );
  };

  const renderEmptyState = () => {
    const isSearching = searchTerm.trim().length > 0;
    const displayProducts = isSearching ? searchResults : products;
    
    if (loading && displayProducts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#63ce9b" />
          <Text style={styles.emptyText}>Cargando productos...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyTitle}>Error al cargar</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshProducts}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (displayProducts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>
            {isSearching ? '🔍' : selectedCategory ? '📂' : '📦'}
          </Text>
          <Text style={styles.emptyTitle}>
            {isSearching 
              ? 'Sin resultados' 
              : selectedCategory 
                ? 'Sin productos en esta categoría'
                : 'No hay productos disponibles'
            }
          </Text>
          <Text style={styles.emptyText}>
            {isSearching
              ? `No encontramos productos que coincidan con "${searchTerm}"`
              : selectedCategory
                ? 'Intenta con otra categoría o sé el primero en publicar aquí'
                : 'Sé el primero en compartir un producto con la comunidad'
            }
          </Text>
          {!isSearching && (
            <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
              <Text style={styles.addButtonText}>➕ Publicar producto</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return null;
  };

  const displayProducts = searchTerm.trim() ? searchResults : products;
  const isLoading = searchTerm.trim() ? searchLoading : loading;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Productos Disponibles</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.searchButton} onPress={toggleSearch}>
              <Text style={styles.searchButtonText}>🔍</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addHeaderButton} onPress={handleAddProduct}>
              <Text style={styles.addHeaderButtonText}>➕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search bar */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar productos..."
              value={searchTerm}
              onChangeText={handleSearch}
              autoFocus
            />
            {searchTerm.trim().length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => handleSearch('')}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Categories filter */}
        {!showSearch && (
          <View style={styles.categoriesSection}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={PRODUCT_CATEGORIES}
              renderItem={renderCategoryFilter}
              keyExtractor={(item) => item.key}
              contentContainerStyle={styles.categoriesContainer}
            />
          </View>
        )}

        {/* Results info */}
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            {isLoading
              ? 'Buscando...'
              : searchTerm.trim()
                ? `${searchResults.length} resultados para "${searchTerm}"`
                : selectedCategory
                  ? `${products.length} productos en ${PRODUCT_CATEGORIES.find(c => c.key === selectedCategory)?.label}`
                  : `${products.length} productos disponibles`
            }
          </Text>
          {selectedCategory && (
            <TouchableOpacity onPress={() => setSelectedCategory(undefined)}>
              <Text style={styles.clearFilter}>Limpiar filtro</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Products list */}
      <FlatList
        data={displayProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
        onEndReached={() => {
          if (!searchTerm.trim() && hasMore && !loading) {
            loadMoreProducts();
          }
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={loading && displayProducts.length === 0}
            onRefresh={refreshProducts}
            colors={['#63ce9b']}
            tintColor="#63ce9b"
          />
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderLoadingFooter}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating add button */}
      <TouchableOpacity style={styles.floatingButton} onPress={handleAddProduct}>
        <Text style={styles.floatingButtonText}>➕</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  searchButtonText: {
    fontSize: 18,
  },
  addHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#63ce9b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addHeaderButtonText: {
    fontSize: 18,
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  clearButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#666',
  },
  categoriesSection: {
    marginBottom: 16,
  },
  categoriesContainer: {
    paddingRight: 20,
  },
  categoryFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryFilterActive: {
    backgroundColor: '#63ce9b',
    borderColor: '#63ce9b',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
  },
  resultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  clearFilter: {
    fontSize: 14,
    color: '#63ce9b',
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100, // Espacio para el botón flotante
  },
  row: {
    justifyContent: 'space-between',
  },
  loadingFooter: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#63ce9b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#63ce9b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonText: {
    fontSize: 24,
    color: '#fff',
  },
});