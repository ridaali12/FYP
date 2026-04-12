import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../constants/api';

export default function VerificationStatus() {
  const router = useRouter();
  // immediately redirect to login; this screen is obsolete now that researchers are auto-approved
  useEffect(() => {
    router.replace('/(tabs)/Login');
  }, [router]);

  return null; // nothing to render

  // derive status flags early so hooks later can depend on them unconditionally
  const isVerified = researcherData?.verified === true;
  const isRejected = researcherData?.verified === false && researcherData?.rejectionReason;


  useEffect(() => {
    checkVerificationStatus();

    // start periodic polling in case admin approves while user is waiting
    const interval = setInterval(checkVerificationStatus, 30000); // every 30s
    return () => clearInterval(interval);
  }, []);

  const checkVerificationStatus = async () => {
    try {
      setLoading(true);
      setError('');

      // try query param first (guaranteed when coming directly from signup)
      let username = params.username;
      if (username) {
        console.log('VerificationStatus: received username via params ->', username);
      } else {
        // fallback to storage
        username = await AsyncStorage.getItem('username');
        console.log('VerificationStatus: loaded username from storage ->', username);
      }
      if (!username) {
        // try to recover from email or send user back to signup/login
        const email = await AsyncStorage.getItem('userEmail');
        console.warn('VerificationStatus: username value is empty or null, email stored:', email);
        setError('No researcher data found. Please login or register again.');
        setLoading(false);
        return;
      }

      // Fetch researcher verification status from backend
      const response = await fetch(`${API_URL}/api/auth/researcher/verification-status/${encodeURIComponent(username)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch verification status');
      }

      const researcher = await response.json();
      // if verification changed from pending to approved or rejected, optionally
      // notify user immediately
      setResearcherData(researcher);

      // trigger notification when status becomes final
      if (researcher.verified && !notified) {
        Alert.alert('Account Verified', 'Your researcher account has been approved. You can now log in.');
        setNotified(true);
      } else if (researcher.verified === false && researcher.rejectionReason && !notified) {
        Alert.alert('Verification Rejected', `Your verification has been rejected. Reason: ${researcher.rejectionReason}`, [
          { text: 'OK', onPress: () => router.replace('/(tabs)/EducationScreen') },
        ]);
        setNotified(true);
      }
    } catch (err) {
      console.error('Error checking verification status:', err);
      setError('Failed to check verification status. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    checkVerificationStatus();
  };

  const handleLogin = async () => {
    // Clear pending verification flag and try to login
    await AsyncStorage.removeItem('pendingVerification');
    router.replace('/(tabs)/Login');
  };

  // if the researcher becomes verified while this screen is mounted, automatically
  // redirect them to the login page after a short pause.  This saves them having to
  // tap the button and aligns with the requested behaviour.
  useEffect(() => {
    if (researcherData && researcherData.verified) {
      // show a brief alert and then navigate automatically
      Alert.alert(
        'Account Approved',
        'Your researcher account has been approved. Redirecting to login...',
        [
          {
            text: 'OK',
            onPress: () => {
              AsyncStorage.removeItem('pendingVerification');
              router.replace('/(tabs)/Login');
            },
          },
        ],
        { cancelable: false }
      );

      // as a fallback, also schedule automatic navigation in case the user dismisses
      // the alert or it doesn't show (e.g. during refresh cycle).
      const timer = setTimeout(async () => {
        await AsyncStorage.removeItem('pendingVerification');
        router.replace('/(tabs)/Login');
      }, 4000); // 4 seconds

      return () => clearTimeout(timer);
    }
  }, [researcherData, router]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2d6a4f" />
          <Text style={styles.loadingText}>Checking verification status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !researcherData) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={checkVerificationStatus}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification Status</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          {researcherData?.orcid && (
            <View style={styles.orcidRow}>
              <Text style={styles.orcidLabel}>ORCID:</Text>
              <Text style={styles.orcidValue}>{researcherData.orcid}</Text>
            </View>
          )}
          {isVerified ? (
            <>
              <View style={styles.statusIconContainerSuccess}>
                <Ionicons name="checkmark-circle" size={80} color="#4caf50" />
              </View>
              <Text style={styles.statusTitle}>Account Verified!</Text>
              <Text style={styles.statusMessage}>
                Your researcher qualifications have been verified by the admin. You can now log in
                to your account.
              </Text>
              {researcherData?.verifiedAt && (
                <Text style={styles.verifiedDate}>
                  Verified on: {new Date(researcherData.verifiedAt).toLocaleString()}
                </Text>
              )}
              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginButtonText}>Go to Login</Text>
              </TouchableOpacity>
            </>
          ) : isRejected ? (
            <>
              <View style={styles.statusIconContainerRejected}>
                <Ionicons name="close-circle" size={80} color="#f44336" />
              </View>
              <Text style={styles.statusTitleRejected}>Verification Rejected</Text>
              <Text style={styles.statusMessage}>
                Your researcher account verification has been rejected. Please review the reason
                below and update your information.
              </Text>
              <View style={styles.rejectionReasonBox}>
                <Text style={styles.rejectionReasonTitle}>Rejection Reason:</Text>
                <Text style={styles.rejectionReasonText}>
                  {researcherData.rejectionReason || 'No reason provided'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.updateButton}
                onPress={() => router.replace('/(tabs)/EducationScreen')}
              >
                <Text style={styles.updateButtonText}>Update Education Details</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.statusIconContainerPending}>
                <Ionicons name="time-outline" size={80} color="#ff9800" />
              </View>
              <Text style={styles.statusTitlePending}>Pending Verification</Text>
              <Text style={styles.statusMessage}>
                Your researcher account registration has been submitted successfully. Your
                educational qualifications are currently under review by the admin.
              </Text>
              <Text style={styles.pendingMessage}>
                You will be notified once your account has been verified. Please check back later
                or refresh this page.
              </Text>
            </>
          )}
        </View>

        {/* Education Details Card */}
        {researcherData?.education && (
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Educational Background</Text>
            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Ionicons name="school-outline" size={20} color="#666" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Highest Degree</Text>
                  <Text style={styles.detailValue}>
                    {researcherData.education.highestDegree}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="book-outline" size={20} color="#666" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Field of Study</Text>
                  <Text style={styles.detailValue}>
                    {researcherData.education.fieldOfStudy}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="business-outline" size={20} color="#666" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Institution</Text>
                  <Text style={styles.detailValue}>
                    {researcherData.education.institution}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Graduation Year</Text>
                  <Text style={styles.detailValue}>
                    {researcherData.education.graduationYear}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="star-outline" size={20} color="#666" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Specialization</Text>
                  <Text style={styles.detailValue}>
                    {researcherData.education.specialization}
                  </Text>
                </View>
              </View>

              {researcherData.education.certifications && (
                <View style={styles.detailRow}>
                  <Ionicons name="ribbon-outline" size={20} color="#666" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Certifications</Text>
                    <Text style={styles.detailValue}>
                      {researcherData.education.certifications}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Account Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Account Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Username:</Text>
            <Text style={styles.infoValue}>{researcherData?.username}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{researcherData?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Registered:</Text>
            <Text style={styles.infoValue}>
              {researcherData?.createdAt
                ? new Date(researcherData.createdAt).toLocaleString()
                : 'N/A'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  orcidRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  orcidLabel: {
    fontWeight: '600',
    marginRight: 8,
    fontSize: 16,
  },
  orcidValue: {
    fontSize: 16,
    color: '#444',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2d6a4f',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusIconContainerSuccess: {
    marginBottom: 16,
  },
  statusIconContainerPending: {
    marginBottom: 16,
  },
  statusIconContainerRejected: {
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4caf50',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusTitlePending: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ff9800',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusTitleRejected: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f44336',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  pendingMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  verifiedDate: {
    fontSize: 13,
    color: '#999',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#2d6a4f',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectionReasonBox: {
    backgroundColor: '#fff3f3',
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 20,
    width: '100%',
  },
  rejectionReasonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f44336',
    marginBottom: 8,
  },
  rejectionReasonText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  updateButton: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  detailsList: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});
