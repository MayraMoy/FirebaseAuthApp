// src/services/firebase/products.ts

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  serverTimestamp,
  GeoPoint
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './config';
import { Product, CreateProductData, ProductAvailability, ProductCategory } from '@/types/product';
import { User } from '@/types';

export interface ProductFilters {
  category?: ProductCategory;
  availability?: ProductAvailability;
  location?: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
  searchTerm?: string;
}

export interface PaginationOptions {
  limitCount?: number;
  lastDocument?: DocumentSnapshot;
}

export class ProductService {
  private static readonly COLLECTION_NAME = 'products';
  private static readonly STORAGE_PATH = 'product-images';

  // Crear un nuevo producto
  static async createProduct(productData: CreateProductData, user: User): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...productData,
        userId: user.uid,
        userInfo: {
          displayName: user.displayName || 'Usuario',
          email: user.email || '',
        },
        location: new GeoPoint(productData.location.latitude, productData.location.longitude),
        locationAddress: productData.location.address,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating product:', error);
      throw new Error('Error al crear el producto');
    }
  }

  // Obtener productos con filtros y paginación
  static async getProducts(
    filters?: ProductFilters,
    pagination?: PaginationOptions
  ): Promise<{ products: Product[]; lastDocument?: DocumentSnapshot }> {
    try {
      let q = query(
        collection(db, this.COLLECTION_NAME),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      // Aplicar filtros
      if (filters?.category) {
        q = query(q, where('category', '==', filters.category));
      }

      if (filters?.availability) {
        q = query(q, where('availability', '==', filters.availability));
      }

      // Paginación
      if (pagination?.limitCount) {
        q = query(q, limit(pagination.limitCount));
      }

      if (pagination?.lastDocument) {
        q = query(q, startAfter(pagination.lastDocument));
      }

      const querySnapshot = await getDocs(q);
      const products: Product[] = [];
      let lastDoc: DocumentSnapshot | undefined;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const geoPoint = data.location as GeoPoint;
        
        products.push({
          id: doc.id,
          ...data,
          location: {
            address: data.locationAddress || '',
            latitude: geoPoint?.latitude || 0,
            longitude: geoPoint?.longitude || 0,
          },
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Product);
        
        lastDoc = doc;
      });

      return { products, lastDocument: lastDoc };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error('Error al obtener productos');
    }
  }

  // Obtener productos de un usuario específico
  static async getUserProducts(userId: string): Promise<Product[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const products: Product[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const geoPoint = data.location as GeoPoint;
        
        products.push({
          id: doc.id,
          ...data,
          location: {
            address: data.locationAddress || '',
            latitude: geoPoint?.latitude || 0,
            longitude: geoPoint?.longitude || 0,
          },
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Product);
      });

      return products;
    } catch (error) {
      console.error('Error fetching user products:', error);
      throw new Error('Error al obtener productos del usuario');
    }
  }

  // Obtener un producto por ID
  static async getProductById(productId: string): Promise<Product | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, productId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      const geoPoint = data.location as GeoPoint;

      return {
        id: docSnap.id,
        ...data,
        location: {
          address: data.locationAddress || '',
          latitude: geoPoint?.latitude || 0,
          longitude: geoPoint?.longitude || 0,
        },
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Product;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw new Error('Error al obtener el producto');
    }
  }

  // Actualizar un producto
  static async updateProduct(productId: string, updates: Partial<CreateProductData>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, productId);
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // Convertir ubicación si existe
      if (updates.location) {
        updateData.location = new GeoPoint(updates.location.latitude, updates.location.longitude);
        updateData.locationAddress = updates.location.address;
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating product:', error);
      throw new Error('Error al actualizar el producto');
    }
  }

  // Actualizar disponibilidad del producto
  static async updateProductAvailability(
    productId: string, 
    availability: ProductAvailability
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, productId);
      await updateDoc(docRef, {
        availability,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating product availability:', error);
      throw new Error('Error al actualizar la disponibilidad');
    }
  }

  // Eliminar un producto (soft delete)
  static async deleteProduct(productId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, productId);
      await updateDoc(docRef, {
        isActive: false,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      throw new Error('Error al eliminar el producto');
    }
  }

  // Subir imágenes del producto
  static async uploadProductImages(images: string[], productId?: string): Promise<string[]> {
    try {
      const uploadPromises = images.map(async (imageUri, index) => {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        
        const timestamp = Date.now();
        const filename = productId 
          ? `${productId}_${index}_${timestamp}.jpg`
          : `temp_${timestamp}_${index}.jpg`;
        
        const storageRef = ref(storage, `${this.STORAGE_PATH}/${filename}`);
        const snapshot = await uploadBytes(storageRef, blob);
        return await getDownloadURL(snapshot.ref);
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new Error('Error al subir las imágenes');
    }
  }

  // Eliminar imágenes del producto
  static async deleteProductImages(imageUrls: string[]): Promise<void> {
    try {
      const deletePromises = imageUrls.map(async (url) => {
        const storageRef = ref(storage, url);
        await deleteObject(storageRef);
      });

      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting images:', error);
      // No lanzar error ya que es una operación secundaria
    }
  }

  // Buscar productos por texto
  static async searchProducts(searchTerm: string): Promise<Product[]> {
    try {
      // Firebase no tiene búsqueda full-text nativa, implementamos búsqueda simple
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const products: Product[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const product = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Product;

        // Filtrar por término de búsqueda
        const searchLower = searchTerm.toLowerCase();
        if (
          product.title.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower) ||
          product.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        ) {
          products.push(product);
        }
      });

      return products;
    } catch (error) {
      console.error('Error searching products:', error);
      throw new Error('Error en la búsqueda de productos');
    }
  }
}