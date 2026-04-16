import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import BottomNav from '../../assets/components/BottomNav';
import AsyncStorage from '@react-native-async-storage/async-storage';
import KeyboardAwareContainer from '../../assets/components/KeyboardAwareContainer';
import { LinearGradient } from 'expo-linear-gradient';
import NotificationBell from '../../assets/components/NotificationBell';

const API_URL = 'http://192.168.100.2:5000';
const offensiveWords = [ "badword", "ugly", "offensive", "stupid", "idiot", "dumb", "fool", "moron", "trash",
  "nonsense", "hate", "disgusting", "gross", "useless", "shut up", "kill", "crazy", "jerk",
  "loser", "weird", "lame", "suck", "damn", "hell", "bastard", "crap", "asshole", "nasty",
  "pathetic", "freak", "dumbass", "psycho", "toxic", "lazy", "worthless"]

// ✅ Cloudinary Configuration - Same as in UploadReport
const CLOUDINARY_CLOUD_NAME = 'dlkjgegss';

// Health status dot color helper
const getHealthDotColor = (healthStatus) => {
  if (!healthStatus) return '#aaa';
  const status = healthStatus.toLowerCase();
  if (status === 'healthy') return '#22c55e';
  if (status === 'sick' || status === 'hungry') return '#eab308';
  if (status === 'injured') return '#ef4444';
  return '#aaa';
};

