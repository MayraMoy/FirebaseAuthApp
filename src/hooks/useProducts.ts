// src/hooks/useProducts.ts

import { useState, useEffect } from 'react';
import { ProductService, ProductFilters, PaginationOptions } from '@/services/firebase/products';
import { Product, CreateProductData, ProductAvailability } from '@/types/product';
import { useAuthContext } from '@/context/AuthContext';
import { DocumentSnapshot } from 'firebase/firestore';

export const useProducts = (filters?: ProductFilters, autoLoad: boolean = true) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [lastDocument, setLastDocument] = useState<DocumentSnapshot | undefined>();
  const [hasMore, setHasMore] = useState<boolean>(true);

  const loadProducts = async (reset: boolean = false, pagination?: PaginationOptions) => {
    setLoading(true);
    setError('');
    
    try {
      const paginationOptions = {
        limitCount: 20,
        ...pagination,
        lastDocument: reset ? undefined : lastDocument
      };

      const result = await ProductService.getProducts(filters, paginationOptions);
      
      if (reset) {
        setProducts(result.products);
      } else {
        setProducts(prev => [...prev, ...result.products]);
      }
      
      setLastDocument(result.lastDocument);
      setHasMore(result.products.length === (paginationOptions.limitCount || 20));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const refreshProducts = () => {
    loadProducts(true);
  };

  const loadMoreProducts = () => {
    if (!loading && hasMore) {
      loadProducts(false);
    }
  };

  useEffect(() => {
    if (autoLoad) {
      loadProducts(true);
    }
  }, [filters, autoLoad]);

  return {
    products,
    loading,
    error,
    hasMore,
    loadProducts: refreshProducts,
    loadMoreProducts,
    refreshProducts
  };
};

export const useUserProducts = (userId?: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const loadUserProducts = async (targetUserId?: string) => {
    if (!targetUserId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const userProducts = await ProductService.getUserProducts(targetUserId);
      setProducts(userProducts);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadUserProducts(userId);
    }
  }, [userId]);

  return {
    products,
    loading,
    error,
    refreshUserProducts: () => loadUserProducts(userId)
  };
};

export const useProductManagement = () => {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const createProduct = async (productData: CreateProductData): Promise<string | null> => {
    if (!user) {
      setError('Usuario no autenticado');
      return null;
    }

    setLoading(true);
    setError('');

    try {
      const productId = await ProductService.createProduct(productData, user);
      return productId;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (productId: string, updates: Partial<CreateProductData>): Promise<boolean> => {
    setLoading(true);
    setError('');

    try {
      await ProductService.updateProduct(productId, updates);
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateProductAvailability = async (
    productId: string, 
    availability: ProductAvailability
  ): Promise<boolean> => {
    setLoading(true);
    setError('');

    try {
      await ProductService.updateProductAvailability(productId, availability);
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    setLoading(true);
    setError('');

    try {
      await ProductService.deleteProduct(productId);
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const uploadImages = async (images: string[], productId?: string): Promise<string[]> => {
    setLoading(true);
    setError('');

    try {
      const uploadedUrls = await ProductService.uploadProductImages(images, productId);
      return uploadedUrls;
    } catch (err) {
      setError((err as Error).message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError('');
  };

  return {
    loading,
    error,
    createProduct,
    updateProduct,
    updateProductAvailability,
    deleteProduct,
    uploadImages,
    clearError
  };
};

export const useProductSearch = () => {
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const searchProducts = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const results = await ProductService.searchProducts(searchTerm);
      setSearchResults(results);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchResults([]);
    setError('');
  };

  return {
    searchResults,
    loading,
    error,
    searchProducts,
    clearSearch
  };
};