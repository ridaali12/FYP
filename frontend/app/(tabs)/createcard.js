import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CreateSpeciesCardScreen = ({ navigation }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    commonName: '',
    scientificName: '',
    family: '',
    description: '',
    habitat: '',
    distribution: '',
    conservationStatus: '',
    conservationGuide: '',
    imageUri: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [imagePickerModal, setImagePickerModal] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert('Permission Required', 'Camera and media library permissions are required.');
      return false;
    }
    return true;
  };

  const handleCameraCapture = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3], // More flexible aspect ratio
        quality: 1, // Maximum quality
      });

      if (!result.canceled) {
        setFormData(prev => ({
          ...prev,
          imageUri: result.assets[0].uri,
        }));
        setImagePickerModal(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const handleGallerySelection = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3], // More flexible aspect ratio
        quality: 1, // Maximum quality - full resolution
        allowsMultipleSelection: false,
      });

      if (!result.canceled) {
        setFormData(prev => ({
          ...prev,
          imageUri: result.assets[0].uri,
        }));
        setImagePickerModal(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleImagePick = () => {
    setImagePickerModal(true);
  };

  const handleBackPress = () => {
    router.push('/(tabs)/ResearcherHub');
  };

  const handleSubmit = async () => {
    if (!formData.commonName || !formData.scientificName) {
      Alert.alert('Error', 'Please fill in at least Common Name and Scientific Name');
      return;
    }

    setIsLoading(true);
    try {
      // Get existing wildlife data from AsyncStorage
      const existingData = await AsyncStorage.getItem('wildlifeCards');
      let wildlifeCards = existingData ? JSON.parse(existingData) : [];

      // Add new card with unique ID
      const newCard = {
        _id: Date.now().toString(), // Simple ID generation
        ...formData,
        createdAt: new Date().toISOString(),
      };

      wildlifeCards.push(newCard);

      // Save back to AsyncStorage
      await AsyncStorage.setItem('wildlifeCards', JSON.stringify(wildlifeCards));

      Alert.alert('Success', 'Species card created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to WildlifeLibrary
            router.replace('/(tabs)/WildlifeLibrary');
          },
        },
      ]);
    } catch (error) {
      console.error('Create card error:', error);
      Alert.alert('Error', 'Failed to save species card. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
        <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Species Card</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Upload - Larger display */}
        <TouchableOpacity style={styles.imageUploadContainer} onPress={handleImagePick}>
          {formData.imageUri ? (
            <Image source={{ uri: formData.imageUri }} style={styles.uploadedImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={50} color="#999" />
              <Text style={styles.imagePlaceholderText}>Add Species Photo</Text>
              <Text style={styles.imageHintText}> Tap to upload</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Form Fields */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Common Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Greylag Goose"
              value={formData.commonName}
              onChangeText={(text) => handleInputChange('commonName', text)}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Scientific Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Anser anser"
              value={formData.scientificName}
              onChangeText={(text) => handleInputChange('scientificName', text)}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Family</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Anatidae"
              value={formData.family}
              onChangeText={(text) => handleInputChange('family', text)}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Detailed Information */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Detailed Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the species appearance and characteristics..."
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Habitat</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe where this species lives..."
              value={formData.habitat}
              onChangeText={(text) => handleInputChange('habitat', text)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Distribution</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Where is this species found?"
              value={formData.distribution}
              onChangeText={(text) => handleInputChange('distribution', text)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Conservation Status</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Least Concern, Endangered"
              value={formData.conservationStatus}
              onChangeText={(text) => handleInputChange('conservationStatus', text)}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#000" />
              <Text style={styles.submitButtonText}>CREATE CARD</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Image Picker Modal */}
      <Modal
        visible={imagePickerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setImagePickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Species Photo</Text>
            <Text style={styles.modalSubtitle}>Choose high quality image for best results</Text>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={handleCameraCapture}
            >
              <Ionicons name="camera" size={24} color="#000" />
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={handleGallerySelection}
            >
              <Ionicons name="images" size={24} color="#000" />
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalCancel}
              onPress={() => setImagePickerModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  imageUploadContainer: {
    margin: 15,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  uploadedImage: {
    width: '100%',
    height: 300, // Increased from 200 to 300
  },
  imagePlaceholder: {
    width: '100%',
    height: 300, // Increased from 200 to 300
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
  imageHintText: {
    marginTop: 5,
    fontSize: 12,
    color: '#bbb',
  },
  formCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e9cf3bff',
    marginHorizontal: 15,
    marginBottom: 30,
    paddingVertical: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginLeft: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#000',
  },
  modalCancel: {
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
});

export default CreateSpeciesCardScreen;