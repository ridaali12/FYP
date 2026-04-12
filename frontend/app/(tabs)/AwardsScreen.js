import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from '../../constants/api';
const { width } = Dimensions.get('window');

// Badge tiers configuration
const badgeTiers = [
  {
    id: 1,
    name: 'Wildlife Spotter',
    icon: 'eye',
    color: '#FFD700',
    gradient: ['#FFD700', '#B87333'],
    minReports: 1,
    maxReports: 4,
    description: 'First steps in conservation',
  },
  {
    id: 2,
    name: 'Nature Guardian',
    icon: 'shield-checkmark',
    color: '#C0C0C0',
    gradient: ['#C0C0C0', '#A8A8A8'],
    minReports: 5,
    maxReports: 9,
    description: 'Committed to wildlife protection',
  },
  {
    id: 3,
    name: 'Conservation Hero',
    icon: 'medal',
    color: '#FFD700',
    gradient: ['#FFD700', '#FFC700'],
    minReports: 10,
    maxReports: 19,
    description: 'Making a real difference',
  },
  {
    id: 4,
    name: 'Wildlife Champion',
    icon: 'trophy',
    color: '#4A90E2',
    gradient: ['#4A90E2', '#357ABD'],
    minReports: 20,
    maxReports: 49,
    description: 'Leading the conservation effort',
  },
  {
    id: 5,
    name: 'Eco Warrior',
    icon: 'star',
    color: '#9C27B0',
    gradient: ['#9C27B0', '#7B1FA2'],
    minReports: 50,
    maxReports: Infinity,
    description: 'Master of wildlife conservation',
  },
];

