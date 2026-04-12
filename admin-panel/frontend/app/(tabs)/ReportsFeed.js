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
import BottomNav from "../../components/BottomNav";
import AsyncStorage from '@react-native-async-storage/async-storage';
import KeyboardAwareContainer from "../../components/KeyboardAwareContainer";

const API_URL = 'http://192.168.109.181:5000';
const offensiveWords = [ "badword", "ugly", "offensive", "stupid", "idiot", "dumb", "fool", "moron", "trash",
  "nonsense", "hate", "disgusting", "gross", "useless", "shut up", "kill", "crazy", "jerk",
  "loser", "weird", "lame", "suck", "damn", "hell", "bastard", "crap", "asshole", "nasty",
  "pathetic", "freak", "dumbass", "psycho", "toxic", "lazy", "worthless"]

const ReportsFeed = () => {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [error, setError] = useState(null);
  const [currentUsername, setCurrentUsername] = useState(null);

  useEffect(() => { 
    fetchReports();
    getCurrentUsername();
  }, []);
  
  useFocusEffect(React.useCallback(() => { 
    fetchReports();
    getCurrentUsername();
  }, []));

  // Get current logged-in username
  const getCurrentUsername = async () => {
    try {
      const username = await AsyncStorage.getItem('username');
      setCurrentUsername(username);
      console.log('Current logged-in user:', username);
    } catch (error) {
      console.error('Error getting username:', error);
    }
  };

  // Helper function to normalize image URL
  const normalizeImageUrl = (imageUrl) => {
    if (!imageUrl) {
      console.log('No image URL provided');
      return null;
    }
    
    console.log('Original image URL:', imageUrl);
    
    // If it's already a complete URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      console.log('Image is full URL:', imageUrl);
      return imageUrl;
    }
    
    // If it's a base64 string, return as is
    if (imageUrl.startsWith('data:image')) {
      console.log('Image is base64');
      return imageUrl;
    }
    
    // If it's a relative path, prepend the API_URL
    if (imageUrl.startsWith('/')) {
      const fullUrl = `${API_URL}${imageUrl}`;
      console.log('Image is relative path, converted to:', fullUrl);
      return fullUrl;
    }
    
    // If it's just a filename or partial path
    const fullUrl = `${API_URL}/${imageUrl}`;
    console.log('Image is filename, converted to:', fullUrl);
    return fullUrl;
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/reports`);
      if (!res.ok) throw new Error(`Failed to fetch reports: ${res.status}`);
      const data = await res.json();
      
      // Debug: Log the raw data to see image URLs
      console.log('Fetched reports:', data.length);
      data.forEach((report, index) => {
        console.log(`Report ${index + 1}:`, {
          id: report._id,
          species: report.specieName,
          hasImage: !!report.image,
          imageUrl: report.image,
          imageType: report.image ? (
            report.image.startsWith('data:') ? 'base64' : 
            report.image.startsWith('http') ? 'full URL' : 
            'relative path'
          ) : 'none'
        });
      });
      
      if (Array.isArray(data)) {
        const processedReports = data.map((r) => {
          const normalizedImage = normalizeImageUrl(r.image);
          console.log(`Processing report ${r._id}:`, {
            originalImage: r.image,
            normalizedImage: normalizedImage,
            species: r.specieName
          });
          
          return {
            ...r,
            // Keep original image URL without normalization for now
            image: r.image,
            comments: r.comments || [],
            pinnedComment: r.pinnedComment || null,
            newComment: "",
          };
        });
        setReports(processedReports);
      } else setReports([]);
    } catch (err) {
      setError(err.message || 'Failed to load reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
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

  // Check if current user is the report owner
  const isReportOwner = (reportUsername) => {
    return currentUsername && reportUsername && 
           currentUsername.toLowerCase() === reportUsername.toLowerCase();
  };

  const handlePinComment = async (reportId, reportUsername, comment) => {
    // Check if user is authorized to pin
    if (!isReportOwner(reportUsername)) {
      Alert.alert(
        "Unauthorized",
        "Only the report owner can pin comments.",
        [{ text: "OK" }]
      );
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
    // Check if user is authorized to unpin
    if (!isReportOwner(reportUsername)) {
      Alert.alert(
        "Unauthorized",
        "Only the report owner can unpin comments.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/reports/${reportId}/unpin`, { 
        method: 'POST' 
      });

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAwareContainer>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/HomeScreen')} style={styles.menuButton}>
            <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Reports Feed</Text>
            <Text style={styles.headerSubtitle}>Community Insights</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/ReportsHistory")} style={styles.profileButton}>
            <Ionicons name="document-text-outline" size={22} color="#000000ff" />
          </TouchableOpacity>
        </View>

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
                
                return (
                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Image
                        source={{ uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
                        style={styles.profile}
                      />
                      <View style={{ flex: 1 }}>
                        <View style={styles.usernameRow}>
                          <Text style={styles.username}>{item.username}</Text>
                          {canPinUnpin && (
                            <View style={styles.ownerBadge}>
                              <Text style={styles.ownerBadgeText}>Owner</Text>
                            </View>
                          )}
                        </View>
                        {item.location && (
                          <View style={styles.locationRow}>
                            <Ionicons name="location-outline" size={14} color="#777" style={{ marginRight: 3 }} />
                            <Text style={styles.location}>
                              {item.location.address
                                ? item.location.address
                                : `${item.location.latitude?.toFixed(3)}, ${item.location.longitude?.toFixed(3)}`}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.timestamp}>{item.timestamp}</Text>
                      </View>
                    </View>

                    {item.image && (
                      <Image 
                        source={{ uri: item.image }} 
                        style={styles.image}
                        onError={(e) => {
                          console.log('Image failed to load:', item._id, item.image);
                          console.log('Error:', e.nativeEvent.error);
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', item._id);
                        }}
                      />
                    )}
                    <Text style={styles.caption}>
                      <Text style={{ fontWeight: "700" }}>{item.specieName}</Text> • {item.healthStatus}
                    </Text>

                    <Text style={styles.commentTitle}>Comments</Text>
                    
                    {/* Pinned Comment */}
                    {item.pinnedComment && (
                      <View style={[styles.commentItem, styles.pinnedCommentBg]}>
                        <Ionicons name="pin" size={18} color="#b45309" />
                        <View style={{ marginLeft: 8, flex: 1 }}>
                          <Text style={styles.commentUser}>
                            {item.pinnedComment.user} <Text style={styles.pinnedLabel}>(Pinned)</Text>
                          </Text>
                          <Text style={styles.commentText}>{item.pinnedComment.text}</Text>
                        </View>
                        {canPinUnpin && (
                          <TouchableOpacity onPress={() => handleUnpinComment(item._id, item.username)}>
                            <Ionicons name="pin" size={20} color="#b45309" />
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
                        <Ionicons name="send" size={20} color="#1a5f3a" />
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
                          <Ionicons name="person-circle-outline" size={24} color="#555" />
                          <View style={{ marginLeft: 8, flex: 1 }}>
                            <Text style={styles.commentUser}>{c.user}</Text>
                            <Text style={styles.commentText}>{c.text}</Text>
                          </View>
                          {canPinUnpin && (
                            <TouchableOpacity onPress={() => handlePinComment(item._id, item.username, c)}>
                              <Ionicons name="pin-outline" size={20} color="grey" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
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
  safeArea: { flex: 1, backgroundColor: '#f9f9f9' },
  container: { flex: 1 },
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
  menuButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  headerSubtitle: { fontSize: 12, color: '#666', marginTop: 2 },
  profileButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f4ff',
    margin: 12,
    paddingHorizontal: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#d6d9d78a',
  },
  searchInput: { flex: 1, padding: 10, marginLeft: 6, color: '#1a1a1a' },
  card: {
    backgroundColor: '#fff',
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  profile: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  username: { fontWeight: "700" },
  ownerBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  ownerBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000',
  },
  location: { fontSize: 12, color: "#777" },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  timestamp: { fontSize: 12, color: "#777" },
  image: { width: '100%', height: 420 },
  caption: { paddingHorizontal: 12, paddingVertical: 8 },
  commentTitle: { fontSize: 15, fontWeight: "700", marginHorizontal: 12, marginTop: 6 },
  commentInputBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 12,
    borderRadius: 25,
    paddingLeft: 16,
    paddingVertical: 4,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
  },
  commentInput: { flex: 1, padding: 10, fontSize: 15, color: '#1a1a1a' },
  sendBtn: { backgroundColor: 'transparent', padding: 10, paddingRight: 12 },
  commentItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  pinnedCommentBg: {
    backgroundColor: "#fff7da",
  },
  commentUser: { fontWeight: "700" },
  pinnedLabel: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '600',
  },
  commentText: { color: "#333", marginTop: 2 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { fontSize: 16, color: '#666', marginTop: 10 },
  errorText: { fontSize: 16, color: '#ff6b6b', textAlign: 'center', marginTop: 10, marginBottom: 20 },
  retryButton: { backgroundColor: '#FFD700', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptyText: { fontSize: 16, color: '#999', textAlign: 'center', marginTop: 10 },
  clearSearchButton: { marginTop: 15, paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#f0f0f0', borderRadius: 8 },
  clearSearchButtonText: { color: '#000', fontSize: 14, fontWeight: '500' }
});