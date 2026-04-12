import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const Feedback = () => {
  const router = useRouter();
  const [feedbackType, setFeedbackType] = useState('general');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);

  const feedbackTypes = [
    { id: 'general', label: 'General', icon: 'chatbubble-outline' },
    { id: 'bug', label: 'Bug Report', icon: 'bug-outline' },
    { id: 'feature', label: 'Feature Request', icon: 'bulb-outline' },
    { id: 'improvement', label: 'Improvement', icon: 'rocket-outline' },
  ];

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Required Fields', 'Please fill in all required fields.');
      return;
    }

    // Here you would typically send the feedback to your API
    console.log({
      type: feedbackType,
      name,
      email,
      message,
      rating,
    });

    Alert.alert(
      'Thank You!',
      'Your feedback has been submitted successfully. We appreciate your input!',
      [
        {
          text: 'OK',
          onPress: () => {
            setName('');
            setEmail('');
            setMessage('');
            setRating(0);
            setFeedbackType('general');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Feedback</Text>
          <Text style={styles.headerSubtitle}>We'd love to hear from you</Text>
        </View>
        <View style={styles.placeholderButton} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Hero Section */}
        <LinearGradient
          colors={['#1b4332', '#2d6a4f', '#40916c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroContainer}
        >
          <Ionicons name="chatbubbles" size={48} color="#FFD700" />
          <Text style={styles.heroTitle}>Your Voice Matters</Text>
          <Text style={styles.heroText}>
            Help us improve the Wildlife Conservation platform by sharing your thoughts, suggestions, or reporting issues.
          </Text>
        </LinearGradient>

        {/* Feedback Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feedback Type</Text>
          <View style={styles.typeGrid}>
            {feedbackTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  feedbackType === type.id && styles.typeCardActive,
                ]}
                onPress={() => setFeedbackType(type.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={type.icon}
                  size={24}
                  color={feedbackType === type.id ? '#2d6a4f' : '#666'}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    feedbackType === type.id && styles.typeLabelActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rate Your Experience</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={40}
                  color={star <= rating ? '#FFD700' : '#ccc'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Message *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Share your feedback, suggestions, or report an issue..."
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Ionicons name="send" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>Submit Feedback</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Info */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Other Ways to Reach Us</Text>
          <View style={styles.contactItem}>
            <Ionicons name="mail-outline" size={20} color="#2d6a4f" />
            <Text style={styles.contactText}>support@wildlifeconservation.pk</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="call-outline" size={20} color="#2d6a4f" />
            <Text style={styles.contactText}>+92 123 4567890</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  container: {
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  placeholderButton: {
    width: 40,
  },

  // Hero Section
  heroContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  heroText: {
    fontSize: 14,
    color: '#e8f5e9',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },

  // Feedback Type
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  typeCardActive: {
    borderColor: '#2d6a4f',
    backgroundColor: '#f0f4f1',
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  typeLabelActive: {
    color: '#2d6a4f',
  },

  // Rating
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  starButton: {
    padding: 4,
  },

  // Form
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    height: 140,
    paddingTop: 16,
  },

  // Submit Button
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2d6a4f',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Contact Section
  contactSection: {
    marginHorizontal: 20,
    marginTop: 32,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
  },
});

export default Feedback;