const AwardsScreen = () => {
  const router = useRouter();
  const [userReports, setUserReports] = useState(0);
  const [currentBadge, setCurrentBadge] = useState(null);
  const [nextBadge, setNextBadge] = useState(null);
  const [progress, setProgress] = useState(0);
  const [username, setUsername] = useState('');

  useEffect(() => {
    loadUserData();
    loadReportsCount();
  }, []);

  const loadUserData = async () => {
    try {
      const savedUsername = await AsyncStorage.getItem('username');
      if (savedUsername) setUsername(savedUsername);
    } catch (error) {
      console.log('Error loading username:', error);
    }
  };

  const loadReportsCount = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      const res = await fetch(`${API_URL}/api/reports`);
      if (!res.ok) return;
      
      const data = await res.json();
      const userReportsCount = data.filter(report => report.userId === userId).length;
      
      setUserReports(userReportsCount);
      calculateBadge(userReportsCount);
    } catch (error) {
      console.log('Error loading reports:', error);
    }
  };

  const calculateBadge = (reportsCount) => {
    // Find current badge
    const current = badgeTiers.find(
      badge => reportsCount >= badge.minReports && reportsCount <= badge.maxReports
    );
    
    // Find next badge
    const next = badgeTiers.find(
      badge => badge.minReports > reportsCount
    );

    setCurrentBadge(current || badgeTiers[0]);
    setNextBadge(next);

    // Calculate progress to next badge
    if (next) {
      const progressPercentage = ((reportsCount - (current?.minReports || 0)) / 
        (next.minReports - (current?.minReports || 0))) * 100;
      setProgress(Math.min(progressPercentage, 100));
    } else {
      setProgress(100);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/HomeScreen')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Awards & Badges</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Current Badge Section */}
        {currentBadge && (
          <View style={styles.currentBadgeWrapper}>
            <LinearGradient
              colors={currentBadge.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.currentBadgeContainer}
            >
              <View style={styles.badgeIconLarge}>
                <Ionicons name={currentBadge.icon} size={60} color="#fff" />
              </View>
              <Text style={styles.currentBadgeName}>{currentBadge.name}</Text>
              <Text style={styles.currentBadgeDesc}>{currentBadge.description}</Text>
              <View style={styles.reportsCountBadge}>
                <Text style={styles.reportsCountText}>{userReports} Reports</Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Progress to Next Badge */}
        {nextBadge && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Progress to Next Badge</Text>
              <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressSubtext}>
              {nextBadge.minReports - userReports} more reports to unlock{' '}
              <Text style={styles.nextBadgeName}>{nextBadge.name}</Text>
            </Text>
          </View>
        )}

        {/* All Badges Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Badges</Text>
          <View style={styles.badgesGrid}>
            {badgeTiers.map((badge) => {
              const isUnlocked = userReports >= badge.minReports;
              const isCurrentBadge = currentBadge?.id === badge.id;
              
              return (
                <View
                  key={badge.id}
                  style={[
                    styles.badgeCard,
                    !isUnlocked && styles.badgeCardLocked,
                    isCurrentBadge && styles.badgeCardCurrent,
                  ]}
                >
                  <View
                    style={[
                      styles.badgeIconSmall,
                      { backgroundColor: isUnlocked ? badge.color : '#e0e0e0' },
                    ]}
                  >
                    <Ionicons
                      name={badge.icon}
                      size={32}
                      color={isUnlocked ? '#fff' : '#999'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.badgeName,
                      !isUnlocked && styles.badgeNameLocked,
                    ]}
                  >
                    {badge.name}
                  </Text>
                  <Text
                    style={[
                      styles.badgeRequirement,
                      !isUnlocked && styles.badgeRequirementLocked,
                    ]}
                  >
                    {badge.minReports === badge.maxReports
                      ? `${badge.minReports}+ reports`
                      : badge.maxReports === Infinity
                      ? `${badge.minReports}+ reports`
                      : `${badge.minReports}-${badge.maxReports} reports`}
                  </Text>
                  {isCurrentBadge && (
                    <View style={styles.currentBadgeBadge}>
                      <Text style={styles.currentBadgeBadgeText}>Current</Text>
                    </View>
                  )}
                  {!isUnlocked && (
                    <View style={styles.lockedOverlay}>
                      <Ionicons name="lock-closed" size={20} color="#999" />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="document-text" size={28} color="#2d6a4f" />
              <Text style={styles.statValue}>{userReports}</Text>
              <Text style={styles.statLabel}>Total Reports</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={28} color="#FFD700" />
              <Text style={styles.statValue}>
                {badgeTiers.filter(b => userReports >= b.minReports).length}
              </Text>
              <Text style={styles.statLabel}>Badges Earned</Text>
            </View>
          </View>
        </View>

        {/* Motivational Message */}
        <View style={styles.motivationCard}>
          <Ionicons name="leaf" size={24} color="#2d6a4f" />
          <Text style={styles.motivationText}>
            Keep reporting wildlife sightings to earn more badges and contribute to conservation!
          </Text>
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
    paddingBottom: 30,
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
  currentBadgeWrapper: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  currentBadgeContainer: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  badgeIconLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  currentBadgeName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  currentBadgeDesc: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  reportsCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  reportsCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  progressSection: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d6a4f',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2d6a4f',
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: 13,
    color: '#666',
  },
  nextBadgeName: {
    fontWeight: '600',
    color: '#2d6a4f',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeCard: {
    width: (width - 52) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  badgeCardLocked: {
    opacity: 0.6,
  },
  badgeCardCurrent: {
    borderWidth: 2,
    borderColor: '#2d6a4f',
  },
  badgeIconSmall: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeNameLocked: {
    color: '#999',
  },
  badgeRequirement: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  badgeRequirementLocked: {
    color: '#999',
  },
  currentBadgeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#2d6a4f',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentBadgeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  motivationCard: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 20,
    backgroundColor: '#e8f5e9',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  motivationText: {
    flex: 1,
    fontSize: 13,
    color: '#1b5e20',
    lineHeight: 20,
    marginLeft: 12,
  },
});

export default AwardsScreen;