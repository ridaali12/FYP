import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationSystem } from '../hooks/useNotificationSystem';

const NotificationDemo = () => {
  const { 
    triggerBadgeUnlock, 
    triggerReportSubmission, 
    triggerInjuredAnimalAlert, 
    triggerSystemNotification 
  } = useNotificationSystem();

  const demoActions = [
    {
      title: '🚨 High Alert: Injured Animal',
      description: 'Triggers a high-priority red alert',
      action: () => triggerInjuredAnimalAlert(
        'Red Fox', 
        { latitude: 40.7128, longitude: -74.0060 }, 
        'report-123'
      ),
      color: '#FF5252',
    },
    {
      title: '✅ Normal Report',
      description: 'Triggers a normal green alert',
      action: () => triggerReportSubmission('Blue Jay'),
      color: '#4CAF50',
    },
    {
      title: '🏆 Badge Unlock',
      description: 'Triggers a badge unlock notification',
      action: () => triggerBadgeUnlock('Wildlife Photographer', 'Submitted 10 quality reports'),
      color: '#2196F3',
    },
    {
      title: '📢 System Notification',
      description: 'Triggers a general system notification',
      action: () => triggerSystemNotification('Welcome Back!', 'You have 3 new reports to review'),
      color: '#FF9800',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="notifications-outline" size={24} color="#1B5E20" />
        <Text style={styles.headerTitle}>Notification System Demo</Text>
      </View>
      
      <Text style={styles.description}>
        Test the alert system by triggering different types of notifications. 
        High alerts (red) will appear on top and have priority over normal alerts (green).
      </Text>

      <ScrollView style={styles.scrollView}>
        {demoActions.map((demo, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.actionCard, { borderLeftColor: demo.color }]}
            onPress={demo.action}
          >
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{demo.title}</Text>
              <Text style={styles.actionDescription}>{demo.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color="#2E7D32" />
        <Text style={styles.infoText}>
          Swipe any notification left or right to dismiss it. High alerts will always appear above normal alerts.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F4',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
  },
  infoBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#2E7D32',
    flex: 1,
    lineHeight: 16,
  },
});

export default NotificationDemo;
