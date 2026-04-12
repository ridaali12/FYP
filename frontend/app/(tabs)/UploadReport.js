import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  ScrollView, Alert, StyleSheet, ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from '../../components/BottomNav';
import { useAlerts } from '../../contexts/AlertContext.js';
import AlertTestButton from '../../components/AlertTestButton';

// ✅ Cloudinary Configuration - REPLACE WITH YOUR ACTUAL VALUES
const CLOUDINARY_CLOUD_NAME = 'dlkjgegss'; // Replace with your cloud name
const CLOUDINARY_UPLOAD_PRESET = 'fyp-sdp2'; // Replace with your upload preset

// ✅ Open-Meteo — 100% FREE | No API Key
const getWeatherInfo = (code) => {
  if (code === 0)  return { icon: '☀️', label: 'Clear Sky',     research: 'Optimal visibility for species identification' };
  if (code <= 2)   return { icon: '⛅', label: 'Partly Cloudy', research: 'Moderate light — good for photography' };
  if (code === 3)  return { icon: '☁️', label: 'Overcast',      research: 'Animals may show altered foraging behavior' };
  if (code <= 49)  return { icon: '🌫️',label: 'Foggy',         research: 'Reduced visibility — data accuracy may vary' };
  if (code <= 57)  return { icon: '🌦️', label: 'Drizzle',      research: 'Many species seek shelter during drizzle' };
  if (code <= 67)  return { icon: '🌧️', label: 'Rain',         research: 'Rain affects movement & feeding patterns' };
  if (code <= 77)  return { icon: '❄️', label: 'Snow',          research: 'Snow reveals tracks — high tracking value' };
  if (code <= 82)  return { icon: '🌧️', label: 'Rain Showers', research: 'Intermittent rain — watch for post-rain activity' };
  if (code <= 86)  return { icon: '❄️', label: 'Snow Showers',  research: 'Cold stress may drive migration behavior' };
  if (code >= 95)  return { icon: '⛈️', label: 'Thunderstorm', research: 'Animals in distress — elevated alert behavior' };
  return                  { icon: '🌡️', label: 'Unknown',       research: 'Weather data being processed' };
};

const getTempBehaviorHint = (temp) => {
  if (temp <= 0)  return { hint: 'Hibernation / torpor likely active', color: '#1565C0' };
  if (temp <= 10) return { hint: 'Animals conserving energy — reduced activity', color: '#1976D2' };
  if (temp <= 20) return { hint: 'Moderate activity — prime observation window', color: '#2E7D32' };
  if (temp <= 30) return { hint: 'Peak activity — dawn & dusk most active', color: '#388E3C' };
  if (temp <= 38) return { hint: 'Heat stress possible — animals near water', color: '#F57C00' };
  return                 { hint: 'Extreme heat — animals seeking shade/burrows', color: '#D32F2F' };
};

const fetchWeather = async (latitude, longitude) => {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,` +
    `wind_speed_10m,surface_pressure,visibility,weather_code` +
    `&wind_speed_unit=ms&timezone=auto`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Open-Meteo error: ${response.status}`);
  const data = await response.json();
  const c = data.current;
  const weatherInfo = getWeatherInfo(c.weather_code);
  const tempHint = getTempBehaviorHint(Math.round(c.temperature_2m));
  return {
    temperature:   Math.round(c.temperature_2m),
    feelsLike:     Math.round(c.apparent_temperature),
    humidity:      c.relative_humidity_2m,
    condition:     weatherInfo.label,
    description:   weatherInfo.label,
    researchNote:  weatherInfo.research,
    behaviorHint:  tempHint.hint,
    behaviorColor: tempHint.color,
    windSpeed:     c.wind_speed_10m?.toFixed(1) ?? 'N/A',
    visibility:    c.visibility != null ? (c.visibility / 1000).toFixed(1) : 'N/A',
    pressure:      Math.round(c.surface_pressure),
    capturedAt:    new Date().toLocaleString(),
    icon:          weatherInfo.icon,
  };
};

