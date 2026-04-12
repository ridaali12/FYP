import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';

export default function CommunityNotificationsScreen() {
  const [isOffline, setIsOffline] = useState(false);

  const deliveredNotifications = [
    {
      id: '1',
      title: 'New sighting report submitted',
      description:
        'Your report has been shared with researchers and nearby community members for review.',
      status: 'delivered',
      timestamp: 'Just now',
    },
    {
      id: '2',
      title: 'New sighting from another user',
      description:
        'A community member reported a Markhor near your area. Researchers and community users have been notified.',
      status: 'delivered',
      timestamp: '15 min ago',
    },
    {
      id: '3',
      title: 'Researcher is reviewing your report',
      description: 'A researcher has opened your sighting and is validating the information.',
      status: 'delivered',
      timestamp: '2 min ago',
    },
  ];

  const queuedNotifications = [
    {
      id: 'q1',
      title: 'New sighting report (queued)',
      description:
        'You are currently offline. This alert will be sent automatically when the connection is restored.',
      status: 'queued',
      timestamp: 'Waiting for connection',
    },
  ];

  const toggleOffline = () => setIsOffline((prev) => !prev);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#E5F6FF', dark: '#052637' }}
      headerImage={
        <IconSymbol
          size={260}
          color={Colors.light.tint}
          name="bell.badge.fill"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleRow}>
          <ThemedText
            type="title"
            style={{ fontFamily: Fonts.rounded, flex: 1, flexWrap: 'wrap' }}>
            Community Notifications
          </ThemedText>
        </ThemedView>

        <ThemedText type="subtitle" style={styles.subtitle}>
          Real‑time alerts about new wildlife sighting reports.
        </ThemedText>

        {/* Both receive notification callout */}
        <ThemedView style={styles.calloutBox}>
          <IconSymbol name="person.2.fill" size={24} color={Colors.light.tint} style={styles.calloutIcon} />
          <View style={styles.calloutTextWrap}>
            <ThemedText type="defaultSemiBold" style={styles.calloutTitle}>
              Both receive notifications
            </ThemedText>
            <ThemedText style={styles.calloutBody}>
              When a new sighting is submitted, the system sends notifications to both researchers and community users so everyone stays informed.
            </ThemedText>
          </View>
        </ThemedView>

        {/* Scenario summary */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Scenario overview
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            When you submit a new sighting report, the system immediately notifies both researchers
            and nearby community users so that the sighting can be validated and acted on quickly.
          </ThemedText>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <View style={[styles.bulletDot, { backgroundColor: Colors.light.tint }]} />
              <ThemedText>Submit a new sighting report.</ThemedText>
            </View>
            <View style={styles.bulletItem}>
              <View style={[styles.bulletDot, { backgroundColor: Colors.light.tint }]} />
              <ThemedText>System broadcasts a notification to researchers and users.</ThemedText>
            </View>
            <View style={styles.bulletItem}>
              <View style={[styles.bulletDot, { backgroundColor: Colors.light.tint }]} />
              <ThemedText>Researchers review and validate the report.</ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Offline / queue banner */}
        <ThemedView
          style={[
            styles.banner,
            isOffline ? styles.bannerOffline : styles.bannerOnline,
          ]}>
          <IconSymbol
            name={isOffline ? 'wifi.exclamationmark' : 'wifi'}
            size={22}
            color={isOffline ? '#B42318' : '#0E7C3A'}
            style={styles.bannerIcon}
          />
          <View style={styles.bannerTextContainer}>
            <ThemedText type="defaultSemiBold">
              {isOffline
                ? 'Offline mode — alerts will be queued'
                : 'Online — alerts are delivered in real time'}
            </ThemedText>
            <ThemedText style={styles.bannerDescription}>
              {isOffline
                ? 'If the internet connection is lost, new notifications are queued and sent automatically once you are back online.'
                : 'You will receive a notification as soon as a new report is created or updated.'}
            </ThemedText>
          </View>
          <TouchableOpacity onPress={toggleOffline} style={styles.toggleButton}>
            <ThemedText type="defaultSemiBold" style={styles.toggleButtonText}>
              {isOffline ? 'Go online' : 'Simulate offline'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Delivered notifications */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Recent alerts
            </ThemedText>
            {deliveredNotifications.map((item) => (
              <ThemedView key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <IconSymbol
                    name="bell.fill"
                    size={20}
                    color={Colors.light.tint}
                    style={styles.cardIcon}
                  />
                  <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                    {item.title}
                  </ThemedText>
                </View>
                <ThemedText style={styles.cardDescription}>{item.description}</ThemedText>
                <View style={styles.cardFooter}>
                  <ThemedText style={styles.cardTimestamp}>{item.timestamp}</ThemedText>
                  <ThemedText style={[styles.statusPill, styles.statusDelivered]}>
                    Delivered
                  </ThemedText>
                </View>
              </ThemedView>
            ))}
          </ThemedView>

          {/* Queued notifications – alternative scenario */}
          {isOffline && (
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Queued alerts (alternative scenario)
              </ThemedText>
              <ThemedText style={styles.paragraph}>
                If the internet connection is lost while sending notifications, the system queues
                the alerts and delivers them automatically after the connection is restored.
              </ThemedText>
              {queuedNotifications.map((item) => (
                <ThemedView key={item.id} style={[styles.card, styles.queuedCard]}>
                  <View style={styles.cardHeader}>
                    <IconSymbol
                      name="clock.badge.exclamationmark"
                      size={20}
                      color="#B42318"
                      style={styles.cardIcon}
                    />
                    <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                      {item.title}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.cardDescription}>{item.description}</ThemedText>
                  <View style={styles.cardFooter}>
                    <ThemedText style={styles.cardTimestamp}>{item.timestamp}</ThemedText>
                    <ThemedText style={[styles.statusPill, styles.statusQueued]}>
                      Queued
                    </ThemedText>
                  </View>
                </ThemedView>
              ))}
            </ThemedView>
          )}
        </ScrollView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    bottom: -80,
    left: -40,
    position: 'absolute',
  },
  container: {
    flex: 1,
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.8,
  },
  calloutBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF8FF',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.tint,
  },
  calloutIcon: {
    marginTop: 2,
  },
  calloutTextWrap: {
    flex: 1,
    gap: 4,
  },
  calloutTitle: {
    fontSize: 15,
  },
  calloutBody: {
    fontSize: 14,
    opacity: 0.9,
    lineHeight: 20,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  paragraph: {
    lineHeight: 22,
  },
  bulletList: {
    marginTop: 8,
    gap: 6,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  banner: {
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bannerOffline: {
    backgroundColor: '#FEF3F2',
  },
  bannerOnline: {
    backgroundColor: '#ECFDF3',
  },
  bannerIcon: {
    marginTop: 4,
  },
  bannerTextContainer: {
    flex: 1,
    gap: 4,
  },
  bannerDescription: {
    fontSize: 14,
    opacity: 0.85,
  },
  toggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    backgroundColor: '#FFFFFF',
  },
  toggleButtonText: {
    fontSize: 13,
  },
  scrollContent: {
    paddingBottom: 32,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  queuedCard: {
    backgroundColor: '#FEF3F2',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardIcon: {
    marginRight: 2,
  },
  cardTitle: {
    flexShrink: 1,
  },
  cardDescription: {
    fontSize: 14,
    opacity: 0.9,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  cardTimestamp: {
    fontSize: 12,
    opacity: 0.7,
  },
  statusPill: {
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  statusDelivered: {
    backgroundColor: '#ECFDF3',
    color: '#027A48',
  },
  statusQueued: {
    backgroundColor: '#FEF3F2',
    color: '#B42318',
  },
});