const ReportsFeed = () => {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [error, setError] = useState(null);
  const [currentUsername, setCurrentUsername] = useState(null);
  const [failedImages, setFailedImages] = useState({});

  useEffect(() => { 
    fetchReports();
    getCurrentUsername();
  }, []);
  
  useFocusEffect(React.useCallback(() => { 
    fetchReports();
    getCurrentUsername();
  }, []));

  const getCurrentUsername = async () => {
    try {
      const username = await AsyncStorage.getItem('username');
      setCurrentUsername(username);
      console.log('Current logged-in user:', username);
    } catch (error) {
      console.error('Error getting username:', error);
    }
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    return imageUrl;
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/reports`);
      if (!res.ok) throw new Error(`Failed to fetch reports: ${res.status}`);
      const data = await res.json();
      
      console.log('Fetched reports:', data.length);
      data.forEach((report, index) => {
        console.log(`Report ${index + 1}:`, {
          id: report._id,
          species: report.specieName,
          imageUrl: report.image ? report.image.substring(0, 50) + '...' : 'none',
          isCloudinary: report.image?.includes('cloudinary.com') ? '✅ Yes' : '❌ No'
        });
      });
      
      if (Array.isArray(data)) {
        const processedReports = data.map((r) => ({
          ...r,
          image: r.image,
          comments: r.comments || [],
          pinnedComment: r.pinnedComment || null,
          newComment: "",
        }));
        setReports(processedReports);
        setFailedImages({});
      } else setReports([]);
    } catch (err) {
      setError(err.message || 'Failed to load reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (reportId) => {
    console.log('Image failed to load for report:', reportId);
    setFailedImages(prev => ({ ...prev, [reportId]: true }));
  };

  const handleAddComment = async (reportId) => {
    const updated = [...reports];
    const report = updated.find((r) => r._id === reportId);
    const commentText = report.newComment.trim();
    if (!commentText) return;

    const isOffensive = offensiveWords.some((w) =>
      commentText.toLowerCase().includes(w)
    );
    if (isOffensive) {
      Alert.alert("Inappropriate Content", "Your comment contains inappropriate words.");
      return;
    }

    let userId = 'anonymous';
    let username = 'Community User';
    try {
      const [storedUserId, storedUsername] = await Promise.all([
        AsyncStorage.getItem('userId'),
        AsyncStorage.getItem('username'),
      ]);
      if (storedUserId) userId = storedUserId;
      if (storedUsername) username = storedUsername;
    } catch {}

    const localComment = {
      id: Date.now().toString(),
      text: commentText,
      user: username,
      time: new Date().toLocaleString(),
    };
    report.comments.unshift(localComment);
    report.newComment = "";
    setReports(updated);

    const serverComment = {
      text: commentText,
      user: username,
      userId,
      timestamp: new Date().toISOString(),
      pinned: false,
    };

    try {
      await fetch(`${API_URL}/api/reports/${reportId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serverComment),
      });
      fetchReports();
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  };

  const isReportOwner = (reportUsername) => {
    return currentUsername && reportUsername && 
           currentUsername.toLowerCase() === reportUsername.toLowerCase();
  };

  const handlePinComment = async (reportId, reportUsername, comment) => {
    if (!isReportOwner(reportUsername)) {
      Alert.alert("Unauthorized", "Only the report owner can pin comments.", [{ text: "OK" }]);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/reports/${reportId}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      });
      if (response.ok) {
        fetchReports();
      } else {
        Alert.alert("Error", "Failed to pin comment");
      }
    } catch (e) {
      console.error('Failed to pin comment', e);
      Alert.alert("Error", "Failed to pin comment");
    }
  };

  const handleUnpinComment = async (reportId, reportUsername) => {
    if (!isReportOwner(reportUsername)) {
      Alert.alert("Unauthorized", "Only the report owner can unpin comments.", [{ text: "OK" }]);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/reports/${reportId}/unpin`, { method: 'POST' });
      if (response.ok) {
        fetchReports();
      } else {
        Alert.alert("Error", "Failed to unpin comment");
      }
    } catch (e) {
      console.error('Failed to unpin comment', e);
      Alert.alert("Error", "Failed to unpin comment");
    }
  };

  const filtered = useMemo(() => {
    if (!searchText.trim()) return reports;
    return reports.filter((r) =>
      r.specieName.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, reports]);

  const PlaceholderImage = () => (
    <View style={[styles.image, styles.placeholderImage]}>
      <Ionicons name="image-outline" size={50} color="#ccc" />
      <Text style={styles.placeholderText}>Image unavailable</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAwareContainer>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/HomeScreen')} style={styles.menuButton}>
            <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Reports Feed</Text>
            <Text style={styles.headerSubtitle}>Community Insights</Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => router.push("/(tabs)/ReportsHistory")} style={styles.iconButton}>
              <Ionicons name="document-text-outline" size={22} color="#1a1a1a" />
            </TouchableOpacity>
            <NotificationBell color="#1a1a1a" />
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#777" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search animal species..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {loading && reports.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.loadingText}>Loading reports...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#c62828" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchReports}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.centerContainer}>
              <Ionicons name="document-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchText.trim() ? 'No reports match your search' : 'No reports yet'}
              </Text>
              {searchText.trim() && (
                <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearSearchButton}>
                  <Text style={styles.clearSearchButtonText}>Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              nestedScrollEnabled={true}
              refreshControl={
                <RefreshControl refreshing={loading && reports.length > 0} onRefresh={fetchReports} />
              }
              renderItem={({ item }) => {
                const canPinUnpin = isReportOwner(item.username);
                const imageUrl = getImageUrl(item.image);
                const hasImageFailed = failedImages[item._id];
                const healthDotColor = getHealthDotColor(item.healthStatus);
                const locationText = item.location
                  ? (item.location.address
                      ? item.location.address
                      : `${item.location.latitude?.toFixed(3)}, ${item.location.longitude?.toFixed(3)}`)
                  : null;

                return (
                  <View style={styles.card}>

                    {/* ── Image with overlay badges ── */}
                    <View style={styles.imageContainer}>
                      {item.image && !hasImageFailed ? (
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.image}
                          onError={() => handleImageError(item._id)}
                          onLoad={() => console.log('✅ Image loaded:', item._id)}
                        />
                      ) : item.image && hasImageFailed ? (
                        <PlaceholderImage />
                      ) : (
                        <View style={[styles.image, styles.placeholderImage]}>
                          <Ionicons name="image-outline" size={50} color="#ccc" />
                          <Text style={styles.placeholderText}>No image</Text>
                        </View>
                      )}

                     {/* Smooth gradient overlay */}
                     <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.75)']}
                      style={styles.imageGradientOverlay}/>

                      {/* Top-left badges */}
                      <View style={styles.imageBadgesRow}>
                        {/* Health status badge with dot */}
                        <View style={styles.badge}>
                          <View style={[styles.healthDot, { backgroundColor: healthDotColor }]} />
                          <Text style={styles.badgeText}>{item.healthStatus?.toUpperCase()}</Text>
                        </View>
                        
                      </View>

                      {/* Bottom overlay: species name + location | timestamp */}
                      <View style={styles.imageBottomOverlay}>
                        <Text style={styles.speciesName}>{item.specieName}</Text>
                        {(locationText || item.timestamp) && (
                          <View style={styles.imageDetailRow}>
                            {locationText && (
                              <>
                                <Ionicons name="location-outline" size={9} color="#fff" />
                                <Text style={styles.imageDetailText} numberOfLines={1}>{locationText}</Text>
                              </>
                            )}
                            {locationText && item.timestamp && (
                              <Text style={styles.imageDetailSeparator}> | </Text>
                            )}
                            {item.timestamp && (
                              <Text style={styles.imageDetailText} numberOfLines={1}>{item.timestamp}</Text>
                            )}
                          </View>
                        )}
                      </View>
                    </View>

                    {/* ── Card body ── */}
                    <View style={styles.cardBody}>

                      {/* Reported by row */}
                      <View style={styles.reporterRow}>
                        <Image
                          source={{ uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
                          style={styles.avatar}
                        />
                        <Text style={styles.reporterText}>
                          Reported by <Text style={styles.reporterName}>{item.username}</Text>
                        </Text>
                        {canPinUnpin && (
                          <View style={styles.ownerBadge}>
                            <Text style={styles.ownerBadgeText}>Owner</Text>
                          </View>
                        )}
                      </View>

                      {/* Comments section */}
                      <View style={styles.commentsBox}>
                        <Text style={styles.commentTitle}>Comments</Text>

                        {/* Pinned Comment */}
                        {item.pinnedComment && (
                          <View style={styles.pinnedCommentRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.commentUser}>
                                {item.pinnedComment.user}{' '}
                                <Text style={styles.pinnedLabel}>(Pinned)</Text>
                              </Text>
                              <Text style={styles.commentText}>{item.pinnedComment.text}</Text>
                            </View>
                            {canPinUnpin && (
                              <TouchableOpacity onPress={() => handleUnpinComment(item._id, item.username)}>
                                <Ionicons name="pin" size={18} color="#b45309" />
                              </TouchableOpacity>
                            )}
                          </View>
                        )}

                        {/* Comment Input */}
                        <View style={styles.commentInputBox}>
                          <TextInput
                            style={styles.commentInput}
                            placeholder="Write a comment..."
                            value={item.newComment}
                            onChangeText={(t) => {
                              const newList = reports.map((r) =>
                                r._id === item._id ? { ...r, newComment: t } : r
                              );
                              setReports(newList);
                            }}
                          />
                          <TouchableOpacity onPress={() => handleAddComment(item._id)} style={styles.sendBtn}>
                            <Ionicons name="send" size={18} color="#1a1a1a" />
                          </TouchableOpacity>
                        </View>

                        {/* Other Comments */}
                        {item.comments
                          .filter((c) => {
                            if (!item.pinnedComment) return true;
                            const pcId = item.pinnedComment._id || item.pinnedComment.id;
                            const cId = c._id || c.id;
                            return cId !== pcId;
                          })
                          .map((c) => (
                            <View key={c._id || c.id} style={styles.commentItem}>
                              <Ionicons name="person-circle-outline" size={22} color="#aaa" />
                              <View style={{ marginLeft: 8, flex: 1 }}>
                                <Text style={styles.commentUser}>{c.user}</Text>
                                <Text style={styles.commentText}>{c.text}</Text>
                              </View>
                              {canPinUnpin && (
                                <TouchableOpacity onPress={() => handlePinComment(item._id, item.username, c)}>
                                  <Ionicons name="pin-outline" size={18} color="#ccc" />
                                </TouchableOpacity>
                              )}
                            </View>
                          ))}
                      </View>
                    </View>
                  </View>
                );
              }}
              contentContainerStyle={{ paddingBottom: 70 }}
            />
          )}
        </KeyboardAvoidingView>

        <BottomNav onHomePress={() => router.push("/(tabs)/HomeScreen")} />
      </KeyboardAwareContainer>
    </SafeAreaView>
  );
};

export default ReportsFeed;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1 },

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
  menuButton: { 
    width: 40, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerCenter: { 
    flex: 1, 
    alignItems: 'center' 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#1a1a1a' 
  },
  headerSubtitle: { 
    fontSize: 12, 
    color: '#666', 
    marginTop: 2 
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
    margin: 12,
    paddingHorizontal: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#d6d9d78a',
  },
  searchInput: { flex: 1, padding: 10, marginLeft: 6, color: '#1a1a1a' },

  // Card
  card: {
    backgroundColor: '#fff',
    marginBottom: 15,
    marginHorizontal: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  // Image section
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 320,
  },
  image: { width: '100%', height: 320 },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { marginTop: 8, color: '#aaa', fontSize: 13 },

  // Dark gradient overlay (simulated)
  imageGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },

  // Top badges
  imageBadgesRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  healthDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Bottom overlay (species + location + time)
  imageBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  speciesName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '750',
    letterSpacing: 0.3,
  },
  imageDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    flexWrap: 'nowrap',
  },
  imageDetailText: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 2,
    flexShrink: 1,
  },
  imageDetailSeparator: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginHorizontal: 2,
  },

  // Card body
  cardBody: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },

  // Reporter row
  reporterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  avatar: { width: 24, height: 24, borderRadius: 12 },
  reporterText: { fontSize: 12, color: '#666', flex: 1 },
  reporterName: { fontWeight: '600', color: '#333' },
  ownerBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  ownerBadgeText: { fontSize: 10, fontWeight: '600', color: '#000' },

  // Comments box
  commentsBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ebebeb',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  commentTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },

  // Pinned comment (no box, just a plain row)
  pinnedCommentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 8,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  // Comment input
  commentInputBox: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingLeft: 14,
    paddingVertical: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ececec',
    marginBottom: 6,
  },
  commentInput: { flex: 1, padding: 8, fontSize: 13, color: '#1a1a1a' },
  sendBtn: { padding: 8, paddingRight: 10 },

  // Comment items
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#f0f0f0',
  },
  commentUser: { fontWeight: '700', fontSize: 12, color: '#333' },
  pinnedLabel: { color: '#b45309', fontSize: 11, fontWeight: '600' },
  commentText: { color: '#555', marginTop: 2, fontSize: 12 },

  // States
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { fontSize: 16, color: '#666', marginTop: 10 },
  errorText: { fontSize: 16, color: '#ff6b6b', textAlign: 'center', marginTop: 10, marginBottom: 20 },
  retryButton: { backgroundColor: '#FFD700', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptyText: { fontSize: 16, color: '#999', textAlign: 'center', marginTop: 10 },
  clearSearchButton: { marginTop: 15, paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#f0f0f0', borderRadius: 8 },
  clearSearchButtonText: { color: '#000', fontSize: 14, fontWeight: '500' },
});
