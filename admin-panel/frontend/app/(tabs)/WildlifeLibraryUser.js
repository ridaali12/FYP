import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../../components/BottomNav';
import AsyncStorage from '@react-native-async-storage/async-storage';

// SpeciesCard component for navigation (without delete button)
const SpeciesCard = ({ species, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: species.imageUri || 'https://via.placeholder.com/400x300' }} 
        style={styles.image} 
      />
      <View style={styles.cardContent}>
        <Text style={styles.name}>{species.commonName}</Text>
        {species.scientificName && (
          <Text style={styles.scientificName}>{species.scientificName}</Text>
        )}
        {species.urduName && (
          <Text style={styles.urduName}>{species.urduName}</Text>
        )}
        {species.conservationStatus && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{species.conservationStatus}</Text>
          </View>
        )}
        <View style={styles.viewMore}>
          <Text style={styles.viewMoreText}>View Details</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFD700" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function WildlifeLibraryUser() {
  const router = useRouter();
  const [facts, setFacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load wildlife data from AsyncStorage
  const loadWildlifeData = async () => {
    try {
      setLoading(true);
      const data = await AsyncStorage.getItem('wildlifeCards');
      if (data) {
        const wildlifeCards = JSON.parse(data);
        setFacts(wildlifeCards);
      } else {
        setFacts([]);
      }
    } catch (error) {
      console.error('Error loading wildlife data:', error);
      setFacts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadWildlifeData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadWildlifeData();
  };

  // Navigate to species detail with source parameter
  const navigateToSpeciesDetail = (species) => {
    try {
      router.push({
        pathname: '/(tabs)/SpeciesDetail',
        params: {
          species: JSON.stringify(species),
          source: 'library' // This tells SpeciesDetail it's from HomeScreen (no edit/delete buttons)
        }
      });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/HomeScreen')}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wildlife Library</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Loading wildlife data...</Text>
            </View>
          ) : facts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="library-outline" size={80} color="#ccc" />
              <Text style={styles.emptyTitle}>No Wildlife Data</Text>
              <Text style={styles.emptyText}>
                No wildlife information has been uploaded yet. Check back soon!
              </Text>
            </View>
          ) : (
            facts.map((item) => (
              <SpeciesCard
                key={item._id}
                species={item}
                onPress={() => navigateToSpeciesDetail(item)}
              />
            ))
          )}
        </ScrollView>

        {/* Bottom Navigation */}
        <BottomNav />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#f2f2f2' 
  },
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: 15,
    paddingBottom: 80,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
  },
  cardContent: {
    padding: 15,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 8,
    color: '#1a1a1a',
  },
  scientificName: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 4,
  },
  urduName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2E7D32',
  },
  viewMore: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  viewMoreText: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
    marginRight: 5,
  },
});