import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  Alert, 
  Dimensions, 
  Modal, 
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import KeyboardAwareContainer from '../../components/KeyboardAwareContainer';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const API_URL = 'http://192.168.109.181:5000'; // Update with your backend IP

const UserProfile = () => {
  const router = useRouter();

  const [profileData, setProfileData] = useState({
    profileImage: null,
    username: '',
    email: '',
    password: '••••••••',
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePickerModal, setImagePickerModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [editForm, setEditForm] = useState({
    profileImage: null,
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const savedProfileImage = await AsyncStorage.getItem('profileImage');

      if (savedProfileImage) {
        setProfileData(prev => ({ ...prev, profileImage: savedProfileImage }));
      }

      if (userId) {
        const response = await fetch(`${API_URL}/api/auth/profile/${userId}`);
        const result = await response.json();

        if (response.ok && result.user) {
          setProfileData({
            ...profileData,
            username: result.user.username || '',
            email: result.user.email || '',
          });

          await AsyncStorage.setItem('username', result.user.username || '');
          await AsyncStorage.setItem('userEmail', result.user.email || '');
        }
      }
    } catch (error) {
      console.log('Error loading profile data:', error);
    }
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

  const handleGallerySelection = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setEditForm(prev => ({ ...prev, profileImage: result.assets[0].uri }));
      setImagePickerModal(false);
    }
  };

  const handleCameraCapture = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setEditForm(prev => ({ ...prev, profileImage: result.assets[0].uri }));
      setImagePickerModal(false);
    }
  };

  const handleEditMode = () => {
    setEditForm({
      profileImage: profileData.profileImage,
      username: profileData.username,
      email: profileData.email,
      password: '',
      confirmPassword: '',
    });
    setIsEditMode(true);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleUpdateProfile = async () => {
    // Validation
    if (!editForm.username.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }
    if (!editForm.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }
    if (editForm.password && editForm.password !== editForm.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'User not logged in');
        return;
      }

      const updateData = {
        username: editForm.username.trim(),
        email: editForm.email.trim(),
      };

      if (editForm.password) updateData.password = editForm.password;

      const response = await fetch(`${API_URL}/api/auth/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('username', result.user.username);
        await AsyncStorage.setItem('userEmail', result.user.email);
        if (editForm.profileImage) {
          await AsyncStorage.setItem('profileImage', editForm.profileImage);
        }

        setProfileData({
          profileImage: editForm.profileImage || profileData.profileImage,
          username: result.user.username,
          email: result.user.email,
          password: editForm.password ? '••••••••' : profileData.password,
        });

        setIsEditMode(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', result.message || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to connect to the server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAwareContainer>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar hidden={false} backgroundColor="#fff" barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/HomeScreen')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>User Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          {!isEditMode ? (
            <View style={styles.profileContainer}>
              {/* Profile Picture */}
              <View style={styles.profileImageContainer}>
                {profileData.profileImage ? (
                  <Image source={{ uri: profileData.profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Ionicons name="person" size={60} color="#999" />
                  </View>
                )}
              </View>

              {/* Profile Details */}
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Username</Text>
                  <Text style={styles.detailValue}>{profileData.username}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{profileData.email}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Password</Text>
                  <Text style={styles.detailValue}>{profileData.password}</Text>
                </View>
              </View>

              {/* Edit Button */}
              <TouchableOpacity style={styles.editButton} onPress={handleEditMode}>
                <Ionicons name="create-outline" size={20} color="#000000ff" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.editContainer}>
              {/* Editable Profile Picture */}
              <View style={styles.profileImageEditContainer}>
                <TouchableOpacity onPress={() => setImagePickerModal(true)} activeOpacity={0.8}>
                  {editForm.profileImage ? (
                    <Image source={{ uri: editForm.profileImage }} style={styles.profileImage} />
                  ) : (
                    <View style={styles.profileImagePlaceholder}>
                      <Ionicons name="person" size={60} color="#999" />
                    </View>
                  )}
                  {/* Camera icon badge */}
                  <View style={styles.cameraIconBadge}>
                    <Ionicons name="camera" size={18} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Edit Fields */}
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Username</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editForm.username}
                    onChangeText={(text) => setEditForm({ ...editForm, username: text })}
                    placeholder="Enter username"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editForm.email}
                    onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                    placeholder="Enter email"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>New Password </Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={editForm.password}
                      onChangeText={(text) => setEditForm({ ...editForm, password: text })}
                      placeholder="Enter new password"
                      placeholderTextColor="#999"
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeIconInInput}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={editForm.confirmPassword}
                      onChangeText={(text) => setEditForm({ ...editForm, confirmPassword: text })}
                      placeholder="Confirm new password"
                      placeholderTextColor="#999"
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeIconInInput}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Buttons */}
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setIsEditMode(false)}
                  disabled={isLoading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.updateButton} 
                  onPress={handleUpdateProfile}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#000000ff" />
                      <Text style={styles.updateButtonText}>Update Profile</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Image Picker Modal */}
        <Modal
          visible={imagePickerModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setImagePickerModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choose Profile Picture</Text>
              
              <TouchableOpacity style={styles.modalOption} onPress={handleCameraCapture}>
                <Ionicons name="camera" size={24} color="#1a5f3a" />
                <Text style={styles.modalOptionText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalOption} onPress={handleGallerySelection}>
                <Ionicons name="images" size={24} color="#1a5f3a" />
                <Text style={styles.modalOptionText}>Choose from Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => setImagePickerModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </KeyboardAwareContainer>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  container: { 
    flexGrow: 1, 
    paddingBottom: 20 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backButton: { 
    padding: 5 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#1a1a1a', 
    flex: 1, 
    textAlign: 'center' 
  },
  headerSpacer: { 
    width: 34 
  },
  profileContainer: { 
    alignItems: 'center', 
    padding: 24 
  },
  profileImageContainer: { 
    marginBottom: 32,
    marginTop: 16,
  },
  profileImage: { 
    width: 120, 
    height: 120, 
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e8e8e8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: { 
    fontSize: 13, 
    fontWeight: '500', 
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: { 
    fontSize: 16, 
    color: '#1a1a1a',
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: '100%',
    
  },
  editButtonText: { 
    color: '#000000ff', 
    fontSize: 16, 
    fontWeight: '600', 
    marginLeft: 8 
  },
  editContainer: { 
    padding: 24 
  },
  profileImageEditContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1a5f3a',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  formContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1a1a1a',
  },
  passwordInputContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    paddingVertical: 14,
  },
  eyeIconInInput: {
    padding: 5,
  },
  actionButtonsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  cancelButtonText: { 
    color: '#666', 
    fontWeight: '600',
    fontSize: 15,
  },
  updateButton: {
    flex: 1,
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  updateButtonText: { 
    color: '#000000ff', 
    fontWeight: '600', 
    fontSize: 15,
    marginLeft: 6,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 12,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 16,
    fontWeight: '500',
  },
  modalCancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
});

export default UserProfile;