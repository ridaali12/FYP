import React, { useRef, useState, useEffect } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from '../../components/BottomNav';

const API_URL = 'http://192.168.109.181:5000';

const { width } = Dimensions.get('window');

// ✅ All Facts
const factsData = [
  {
    title: 'Himalayan Brown Bear',
    text: "Himalayan Brown Bear (Deosai National Park) lives up to 20–30 years in the wild, but Pakistan's population is one of the smallest in the world.",
  },
  {
    title: 'Himalayan Ibex',
    text: 'Ibex is found at altitudes of about 3,660 to over 5,000 m in summer, descending to about 2,135 m in winter due to snow.',
  },
  {
    title: 'Markhor Population',
    text: 'The markhor population in Khyber-Pakhtunkhwa has risen to 5,621 individuals. Estimated population ~5,993 individuals per km² in surveyed blocks.',
  },
  {
    title: 'Grey Wolf',
    text: 'Within Pakistan, there may be only a few hundred grey wolves (Indian + Tibetan subspecies combined), many living in Gilgit-Baltistan and Khyber Pakhtunkhwa.',
  },
  {
    title: 'Markhor Recovery',
    text: 'Over the past ~30 years, the markhor population in Pakistan has more than doubled from fewer than ~2,500 in the 1990s to 5,000–6,000 in recent estimates.',
  },
];

const getDailyFact = () => {
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return factsData[dayIndex % factsData.length];
};

