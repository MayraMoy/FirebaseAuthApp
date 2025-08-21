// src/screens/products/AddProductScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useProductManagement } from '@/hooks/useProducts';
import {
  CreateProductData,
  ProductCategory,
  ProductCondition,
  ProductAvailability,
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
} from '@/types/product';
import { RootStackParamList } from '@/types';

type AddProductScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AddProduct'
>;

interface Props {
  navigation: AddProductScreenNavigationProp;
}

interface FormData {
  title: string;
  description: string;
  category: ProductCategory;
  condition: ProductCondition;
  address: string;
  tags: string;
}

export const AddProductScreen: React.FC<Props> = ({ navigation }) => {
  const { createProduct, uploadImages, loading, error, clearError } = useProductManagement();
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: ProductCategory.OTHER,
    condition: ProductCondition.GOOD,
    address: '',
    tags: '',
  });
  
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    
    return cameraStatus === 'granted' && libraryStatus === 'granted' && locationStatus === 'granted';
  };

  const getCurrentLocation = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu ubicación para continuar');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Obtener dirección aproximada
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const fullAddress = [
          address.street,
          address.city,
          address.region,
          address.country
        ].filter(Boolean).join(', ');
        
        handleInputChange('address', fullAddress);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'No se pudo obtener la ubicación actual');
    }
  };

  const pickImages = () => {
    Alert.alert(
      'Seleccionar imágenes',
      'Elige una opción:',
      [
        { text: 'Cámara', onPress: () => openImagePicker('camera') },
        { text: 'Galería', onPress: () => openImagePicker('library') },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const openImagePicker = async (type: 'camera' | 'library') => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: type === 'library',
      quality: 0.8,
      aspect: [1, 1],
    };

    let result;
    if (type === 'camera') {
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled) {
      const newImages = result.assets.map(asset => asset.uri);
      setSelectedImages(prev => [...prev, ...newImages].slice(0, 5)); // Máximo 5 imágenes
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    } else if (formData.title.length < 3) {
      newErrors.title = 'El título debe tener al menos 3 caracteres';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    } else if (formData.description.length < 10) {
      newErrors.description = 'La descripción debe tener al menos 10 caracteres';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida';
    }

    if (selectedImages.length === 0) {
      Alert.alert('Imágenes requeridas', 'Agrega al menos una imagen del producto');
      return false;
    }

    if (!currentLocation) {
      Alert.alert('Ubicación requerida', 'Obtén tu ubicación actual para continuar');
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    clearError();

    try {
      // Subir imágenes primero
      const uploadedImageUrls = await uploadImages(selectedImages);
      
      if (uploadedImageUrls.length === 0) {
        Alert.alert('Error', 'No se pudieron subir las imágenes');
        return;
      }

      // Crear datos del producto
      const productData: CreateProductData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        condition: formData.condition,
        availability: ProductAvailability.AVAILABLE,
        images: uploadedImageUrls,
        location: {
          address: formData.address.trim(),
          latitude: currentLocation!.latitude,
          longitude: currentLocation!.longitude,
        },
        tags: formData.tags.trim() ? formData.tags.split(',').map(tag => tag.trim()) : undefined,
      };

      const productId = await createProduct(productData);
      
      if (productId) {
        Alert.alert(
          'Éxito',
          'Producto publicado correctamente',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (err) {
      console.error('Error creating product:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Publicar Producto 📦</Text>
            <Text style={styles.subtitle}>
              Comparte un producto con tu comunidad
            </Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Imágenes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Imágenes del producto *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.imagesContainer}>
                {selectedImages.map((uri, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image source={{ uri }} style={styles.selectedImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Text style={styles.removeImageText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {selectedImages.length < 5 && (
                  <TouchableOpacity style={styles.addImageButton} onPress={pickImages}>
                    <Text style={styles.addImageText}>📷</Text>
                    <Text style={styles.addImageLabel}>Agregar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
            <Text style={styles.imageHint}>
              Máximo 5 imágenes. La primera será la imagen principal.
            </Text>
          </View>

          {/* Información básica */}
          <View style={styles.section}>
            <Input
              label="Título del producto *"
              value={formData.title}
              onChangeText={(text) => handleInputChange('title', text)}
              placeholder="Ej: Mesa de madera vintage"
              error={errors.title}
            />

            <Input
              label="Descripción *"
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              placeholder="Describe el estado, características y uso del producto..."
              multiline
              numberOfLines={4}
              style={styles.textArea}
              error={errors.description}
            />
          </View>

          {/* Categoría */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryContainer}>
                {PRODUCT_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.key}
                    style={[
                      styles.categoryButton,
                      formData.category === category.key && styles.categoryButtonActive,
                    ]}
                    onPress={() => handleInputChange('category', category.key)}
                  >
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <Text
                      style={[
                        styles.categoryLabel,
                        formData.category === category.key && styles.categoryLabelActive,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Estado */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estado del producto</Text>
            <View style={styles.conditionContainer}>
              {PRODUCT_CONDITIONS.map((condition) => (
                <TouchableOpacity
                  key={condition.key}
                  style={[
                    styles.conditionButton,
                    { borderColor: condition.color },
                    formData.condition === condition.key && {
                      backgroundColor: condition.color,
                    },
                  ]}
                  onPress={() => handleInputChange('condition', condition.key)}
                >
                  <Text
                    style={[
                      styles.conditionLabel,
                      formData.condition === condition.key && styles.conditionLabelActive,
                    ]}
                  >
                    {condition.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Ubicación */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ubicación *</Text>
            <Input
              label="Dirección"
              value={formData.address}
              onChangeText={(text) => handleInputChange('address', text)}
              placeholder="Ingresa tu dirección"
              error={errors.address}
            />
            <Button
              title="📍 Obtener ubicación actual"
              onPress={getCurrentLocation}
              variant="secondary"
            />
          </View>

          {/* Tags opcionales */}
          <View style={styles.section}>
            <Input
              label="Etiquetas (opcional)"
              value={formData.tags}
              onChangeText={(text) => handleInputChange('tags', text)}
              placeholder="vintage, madera, decoración (separadas por comas)"
            />
          </View>

          {/* Botón de envío */}
          <View style={styles.submitSection}>
            <Button
              title="Publicar Producto"
              onPress={handleSubmit}
              loading={loading}
            />
            <Text style={styles.disclaimer}>
              Al publicar, aceptas compartir este producto gratuitamente con la comunidad.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  imagesContainer: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#63ce9b',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
  },
  addImageText: {
    fontSize: 24,
    marginBottom: 4,
  },
  addImageLabel: {
    fontSize: 12,
    color: '#63ce9b',
    fontWeight: '500',
  },
  imageHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  categoryButton: {
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E1E1E1',
    minWidth: 80,
  },
  categoryButtonActive: {
    borderColor: '#63ce9b',
    backgroundColor: '#F0F8FF',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  categoryLabelActive: {
    color: '#63ce9b',
    fontWeight: '600',
  },
  conditionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conditionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  conditionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  conditionLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
  submitSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  disclaimer: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
    lineHeight: 16,
  },
});