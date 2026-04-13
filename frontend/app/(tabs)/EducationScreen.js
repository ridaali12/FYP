import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const ResearcherEducationScreen = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    highestDegree: '',
    fieldOfStudy: '',
    institution: '',
    graduationYear: '',
    certifications: '',
    specialization: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.highestDegree.trim()) {
      newErrors.highestDegree = 'Highest degree is required';
    }
    if (!formData.fieldOfStudy.trim()) {
      newErrors.fieldOfStudy = 'Field of study is required';
    }
    if (!formData.institution.trim()) {
      newErrors.institution = 'Institution/University is required';
    }
    if (!formData.graduationYear.trim()) {
      newErrors.graduationYear = 'Graduation year is required';
    } else {
      const year = parseInt(formData.graduationYear);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1950 || year > currentYear) {
        newErrors.graduationYear = 'Please enter a valid year';
      }
    }
    if (!formData.specialization.trim()) {
      newErrors.specialization = 'Specialization is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDone = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly');
      return;
    }

    setLoading(true);
    try {
      // Save education data temporarily, then go to ORCID sign in screen
      await AsyncStorage.setItem('researcherEducationData', JSON.stringify(formData));
      await AsyncStorage.setItem('userType', 'researcher');
      router.push('/(tabs)/OrcidSignIn');
    } catch (error) {
      console.error('Error saving education data:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#FFFFFF', '#FFF9E6', '#FFFFFF']}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Text style={styles.title}>Education Details</Text>
            <Text style={styles.subtitle}>
              Please provide your academic background to continue as a Researcher
            </Text>

            {/* Highest Degree */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Highest Degree *</Text>
              <TextInput
                style={[styles.input, errors.highestDegree && styles.inputError]}
                placeholder="e.g., PhD, MSc, BSc"
                placeholderTextColor="#999"
                value={formData.highestDegree}
                onChangeText={(text) => handleInputChange('highestDegree', text)}
              />
              {errors.highestDegree ? (
                <Text style={styles.errorText}>{errors.highestDegree}</Text>
              ) : null}
            </View>

            {/* Field of Study */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Field of Study *</Text>
              <TextInput
                style={[styles.input, errors.fieldOfStudy && styles.inputError]}
                placeholder="e.g., Wildlife Biology, Ecology"
                placeholderTextColor="#999"
                value={formData.fieldOfStudy}
                onChangeText={(text) => handleInputChange('fieldOfStudy', text)}
              />
              {errors.fieldOfStudy ? (
                <Text style={styles.errorText}>{errors.fieldOfStudy}</Text>
              ) : null}
            </View>

            {/* Institution */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Institution/University *</Text>
              <TextInput
                style={[styles.input, errors.institution && styles.inputError]}
                placeholder="e.g., University of Punjab"
                placeholderTextColor="#999"
                value={formData.institution}
                onChangeText={(text) => handleInputChange('institution', text)}
              />
              {errors.institution ? (
                <Text style={styles.errorText}>{errors.institution}</Text>
              ) : null}
            </View>

            {/* Graduation Year */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Graduation Year *</Text>
              <TextInput
                style={[styles.input, errors.graduationYear && styles.inputError]}
                placeholder="e.g., 2020"
                placeholderTextColor="#999"
                value={formData.graduationYear}
                onChangeText={(text) => handleInputChange('graduationYear', text)}
                keyboardType="numeric"
                maxLength={4}
              />
              {errors.graduationYear ? (
                <Text style={styles.errorText}>{errors.graduationYear}</Text>
              ) : null}
            </View>

            {/* Specialization */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Specialization *</Text>
              <TextInput
                style={[styles.input, errors.specialization && styles.inputError]}
                placeholder="e.g., Marine Biology, Conservation"
                placeholderTextColor="#999"
                value={formData.specialization}
                onChangeText={(text) => handleInputChange('specialization', text)}
              />
              {errors.specialization ? (
                <Text style={styles.errorText}>{errors.specialization}</Text>
              ) : null}
            </View>

            {/* Certifications (optional) */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Certifications (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="List any relevant certifications"
                placeholderTextColor="#999"
                value={formData.certifications}
                onChangeText={(text) => handleInputChange('certifications', text)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.doneButton, loading && styles.doneButtonDisabled]}
              onPress={handleDone}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.doneButtonText}>Next</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  fieldContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#000',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  doneButton: {
    backgroundColor: '#F4D03F',
    width: '100%',
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  doneButtonDisabled: {
    opacity: 0.6,
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
});

export default ResearcherEducationScreen;
