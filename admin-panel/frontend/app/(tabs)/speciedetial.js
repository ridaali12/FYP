import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from '../../components/BottomNav';

export default function SpeciesDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Parse the species data from params
  let species = null;
  try {
    if (params.species) {
      species = typeof params.species === 'string' 
        ? JSON.parse(params.species) 
        : params.species;
    }
  } catch (error) {
    console.error('Error parsing species data:', error);
  }

  if (!species) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/WildlifeLibrary')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Species Detail</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#2d6a4f" />
          <Text style={styles.errorText}>Species information not found</Text>
          <TouchableOpacity 
            style={styles.backToLibraryButton}
            onPress={() => router.push('/(tabs)/WildlifeLibrary')}
          >
            <Text style={styles.backToLibraryText}>Back to Library</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/WildlifeLibrary')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Species Detail</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image Section */}
        <View style={styles.imageContainer}>
          {species.imageUri ? (
            <Image 
              source={{ uri: species.imageUri }} 
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={60} color="#999" />
              <Text style={styles.imagePlaceholderText}>No Image Available</Text>
            </View>
          )}
        </View>

        {/* Main Content Card */}
        <View style={styles.mainCard}>
          {/* Title Section with Gradient */}
          <LinearGradient
            colors={['#1b4332', '#2d6a4f', '#40916c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.titleGradient}
          >
            <View style={styles.titleContent}>
              <Text style={styles.commonName}>{species.commonName || 'Unknown Species'}</Text>
              {species.scientificName && (
                <Text style={styles.scientificName}>{species.scientificName}</Text>
              )}
              {species.family && (
                <View style={styles.familyBadge}>
                  <Ionicons name="leaf-outline" size={14} color="#FFD700" />
                  <Text style={styles.familyText}>{species.family}</Text>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* Conservation Status */}
          {species.conservationStatus && (
            <View style={styles.statusSection}>
              <View style={styles.statusBadge}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#2d6a4f" />
                <Text style={styles.statusLabel}>Conservation Status</Text>
              </View>
              <Text style={styles.statusValue}>{species.conservationStatus}</Text>
            </View>
          )}

          {/* Description Section */}
          {species.description && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text-outline" size={20} color="#2d6a4f" />
                <Text style={styles.sectionTitle}>Description</Text>
              </View>
              <Text style={styles.sectionContent}>{species.description}</Text>
            </View>
          )}

          {/* Habitat Section */}
          {species.habitat && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="home-outline" size={20} color="#2d6a4f" />
                <Text style={styles.sectionTitle}>Habitat</Text>
              </View>
              <Text style={styles.sectionContent}>{species.habitat}</Text>
            </View>
          )}

          {/* Distribution Section */}
          {species.distribution && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="map-outline" size={20} color="#2d6a4f" />
                <Text style={styles.sectionTitle}>Distribution</Text>
              </View>
              <Text style={styles.sectionContent}>{species.distribution}</Text>
            </View>
          )}

          {/* Additional Info Section */}
          <View style={styles.infoGrid}>
            {species.family && (
              <View style={styles.infoItem}>
                <Ionicons name="leaf" size={24} color="#2d6a4f" />
                <Text style={styles.infoLabel}>Family</Text>
                <Text style={styles.infoValue}>{species.family}</Text>
              </View>
            )}
            {species.createdAt && (
              <View style={styles.infoItem}>
                <Ionicons name="calendar" size={24} color="#2d6a4f" />
                <Text style={styles.infoLabel}>Added</Text>
                <Text style={styles.infoValue}>
                  {new Date(species.createdAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f2f2',
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
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#fff',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 10,
    fontSize: 14,
    color: '#999',
  },
  mainCard: {
    backgroundColor: '#fff',
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  titleGradient: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  titleContent: {
    alignItems: 'flex-start',
  },
  commonName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  scientificName: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#e8f5e9',
    marginBottom: 12,
  },
  familyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  familyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFD700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2d6a4f',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d6a4f',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  sectionContent: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
    textAlign: 'justify',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    textAlign: 'center',
  },
  backToLibraryButton: {
    marginTop: 24,
    backgroundColor: '#FFD700',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backToLibraryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});