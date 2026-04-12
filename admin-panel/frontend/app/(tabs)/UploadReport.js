import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Alert, 
  StyleSheet 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from '../../components/BottomNav';

const healthOptions = ['Healthy', 'Injured', 'Sick', 'Hungry'];

const UploadReport = () => {
  const router = useRouter();
  const [image, setImage] = useState(null);
  const [specieName, setSpecieName] = useState('');
  const [selectedHealth, setSelectedHealth] = useState(null);
  const [location, setLocation] = useState(null);
  const [timestamp, setTimestamp] = useState('');
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
      setLocationLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Location permission is required.');
          setLocationLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(loc.coords);
        setTimestamp(new Date().toLocaleString());
        console.log('Location captured:', loc.coords);
      } catch (error) {
        console.error('Location error:', error);
        Alert.alert('Location Error', 'Unable to fetch location.');
      } finally {
        setLocationLoading(false);
      }
    };
    
    fetchLocation();
  }, []);

  // ✅ Check clarity & dimensions
  const checkImageQuality = (imageAsset) => {
    const { width, height, fileSize } = imageAsset;
    console.log(`Dimensions: ${width}x${height}, Size: ${fileSize || 'unknown'}`);

    // Minimum acceptable dimensions and approximate size
    if (width < 300 || height < 300) {
      Alert.alert('Low Resolution', 'Please choose a clearer image (at least 300x300).');
      return false;
    }

    // If available, check file size (in bytes)
    if (fileSize && fileSize < 40000) {
      Alert.alert('Low Quality', 'Please select a higher quality image.');
      return false;
    }

    return true;
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      const selected = result.assets[0];
      if (checkImageQuality(selected)) {
        setImage(selected.uri);
        Alert.alert('✅ Image Accepted', 'Image is clear and ready to upload!');
      }
    }
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera Permission', 'Please enable camera permission in settings.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const selected = result.assets[0];
      if (checkImageQuality(selected)) {
        setImage(selected.uri);
        Alert.alert('✅ Image Accepted', 'Image is clear and ready to upload!');
      }
    }
  };

  const identifySpecie = async () => {
    if (!image) {
      Alert.alert('No image selected', 'Please select or take a photo first.');
      return;
    }
    setSpecieName('Identified Specie Name');
  };

  const handleUpload = async () => {
    if (!image || !specieName || !selectedHealth) {
      Alert.alert('Incomplete', 'Please fill all required fields.');
      return;
    }

    // Get user data from AsyncStorage
    const userId = await AsyncStorage.getItem('userId');
    const username = await AsyncStorage.getItem('username');

    const reportData = {
      image,
      specieName,
      healthStatus: selectedHealth,
      location,
      timestamp,
      userId: userId || 'anonymous',
      username: username || 'Anonymous User',
    };

    Alert.alert('Confirm Upload', 'Are you sure you want to upload this report?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Upload',
        onPress: async () => {
          try {
            const API_URL = 'http://192.168.109.181:5000'; // your computer's IP
            const response = await fetch(`${API_URL}/api/reports`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(reportData),
            });

            const result = await response.json();

            if (response.ok) {
              Alert.alert('Success', 'Report uploaded successfully!', [
                { text: 'OK', onPress: () => router.push('/(tabs)/ReportsFeed') },
              ]);
            } else {
              Alert.alert('Error', 'Failed to upload report. Please try again.');
            }
          } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Connection Error', 'Could not connect to server. Check your connection.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/HomeScreen')}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Report</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>

      {/* Image Picker Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Upload Picture/Video</Text>
        <View style={styles.imageOptions}>
          <TouchableOpacity style={styles.optionButton} onPress={pickFromCamera}>
            <Ionicons name="camera" size={24} color="#000" />
            <Text style={styles.optionText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={pickImage}>
            <Ionicons name="image" size={24} color="#000" />
            <Text style={styles.optionText}>Gallery</Text>
          </TouchableOpacity>
        </View>
        {image && <Image source={{ uri: image }} style={styles.previewImage} />}
      </View>

      {/* Specie Name + AI */}
      <View style={styles.section}>
        <Text style={styles.label}>Specie Name</Text>
        <View style={styles.specieRow}>
          <TextInput
            placeholder="Enter specie name"
            style={styles.input}
            value={specieName}
            onChangeText={setSpecieName}
          />
          <TouchableOpacity onPress={identifySpecie} style={styles.aiButton}>
            <Ionicons name="scan" size={22} color="#000" />
            <Text style={styles.aiText}>AI</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Health Status */}
      <View style={styles.section}>
        <Text style={styles.label}>Health Status</Text>
        <View style={styles.radioContainer}>
          {healthOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.radioOption}
              onPress={() => setSelectedHealth(option)}
            >
              <View
                style={[
                  styles.radioCircle,
                  selectedHealth === option && styles.radioSelected,
                ]}
              />
              <Text style={styles.radioLabel}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Location + Time */}
      <View style={styles.section}>
        <Text style={styles.label}>Location & Time</Text>
        {locationLoading ? (
          <Text style={styles.infoText}>Fetching location...</Text>
        ) : location ? (
          <>
            <Text style={styles.infoText}>
              📍 {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
            </Text>
            <Text style={styles.infoText}>🕒 {timestamp}</Text>
          </>
        ) : (
          <Text style={styles.infoText}>Location unavailable</Text>
        )}
      </View>

      {/* Upload Button */}
      <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
        <Text style={styles.uploadButtonText}>Upload Report</Text>
      </TouchableOpacity>
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
};

export default UploadReport;

// ✅ Styles
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f2f2f2', },
  container: { paddingBottom: 80, backgroundColor: '#f2f2f2' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 13,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#000' },
  section: {
    backgroundColor: '#fff',
    padding: 17,
    margin: 10,
    borderRadius: 10,
    elevation: 1,
  },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  imageOptions: { flexDirection: 'row', justifyContent: 'space-between' },
  optionButton: { alignItems: 'center', padding: 10, flex: 1 },
  optionText: { marginTop: 4, fontSize: 14 },
  previewImage: {
    width: '100%',
    height: 200,
    marginTop: 10,
    borderRadius: 10,
  },
  specieRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  aiText: { marginLeft: 5, fontWeight: '600' },
  radioContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginVertical: 4,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#8f8d8dff',
    marginRight: 8,
  },
  radioSelected: { backgroundColor: '#a7a7a7ff', borderColor: '#555' },
  radioLabel: { fontSize: 14 },
  infoText: { fontSize: 14, marginTop: 4 },
  uploadButton: {
    backgroundColor: '#FFD700',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  uploadButtonText: { fontWeight: '700', fontSize: 16 },
});
