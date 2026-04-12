import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Aboutus = () => {
  const router = useRouter();
  const [userType, setUserType] = useState('community'); // default to community
  
  // Load user type on mount
  useEffect(() => {
    const loadUserType = async () => {
      try {
        const type = await AsyncStorage.getItem('userType');
        if (type) {
          setUserType(type);
        }
      } catch (error) {
        console.log('Error loading user type:', error);
      }
    };
    
    loadUserType();
  }, []);
  
  // Determine which home screen to navigate back to
  const handleBackPress = async () => {
    try {
      // Get the latest user type
      const type = await AsyncStorage.getItem('userType');
      
      if (type === 'researcher') {
        router.push('/(tabs)/HomeScreenR');
      } else {
        router.push('/(tabs)/HomeScreen');
      }
    } catch (error) {
      console.log('Navigation error:', error);
      // Default to community home screen
      router.push('/(tabs)/HomeScreen');
    }
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:wildynnorth@gmail.com');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Hero Section */}
        <LinearGradient
          colors={['#1b4332', '#2d6a4f']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroContainer}
        >
          <Ionicons name="leaf-outline" size={64} color="#FFD700" />
          <Text style={styles.heroTitle}>Wildlife Conservation Platform</Text>
          <Text style={styles.heroSubtitle}>
            Empowering communities to protect Pakistan's endangered species
          </Text>
        </LinearGradient>

        {/* Mission Statement */}
        <View style={styles.contentSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconWrapper}>
              <Ionicons name="flag-outline" size={24} color="#2d6a4f" />
            </View>
            <Text style={styles.sectionTitle}>Our Mission</Text>
          </View>
          <Text style={styles.bodyText}>
            We are dedicated to the conservation and protection of endangered wildlife across Pakistan through community-driven reporting and data collection. Our platform bridges the gap between local communities, researchers, and conservation authorities to create a unified effort in preserving our natural heritage.
          </Text>
        </View>

        {/* What We Do */}
        <View style={styles.contentSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconWrapper}>
              <Ionicons name="briefcase-outline" size={24} color="#2d6a4f" />
            </View>
            <Text style={styles.sectionTitle}>What We Do</Text>
          </View>
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>Enable community members to report wildlife sightings and activities</Text>
          </View>
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>Provide researchers with real-time data for conservation studies</Text>
          </View>
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>Facilitate collaboration between citizens and conservation authorities</Text>
          </View>
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>Track and monitor endangered species populations across regions</Text>
          </View>
        </View>

        {/* Our Vision */}
        <View style={styles.contentSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconWrapper}>
              <Ionicons name="eye-outline" size={24} color="#2d6a4f" />
            </View>
            <Text style={styles.sectionTitle}>Our Vision</Text>
          </View>
          <Text style={styles.bodyText}>
            A Pakistan where wildlife thrives in harmony with communities, where every citizen contributes to conservation efforts, and where data-driven insights lead to effective protection of our endangered species for future generations.
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <View style={styles.contactHeader}>
            <Ionicons name="mail-outline" size={32} color="#2d6a4f" />
            <Text style={styles.contactTitle}>Get In Touch</Text>
          </View>
          <Text style={styles.contactDescription}>
            Have questions, feedback, or want to collaborate? We'd love to hear from you.
          </Text>
          
          <TouchableOpacity style={styles.emailButton} onPress={handleEmailPress}>
            <Ionicons name="mail" size={20} color="#000" />
            <Text style={styles.emailText}>wildynnorth@gmail.com</Text>
          </TouchableOpacity>

          <View style={styles.contactInfo}>
            <View style={styles.infoItem}>
              <Ionicons name="help-circle-outline" size={20} color="#666" />
              <Text style={styles.infoText}>General Inquiries & Support</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="chatbubble-outline" size={20} color="#666" />
              <Text style={styles.infoText}>Feedback & Suggestions</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="people-outline" size={20} color="#666" />
              <Text style={styles.infoText}>Partnership Opportunities</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Together, we protect Pakistan's wildlife
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    paddingBottom: 40,
  },
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  heroContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#e8f5e9',
    textAlign: 'center',
    lineHeight: 22,
  },
  contentSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f7f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  bodyText: {
    fontSize: 15,
    color: '#4a4a4a',
    lineHeight: 24,
    textAlign: 'justify',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD700',
    marginTop: 8,
    marginRight: 12,
  },
  listText: {
    flex: 1,
    fontSize: 15,
    color: '#4a4a4a',
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 20,
    marginVertical: 16,
  },
  contactSection: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  contactHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 12,
  },
  contactDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  contactInfo: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  footer: {
    marginTop: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
});

export default Aboutus;