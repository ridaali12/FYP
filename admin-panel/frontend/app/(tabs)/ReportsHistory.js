import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import BottomNav from "../../components/BottomNav";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";


const API_URL = "http://192.168.109.181:5000";

const ReportsHistory = () => {
  const router = useRouter();
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchMyReports();
    }, [])
  );

  const fetchMyReports = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'Please login to view your reports');
        return;
      }
     const response = await fetch(`${API_URL}/api/reports/myreports/${userId}`);
      const data = await response.json();
      if (response.ok) setMyReports(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePinComment = async (reportId, comment) => {
    try {
      await fetch(`${API_URL}/api/reports/${reportId}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      });
      fetchMyReports();
    } catch (e) {
      console.error('Failed to pin comment', e);
    }
  };

  const handleUnpinComment = async (reportId) => {
    try {
      await fetch(`${API_URL}/api/reports/${reportId}/unpin`, {
        method: 'POST',
      });
      fetchMyReports();
    } catch (e) {
      console.error('Failed to unpin comment', e);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Delete Report",
      "Are you sure you want to delete this report?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/reports/${id}`, {
                method: "DELETE",
              });
              if (response.ok) {
                setMyReports(myReports.filter((r) => r._id !== id));
                Alert.alert("Deleted", "Report removed successfully.");
              } else {
                Alert.alert("Error", "Failed to delete report.");
              }
            } catch (error) {
              Alert.alert("Error", "Something went wrong.");
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          }}
          style={styles.profile}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>

        {/* Delete Button */}
        <TouchableOpacity onPress={() => handleDelete(item._id)}>
          <Ionicons name="trash-outline" size={22} color="red" />
        </TouchableOpacity>
      </View>

      {item.image && (
        <Image source={{ uri: item.image }} style={styles.reportImage} />
      )}
      <Text style={styles.caption}>
        <Text style={{ fontWeight: "700" }}>{item.specieName}</Text> •{" "}
        {item.healthStatus}
      </Text>

      {/* Comments Section */}
      <Text style={styles.commentTitle}>Comments</Text>
      {item.pinnedComment && (
        <View style={[styles.commentItem, { backgroundColor: "#fff7da" }]}>
          <Ionicons name="pin" size={18} color="grey" />
          <View style={{ marginLeft: 8, flex: 1 }}>
            <Text style={styles.commentUser}>{item.pinnedComment.user} (Pinned)</Text>
            <Text style={styles.commentText}>{item.pinnedComment.text}</Text>
          </View>
          <TouchableOpacity onPress={() => handleUnpinComment(item._id)}>
            <Ionicons name="pin" size={20} color="#b45309" />
          </TouchableOpacity>
        </View>
      )}

      {(item.comments || [])
        .filter((c) => (item.pinnedComment ? (c._id || c.id) !== (item.pinnedComment._id || item.pinnedComment.id) : true))
        .map((c) => (
          <View key={c._id || c.id} style={styles.commentItem}>
            <Ionicons name="person-circle-outline" size={24} color="#555" />
            <View style={{ marginLeft: 8, flex: 1 }}>
              <Text style={styles.commentUser}>{c.user}</Text>
              <Text style={styles.commentText}>{c.text}</Text>
            </View>
            <TouchableOpacity onPress={() => handlePinComment(item._id, c)}>
              <Ionicons name="pin-outline" size={20} color="grey" />
            </TouchableOpacity>
          </View>
        ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header with Back Arrow */}
      <View style={styles.headerBar}>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/HomeScreen')} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Reports</Text>
          <Text style={styles.headerSubtitle}>Your uploaded reports</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.container}>
        <FlatList
          data={myReports}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchMyReports} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>You haven't uploaded any reports yet.</Text>
          }
        />

        <View style={{ marginHorizontal: -10, marginBottom: -10 }}>
          <BottomNav onHomePress={() => router.push("/(tabs)/HomeScreen")} />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ReportsHistory;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9f9f9' },
  headerBar: {
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
  container: { flex: 1, backgroundColor: "#f9f9f9", padding: 10 },
  listContent: { paddingBottom: 80 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 15,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  profile: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  username: { fontWeight: "700" },
  timestamp: { fontSize: 12, color: "#777" },
  reportImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  caption: { fontSize: 15, color: "#333" },
  empty: { textAlign: "center", color: "#777", marginTop: 40 },
  commentTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginHorizontal: 12,
    marginTop: 6,
  },
  commentItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  commentUser: { fontWeight: "700" },
  commentText: { color: "#333", marginTop: 2 },
});