const healthOptions = ['Healthy', 'Injured', 'Sick', 'Hungry'];

const UploadReport = () => {
  const router = useRouter();
  const { addHighAlert, addNormalAlert } = useAlerts();
  const [image, setImage]                     = useState(null);
  const [uploading, setUploading]             = useState(false); // New state for upload progress
  const [specieName, setSpecieName]           = useState('');
  const [selectedHealth, setSelectedHealth]   = useState(null);
  const [location, setLocation]               = useState(null);
  const [timestamp, setTimestamp]             = useState('');
  const [locationLoading, setLocationLoading] = useState(true);
  const [weather, setWeather]                 = useState(null);
  const [weatherLoading, setWeatherLoading]   = useState(false);
  const [weatherError, setWeatherError]       = useState('');
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    setSelectedHealth(null);
    fetchLocationAndWeather();
  }, []);

  useEffect(() => {
    if (weather) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }
  }, [weather]);

  const fetchLocationAndWeather = async () => {
    setLocationLoading(true);
    setWeatherLoading(true);
    setWeatherError('');
    fadeAnim.setValue(0);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required.');
        setLocationLoading(false);
        setWeatherLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc.coords);
      setTimestamp(new Date().toLocaleString());
      const w = await fetchWeather(loc.coords.latitude, loc.coords.longitude);
      setWeather(w);
    } catch (error) {
      console.error('Error:', error);
      setWeatherError('Could not fetch weather. Check internet connection.');
    } finally {
      setLocationLoading(false);
      setWeatherLoading(false);
    }
  };

  const refreshWeather = async () => {
    if (!location) { fetchLocationAndWeather(); return; }
    setWeatherLoading(true);
    setWeatherError('');
    fadeAnim.setValue(0);
    try {
      const w = await fetchWeather(location.latitude, location.longitude);
      setWeather(w);
    } catch {
      setWeatherError('Weather refresh failed. Check internet.');
    } finally {
      setWeatherLoading(false);
    }
  };

  const checkImageQuality = (imageAsset) => {
    const { width, height, fileSize } = imageAsset;
    if (width < 300 || height < 300) {
      Alert.alert('Low Resolution', 'Please choose a clearer image (at least 300x300).');
      return false;
    }
    if (fileSize && fileSize < 40000) {
      Alert.alert('Low Quality', 'Please select a higher quality image.');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 1,
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 1,
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
    if (!image) { Alert.alert('No image selected', 'Please select or take a photo first.'); return; }
    setSpecieName('Identified Specie Name');
  };

  // ✅ NEW FUNCTION: Upload image to Cloudinary
  const uploadImageToCloudinary = async (imageUri) => {
    try {
      // Compress image for faster upload and to stay within free tier limits
      const compressed = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1200 } }], // Reasonable size for reports
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Create form data for Cloudinary upload
      const formData = new FormData();
      formData.append('file', {
        uri: compressed.uri,
        type: 'image/jpeg',
        name: `wildlife-report-${Date.now()}.jpg`,
      });
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'wildlife_reports'); // Optional: organize in folders

      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Upload to Cloudinary failed');
      }

      console.log('✅ Image uploaded to Cloudinary:', data.secure_url);
      return data.secure_url; // This is the public URL to store in database
    } catch (error) {
      console.error('❌ Cloudinary upload error:', error);
      throw error;
    }
  };

  const handleUpload = async () => {
    if (!image || !specieName || !selectedHealth) {
      Alert.alert('Incomplete', 'Please fill all required fields.');
      return;
    }

    setUploading(true); // Start uploading state

    try {
      // 1. First upload image to Cloudinary
      Alert.alert('Uploading', 'Uploading image to cloud...');
      const imageUrl = await uploadImageToCloudinary(image);
      
      // 2. Get user info from AsyncStorage
      const userId = await AsyncStorage.getItem('userId');
      const username = await AsyncStorage.getItem('username');
      
      // 3. Prepare report data with Cloudinary URL instead of local URI
      const reportData = {
        image: imageUrl, // ✅ This is now a public Cloudinary URL!
        specieName,
        healthStatus: selectedHealth,
        location, 
        timestamp,
        userId: userId || 'anonymous',
        username: username || 'Anonymous User',
        weatherConditions: weather ? {
          temperature:  `${weather.temperature}°C`,
          feelsLike:    `${weather.feelsLike}°C`,
          condition:     weather.condition,
          description:   weather.description,
          humidity:     `${weather.humidity}%`,
          windSpeed:    `${weather.windSpeed} m/s`,
          visibility:   `${weather.visibility} km`,
          pressure:     `${weather.pressure} hPa`,
          capturedAt:    weather.capturedAt,
          researchNote:  weather.researchNote,
          behaviorHint:  weather.behaviorHint,
        } : null,
      };

      // 4. Confirm upload
      Alert.alert('Confirm Upload', 'Are you sure you want to upload this report?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upload',
          onPress: async () => {
            try {
              const API_URL = 'http://192.168.100.2:5000';
              const response = await fetch(`${API_URL}/api/reports`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reportData),
              });
              
              const result = await response.json();
              
              if (response.ok) {
                // Trigger alerts based on health status
                if (selectedHealth === 'Injured') {
                  addHighAlert(
                    '🚨 INJURED ANIMAL REPORTED',
                    `${specieName} needs immediate attention! Location: ${location?.latitude?.toFixed(4)}, ${location?.longitude?.toFixed(4)}`,
                    result.reportId
                  );
                } else {
                  addNormalAlert(
                    '✅ Wildlife Report Submitted',
                    `${specieName} sighting reported successfully`
                  );
                }
                
                Alert.alert('Success', 'Report uploaded successfully!', [
                  { text: 'OK', onPress: () => router.push('/(tabs)/ReportsFeed') },
                ]);
              } else {
                Alert.alert('Error', 'Failed to upload report. Please try again.');
              }
            } catch (error) {
              console.error('Upload error:', error);
              Alert.alert('Connection Error', 'Could not connect to server.');
            } finally {
              setUploading(false);
            }
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Upload Failed', 'Failed to upload image to cloud. Please try again.');
      console.error('Upload error:', error);
      setUploading(false);
    }
  };

  // Define WeatherMetric component and styles BEFORE return
  const WeatherMetric = ({ icon, label, value, color, small }) => (
    <View style={metricStyles.tile}>
      <View style={[metricStyles.iconBox, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={metricStyles.label}>{label}</Text>
      <Text style={[metricStyles.value, small && { fontSize: 9 }]}>{value}</Text>
    </View>
  );

  const metricStyles = StyleSheet.create({
    tile:    { width: '31%', backgroundColor: '#FAFAFA', borderRadius: 12, padding: 10, alignItems: 'center', marginBottom: 6, borderWidth: 1, borderColor: '#F0F0F0' },
    iconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
    label:   { fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: '600' },
    value:   { fontSize: 12, fontWeight: '800', color: '#222', marginTop: 3, textAlign: 'center' },
  });

  const styles = StyleSheet.create({
    safeArea:  { flex: 1, backgroundColor: '#1B5E20' },
    container: { paddingBottom: 90, backgroundColor: '#F4F6F4' },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#1B5E20',
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

    sectionCard: {
      backgroundColor: '#fff', marginHorizontal: 12, marginTop: 12,
      borderRadius: 14, padding: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    sectionHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    sectionIconBox: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    sectionTitle:   { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },

    imageOptions:  { flexDirection: 'row', alignItems: 'center' },
    optionButton:  { flex: 1, alignItems: 'center', paddingVertical: 8 },
    optionIconBox: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    optionText:    { fontSize: 13, color: '#333', fontWeight: '600' },
    optionDivider: { width: 1, height: 50, backgroundColor: '#F0F0F0' },
    previewImage:  { width: '100%', height: 200, marginTop: 12, borderRadius: 10 },

    specieRow: { flexDirection: 'row', alignItems: 'center' },
    input: {
      flex: 1, borderWidth: 1.5, borderColor: '#E0E0E0',
      padding: 10, borderRadius: 10, marginRight: 8,
      fontSize: 14, color: '#222', backgroundColor: '#FAFAFA',
    },
    aiButton: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFD700',
      paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, gap: 5,
    },
    aiText: { fontWeight: '700', fontSize: 13 },

    radioContainer: { flexDirection: 'row', flexWrap: 'wrap' },
    radioOption:    { flexDirection: 'row', alignItems: 'center', width: '50%', marginVertical: 6 },
    radioCircle:    { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#8f8d8d', marginRight: 10 },
    radioSelected:  { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
    radioLabel:     { fontSize: 14, color: '#333', fontWeight: '500' },

    locLoadingRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
    locLoadingText: { color: '#888', fontSize: 13, marginLeft: 6 },
    locInfoBox:     { backgroundColor: '#F1F8E9', borderRadius: 10, padding: 10, gap: 6 },
    locRow:         { flexDirection: 'row', alignItems: 'center', gap: 6 },
    locText:        { fontSize: 13, color: '#333', fontWeight: '500', flex: 1 },

    weatherCard: {
      backgroundColor: '#fff', marginHorizontal: 12, marginTop: 12,
      borderRadius: 16, overflow: 'hidden',
      shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12, shadowRadius: 10, elevation: 5,
    },
    weatherHeader: {
      backgroundColor: '#1B5E20', padding: 16,
      flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    },
    weatherHeaderLabel: { fontSize: 10, color: '#A5D6A7', fontWeight: '800', letterSpacing: 1.2, marginBottom: 3 },
    weatherHeaderTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
    weatherHeaderSub:   { fontSize: 11, color: '#81C784', marginTop: 3, lineHeight: 16 },
    refreshBtn: {
      backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
      width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
    },

    weatherLoadingBox:     { padding: 28, alignItems: 'center', gap: 8 },
    weatherLoadingText:    { fontSize: 14, color: '#2E7D32', fontWeight: '700', marginTop: 4 },
    weatherLoadingSubText: { fontSize: 12, color: '#aaa' },

    weatherErrorBox: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      margin: 16, backgroundColor: '#FFF3E0', borderRadius: 10, padding: 12,
    },
    weatherErrorText: { color: '#E65100', fontSize: 12, flex: 1 },

    weatherConditionRow: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      padding: 16, paddingBottom: 10,
    },
    weatherBigIcon:   { fontSize: 56 },
    weatherTemp:      { fontSize: 36, fontWeight: '900', color: '#1B5E20', lineHeight: 38 },
    weatherCondLabel: { fontSize: 14, color: '#555', fontWeight: '600', marginTop: 2 },

    researchNoteBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: '#EDE7F6', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4,
      marginTop: 6, alignSelf: 'flex-start',
    },
    researchNoteText: { fontSize: 10, color: '#5C6BC0', fontWeight: '600', flex: 1, flexWrap: 'wrap' },

    behaviorBanner: {
      marginHorizontal: 16, marginBottom: 14,
      backgroundColor: '#F9FBF9', borderRadius: 10,
      borderLeftWidth: 4, padding: 12,
    },
    behaviorBannerTop:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
    behaviorBannerLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
    behaviorBannerText:  { fontSize: 13, color: '#333', fontWeight: '600' },

    weatherDivider:      { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 16, marginBottom: 10 },
    weatherMetricsLabel: { fontSize: 10, color: '#bbb', fontWeight: '800', letterSpacing: 1, paddingHorizontal: 16, marginBottom: 8 },
    metricsGrid:         { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 6, justifyContent: 'space-between' },

    weatherFooter: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      margin: 16, marginTop: 8, paddingTop: 10,
      borderTopWidth: 1, borderTopColor: '#F0F0F0',
    },
    weatherFooterLeft:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
    weatherFooterText:   { fontSize: 11, color: '#2E7D32', fontWeight: '700' },
    weatherFooterSource: { fontSize: 10, color: '#bbb', fontWeight: '600' },

    uploadButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#FFD700', padding: 16, marginHorizontal: 12, marginTop: 16,
      borderRadius: 14,
      shadowColor: '#FFD700', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    uploadButtonText: { fontWeight: '800', fontSize: 16, color: '#1a1a1a' },
    disabledButton: {
      opacity: 0.5,
    },
    uploadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255,255,255,0.9)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    uploadingText: {
      marginTop: 10,
      fontSize: 16,
      color: '#1B5E20',
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Uploading Overlay */}
      {uploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color="#1B5E20" />
          <Text style={styles.uploadingText}>Uploading image to cloud...</Text>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/HomeScreen')}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Sighting Report</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* ══ 1. Image Picker ══ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBox}><Ionicons name="camera" size={16} color="#2E7D32" /></View>
            <Text style={styles.sectionTitle}>Upload Picture / Video</Text>
          </View>
          <View style={styles.imageOptions}>
            <TouchableOpacity style={styles.optionButton} onPress={pickFromCamera} disabled={uploading}>
              <View style={styles.optionIconBox}><Ionicons name="camera-outline" size={26} color="#2E7D32" /></View>
              <Text style={styles.optionText}>Camera</Text>
            </TouchableOpacity>
            <View style={styles.optionDivider} />
            <TouchableOpacity style={styles.optionButton} onPress={pickImage} disabled={uploading}>
              <View style={styles.optionIconBox}><Ionicons name="image-outline" size={26} color="#2E7D32" /></View>
              <Text style={styles.optionText}>Gallery</Text>
            </TouchableOpacity>
          </View>
          {image && <Image source={{ uri: image }} style={styles.previewImage} />}
        </View>

        {/* ══ 2. Specie Name + AI ══ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBox}><Ionicons name="paw" size={16} color="#2E7D32" /></View>
            <Text style={styles.sectionTitle}>Specie Name</Text>
          </View>
          <View style={styles.specieRow}>
            <TextInput
              placeholder="Enter specie name"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={specieName}
              onChangeText={setSpecieName}
              editable={!uploading}
            />
            <TouchableOpacity onPress={identifySpecie} style={styles.aiButton} disabled={uploading}>
              <Ionicons name="scan" size={18} color="#000" />
              <Text style={styles.aiText}>AI Identify</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ══ 3. Health Status — simple radio circles only ══ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBox}><Ionicons name="heart" size={16} color="#2E7D32" /></View>
            <Text style={styles.sectionTitle}>Health Status</Text>
          </View>
          <View style={styles.radioContainer}>
            {healthOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.radioOption}
                onPress={() => setSelectedHealth(option)}
                disabled={uploading}
              >
                <View style={[styles.radioCircle, selectedHealth === option && styles.radioSelected]} />
                <Text style={styles.radioLabel}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ══ 4. Location + Time ══ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBox}><Ionicons name="location" size={16} color="#2E7D32" /></View>
            <Text style={styles.sectionTitle}>Location & Time</Text>
          </View>
          {locationLoading ? (
            <View style={styles.locLoadingRow}>
              <ActivityIndicator size="small" color="#2E7D32" />
              <Text style={styles.locLoadingText}>  Detecting location...</Text>
            </View>
          ) : location ? (
            <View style={styles.locInfoBox}>
              <View style={styles.locRow}>
                <Ionicons name="navigate-circle" size={18} color="#2E7D32" />
                <Text style={styles.locText}>{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</Text>
              </View>
              <View style={styles.locRow}>
                <Ionicons name="time" size={18} color="#2E7D32" />
                <Text style={styles.locText}>{timestamp}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.locText}>Location unavailable</Text>
          )}
        </View>

        {/* ══ 5. Weather Research Card ══ */}
        <View style={styles.weatherCard}>
          <View style={styles.weatherHeader}>
            <View>
              
              <Text style={styles.weatherHeaderTitle}>Wildlife Weather Context</Text>
              <Text style={styles.weatherHeaderSub}>Helps analyze animal behavior & improves research accuracy</Text>
            </View>
            <TouchableOpacity onPress={refreshWeather} style={styles.refreshBtn} disabled={uploading}>
              <Ionicons name="refresh" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {weatherLoading && (
            <View style={styles.weatherLoadingBox}>
              <ActivityIndicator size="large" color="#2E7D32" />
              <Text style={styles.weatherLoadingText}>Fetching live weather data...</Text>
              <Text style={styles.weatherLoadingSubText}>Connecting to climate sensors</Text>
            </View>
          )}

          {!weatherLoading && weatherError ? (
            <View style={styles.weatherErrorBox}>
              <Ionicons name="warning" size={20} color="#E65100" />
              <Text style={styles.weatherErrorText}>{weatherError}</Text>
            </View>
          ) : null}

          {!weatherLoading && weather && (
            <Animated.View style={{ opacity: fadeAnim }}>
              <View style={styles.weatherConditionRow}>
                <Text style={styles.weatherBigIcon}>{weather.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.weatherTemp}>{weather.temperature}°C</Text>
                  <Text style={styles.weatherCondLabel}>{weather.condition}</Text>
                  <View style={styles.researchNoteBadge}>
                    <Ionicons name="flask" size={11} color="#5C6BC0" />
                    <Text style={styles.researchNoteText}>{weather.researchNote}</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.behaviorBanner, { borderLeftColor: weather.behaviorColor }]}>
                <View style={styles.behaviorBannerTop}>
                  <Ionicons name="analytics" size={14} color={weather.behaviorColor} />
                  <Text style={[styles.behaviorBannerLabel, { color: weather.behaviorColor }]}>BEHAVIOR PREDICTION</Text>
                </View>
                <Text style={styles.behaviorBannerText}>🐾 {weather.behaviorHint}</Text>
              </View>

              <View style={styles.weatherDivider} />
              <Text style={styles.weatherMetricsLabel}>📊 ATMOSPHERIC METRICS</Text>
              <View style={styles.metricsGrid}>
                <WeatherMetric icon="thermometer" label="Feels Like" value={`${weather.feelsLike}°C`}   color="#E53935" />
                <WeatherMetric icon="water"       label="Humidity"   value={`${weather.humidity}%`}     color="#1E88E5" />
                <WeatherMetric icon="speedometer" label="Wind"       value={`${weather.windSpeed} m/s`} color="#43A047" />
                <WeatherMetric icon="eye"         label="Visibility" value={`${weather.visibility} km`} color="#8E24AA" />
                <WeatherMetric icon="bar-chart"   label="Pressure"   value={`${weather.pressure} hPa`}  color="#F4511E" />
                <WeatherMetric icon="time"        label="Recorded"   value={weather.capturedAt}          color="#00897B" small />
              </View>

              <View style={styles.weatherFooter}>
                <View style={styles.weatherFooterLeft}>
                  <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />
                  <Text style={styles.weatherFooterText}>Auto-attached to report</Text>
                </View>
                <Text style={styles.weatherFooterSource}>via Open-Meteo</Text>
              </View>
            </Animated.View>
          )}
        </View>

        {/* ══ 6. Upload Button ══ */}
        <TouchableOpacity 
          style={[styles.uploadButton, uploading && styles.disabledButton]} 
          onPress={handleUpload}
          disabled={uploading}
        >
          <Ionicons name="cloud-upload" size={20} color="#000" />
          <Text style={styles.uploadButtonText}>  {uploading ? 'UPLOADING...' : 'Submit Wildlife Report'}</Text>
        </TouchableOpacity>

        <View style={{ height: 10 }} />
      </ScrollView>
      <BottomNav />
      <AlertTestButton />
    </SafeAreaView>
  );
};

export default UploadReport;