const HomeScreen = () => {
  const dailyFact = getDailyFact();
  const router = useRouter();

  // ✅ Sidebar animation
  const slideAnim = useRef(new Animated.Value(-width * 0.75)).current;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Profile image state
  const [profileImage, setProfileImage] = useState(null);
  const [totalReports, setTotalReports] = useState(0);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  const toggleSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: sidebarOpen ? -width * 0.75 : 0,
      duration: 300,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: false,
    }).start();
    setSidebarOpen(!sidebarOpen);
  };

  // Load profile image from storage
  const loadProfileImage = async () => {
    try {
      const savedProfileImage = await AsyncStorage.getItem('profileImage');
      if (savedProfileImage) {
        setProfileImage(savedProfileImage);
      }
    } catch (error) {
      console.log('Error loading profile image:', error);
    }
  };

  const loadReportCount = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reports`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setTotalReports(data.length);
    } catch (e) {
      // fail silently for count
    }
  };

  const loadUserProfile = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        try {
          const response = await fetch(`${API_URL}/api/auth/profile/${userId}`);
          const result = await response.json();
          if (response.ok && result.user) {
            setUsername(result.user.username || '');
            setEmail(result.user.email || '');
            await AsyncStorage.setItem('username', result.user.username || '');
            await AsyncStorage.setItem('userEmail', result.user.email || '');
            return;
          }
        } catch (_) {}
      }
      const savedUsername = await AsyncStorage.getItem('username');
      const savedEmail = await AsyncStorage.getItem('userEmail');
      if (savedUsername) setUsername(savedUsername);
      if (savedEmail) setEmail(savedEmail);
    } catch (_) {}
  };

  // Load profile image on component mount and when screen comes into focus
  useEffect(() => {
    const ensureCommunityUser = async () => {
      try {
        const userType = await AsyncStorage.getItem('userType');
        if (userType === 'researcher') {
          router.replace('/(tabs)/HomeScreenR');
          return;
        }
      } catch (_) {
        // Allow unauthenticated users to view Home
        return;
      }
    };

    ensureCommunityUser();
    loadProfileImage();
    loadReportCount();
    loadUserProfile();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadProfileImage();
      loadReportCount();
      loadUserProfile();
    }, [])
  );

  const handleLogout = async () => {
    try {
      // Clear all user data from AsyncStorage
      await AsyncStorage.multiRemove(['userId', 'username', 'userEmail', 'isLoggedIn', 'profileImage', 'userType']);
      toggleSidebar();
      // Navigate to Login screen and prevent going back
      router.replace('/(tabs)/Login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate to login even if clearing storage fails
      toggleSidebar();
      router.replace('/(tabs)/Login');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
          <Ionicons name="menu" size={26} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Community Portal</Text>
          <Text style={styles.headerSubtitle}>Wildlife Conservation</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/UserProfile')} style={styles.profileButton}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={{ width: 32, height: 32, borderRadius: 16 }} />
          ) : (
            <Ionicons name="person-circle-outline" size={32} color="#2d6a4f" />
          )}
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.container}>
        {/* Daily Insight Card */}
        <View style={styles.factWrapper}>
          <LinearGradient
            colors={['#1b4332', '#2d6a4f', '#40916c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.factContainer}
          >
            <View style={styles.factHeader}>
              <Ionicons name="leaf" size={28} color="#FFD700" />
              <Text style={styles.factBadge}>Fact of the Day</Text>
            </View>
            <Text style={styles.factTitle}>{dailyFact.title}</Text>
            <Text style={styles.factBody}>{dailyFact.text}</Text>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.actionCardsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/ReportsFeed')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#e8f5e9' }]}>
                <Ionicons name="document-text-outline" size={32} color="#2d6a4f" />
              </View>
              <Text style={styles.actionCardTitle}>View Reports</Text>
              <Text style={styles.actionCardSubtitle}>Community Feed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => console.log('View Map')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#e3f2fd' }]}>
                <MaterialCommunityIcons name="map" size={32} color="#1565c0" />
              </View>
              <Text style={styles.actionCardTitle}>View Map</Text>
              <Text style={styles.actionCardSubtitle}>Explore Sightings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upload New Report */}
        <View style={styles.section}>
          <View style={styles.uploadSection}>
            <Text style={styles.uploadTitle}>Upload new report</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/UploadReport')} style={styles.addButton}>
              <Ionicons name="add-circle" size={36} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Analytics Section */}
        <View style={styles.analyticsSection}>
          <Text style={styles.analyticsTitle}>Analytics</Text>

          <View style={styles.analyticsRow}>
            <Text style={styles.analyticsLabel}>Total Reports</Text>
            <Text style={styles.analyticsCount}>{totalReports}</Text>
          </View>

          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              style={styles.viewReportsButton}
              onPress={() => router.push("/(tabs)/ReportsHistory")}
            >
              <Ionicons name="document-text-outline" size={20} color="black" />
              <Text style={styles.viewReportsButtonText}> My Reports</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* --- Bottom Navigation Bar --- */}
      <BottomNav />

      {/* ✅ Sidebar Overlay */}
      {sidebarOpen && (
        <TouchableWithoutFeedback onPress={toggleSidebar}>
          <Animated.View 
            style={[
              styles.overlay,
              {
                opacity: slideAnim.interpolate({
                  inputRange: [-width * 0.75, 0],
                  outputRange: [0, 1],
                }),
              },
            ]}
          />
        </TouchableWithoutFeedback>
      )}

      {/* ✅ Sidebar Drawer */}
      <Animated.View style={[styles.sidebar, { left: slideAnim }]}>
        <View style={styles.sidebarHeader}>
          <View style={styles.sidebarProfile}>
            <Ionicons name="person-circle" size={60} color="#2d6a4f" />
            <Text style={styles.sidebarName}>{username || 'Community User'}</Text>
            <Text style={styles.sidebarEmail}>{email || ''}</Text>
          </View>
        </View>

        <View style={styles.sidebarContent}>
          <TouchableOpacity 
            style={styles.sidebarItem}
            onPress={() => {
              toggleSidebar();
              router.push('/(tabs)/ReportsHistory');
            }}
          >
            <View style={styles.sidebarIconWrapper}>
              <Ionicons name="document-text-outline" size={22} color="#2d6a4f" />
            </View>
            <Text style={styles.sidebarText}>Reports History</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => {
              toggleSidebar();
              router.push('/(tabs)/AwardsScreen');
            }}
          >
            <View style={styles.sidebarIconWrapper}>
              <Ionicons name="trophy-outline" size={22} color="#2d6a4f" />
            </View>
            <Text style={styles.sidebarText}>Awards & Badges</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => {
              toggleSidebar();
              router.push('/(tabs)/Aboutus');
            }}
          >
            <View style={styles.sidebarIconWrapper}>
              <Ionicons name="information-circle-outline" size={22} color="#2d6a4f" />
            </View>
            <Text style={styles.sidebarText}>About Us</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <View style={styles.sidebarDivider} />

          <TouchableOpacity style={styles.sidebarLogout} onPress={handleLogout}>
            <View style={[styles.sidebarIconWrapper, { backgroundColor: '#ffebee' }]}>
              <Ionicons name="log-out-outline" size={22} color="#c62828" />
            </View>
            <Text style={[styles.sidebarText, { color: '#c62828' }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f2f2f2' },
  container: { paddingBottom: 80 },

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
  menuButton: {
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
  profileButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  factWrapper: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  factContainer: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  factHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  factBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  factTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#fff', 
    marginBottom: 8,
  },
  factBody: { 
    fontSize: 14, 
    color: '#e8f5e9', 
    lineHeight: 22,
  },

  uploadSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  uploadTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
  addButton: { padding: 5 },

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
  actionCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 52) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  actionCardSubtitle: {
    fontSize: 12,
    color: '#666',
  },

  analyticsSection: {
    marginHorizontal: 15,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  analyticsTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  analyticsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  analyticsLabel: { fontSize: 16, color: '#555' },
  analyticsCount: { fontSize: 20, fontWeight: '600', color: '#333' },

  buttonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },

  viewReportsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    width: '100%',
  },
  
  viewReportsButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },

  // ✅ Sidebar styles
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: width * 0.75,
    backgroundColor: '#fff',
    elevation: 16,
    zIndex: 10,
  },
  sidebarHeader: {
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sidebarProfile: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  sidebarName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 12,
  },
  sidebarEmail: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  sidebarContent: {
    flex: 1,
    paddingTop: 16,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  sidebarIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f0f4f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sidebarText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
    marginHorizontal: 20,
  },
  sidebarLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
});

export default HomeScreen;