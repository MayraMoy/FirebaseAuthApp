// src/types/product.ts

export interface Product {
  id: string;
  title: string;
  description: string;
  category: ProductCategory;
  condition: ProductCondition;
  availability: ProductAvailability;
  images: string[]; // URLs de las imágenes
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  userId: string; // ID del usuario que publica
  userInfo: {
    displayName: string;
    email: string;
    rating?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  isActive: boolean;
}

export interface CreateProductData {
  title: string;
  description: string;
  category: ProductCategory;
  condition: ProductCondition;
  availability: ProductAvailability;
  images: string[];
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  tags?: string[];
}

export enum ProductCategory {
  ELECTRONICS = 'electronics',
  FURNITURE = 'furniture',
  CLOTHING = 'clothing',
  BOOKS = 'books',
  TOOLS = 'tools',
  APPLIANCES = 'appliances',
  SPORTS = 'sports',
  TOYS = 'toys',
  OTHER = 'other'
}

export enum ProductCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor'
}

export enum ProductAvailability {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  DONATED = 'donated',
  UNAVAILABLE = 'unavailable'
}

export const PRODUCT_CATEGORIES = [
  { key: ProductCategory.ELECTRONICS, label: 'Electrónicos', icon: '📱' },
  { key: ProductCategory.FURNITURE, label: 'Mobiliario', icon: '🪑' },
  { key: ProductCategory.CLOTHING, label: 'Ropa', icon: '👕' },
  { key: ProductCategory.BOOKS, label: 'Libros', icon: '📚' },
  { key: ProductCategory.TOOLS, label: 'Herramientas', icon: '🔧' },
  { key: ProductCategory.APPLIANCES, label: 'Electrodomésticos', icon: '🏠' },
  { key: ProductCategory.SPORTS, label: 'Deportes', icon: '⚽' },
  { key: ProductCategory.TOYS, label: 'Juguetes', icon: '🧸' },
  { key: ProductCategory.OTHER, label: 'Otros', icon: '📦' }
];

export const PRODUCT_CONDITIONS = [
  { key: ProductCondition.NEW, label: 'Nuevo', color: '#4CAF50' },
  { key: ProductCondition.LIKE_NEW, label: 'Como nuevo', color: '#8BC34A' },
  { key: ProductCondition.GOOD, label: 'Bueno', color: '#FFC107' },
  { key: ProductCondition.FAIR, label: 'Regular', color: '#FF9800' },
  { key: ProductCondition.POOR, label: 'Malo', color: '#F44336' }
];

export const PRODUCT_AVAILABILITY_STATUS = [
  { key: ProductAvailability.AVAILABLE, label: 'Disponible', color: '#4CAF50' },
  { key: ProductAvailability.RESERVED, label: 'Reservado', color: '#FF9800' },
  { key: ProductAvailability.DONATED, label: 'Donado', color: '#9C27B0' },
  { key: ProductAvailability.UNAVAILABLE, label: 'No disponible', color: '#757575' }
];