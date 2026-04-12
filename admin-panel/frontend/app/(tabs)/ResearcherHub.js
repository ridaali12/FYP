import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import BottomNav from '../../components/BottomNav';

export default function ResearcherHub() {
  const router = useRouter();

  const handleCardPress = (screen) => {
    router.push(screen);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/HomeScreenR')}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Researcher's Hub</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Manage surveys and wildlife data</Text>
        </View>

        {/* Cards Container */}
        <View style={styles.cardsContainer}>
          {/* Card 1 - Create Species Card */}
          <TouchableOpacity 
            style={styles.card}
            onPress={() => handleCardPress('/(tabs)/createcard')}
            activeOpacity={0.7}
          >
            <View style={[styles.cardIconContainer, { backgroundColor: '#fff3e0' }]}>
              <Ionicons name="pencil" size={32} color="#ef6c00" />
            </View>
            <Text style={styles.cardTitle}>Create Species Fact</Text>
            <Text style={styles.cardDescription}>
              Add new wildlife species to the database
            </Text>
            <View style={styles.cardAction}>
              <Text style={[styles.cardActionText, { color: '#2d6a4f' }]}>
                Get Started
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#2d6a4f" />
            </View>
          </TouchableOpacity>

          {/* Card 2 - Wildlife Library */}
          <TouchableOpacity 
            style={styles.card}
            onPress={() => handleCardPress('/(tabs)/WildlifeLibrary')}
            activeOpacity={0.7}
          >
            <View style={[styles.cardIconContainer, { backgroundColor: '#e3f2fd' }]}>
              <Ionicons name="library" size={32} color="#1565c0" />
            </View>
            <Text style={styles.cardTitle}>Wildlife Library</Text>
            <Text style={styles.cardDescription}>
              Browse comprehensive wildlife database
            </Text>
            <View style={styles.cardAction}>
              <Text style={[styles.cardActionText, { color: '#2d6a4f' }]}>
                Explore
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#2d6a4f" />
            </View>
          </TouchableOpacity>

          {/* Card 3 - Upload Survey Form */}
          <TouchableOpacity 
            style={styles.card}
            onPress={() => handleCardPress('/(tabs)/CreateSurvey')}
            activeOpacity={0.7}
          >
            <View style={[styles.cardIconContainer, { backgroundColor: '#e8f5e9' }]}>
              <Ionicons name="cloud-upload" size={32} color="#2d6a4f" />
            </View>
            <Text style={styles.cardTitle}>Upload Survey Form</Text>
            <Text style={styles.cardDescription}>
              Upload and share survey forms with the community
            </Text>
            <View style={styles.cardAction}>
              <Text style={[styles.cardActionText, { color: '#2d6a4f' }]}>
                Upload New
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#2d6a4f" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav active="ResLib" />
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
  container: {
    paddingBottom: 80,
  },
  introSection: {
    padding: 20,
    paddingTop: 30,
  },
  introTitle: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'left',
    fontWeight: 'light',
    marginLeft : 10,
    marginTop : -13,
    marginBottom :-13,
  },
  cardsContainer: {
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: '#2d6a4f',
  },
  cardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActionText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 5,
  },
});