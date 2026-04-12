import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';

const notifications = [
  {
    id: 'r1',
    title: 'New community sighting report',
    description: 'A community user reported a Green Turtle near Coral Bay.',
    reportId: '#ST‑204',
    location: 'Coral Bay, near reef edge',
    timestamp: 'Just now',
    status: 'new',
  },
  {
    id: 'r2',
    title: 'Report opened for validation',
    description: 'You started validating photos and GPS data for this report.',
    reportId: '#ST‑203',
    location: 'Northern mangroves',
    timestamp: '5 min ago',
    status: 'inReview',
  },
  {
    id: 'r3',
    title: 'Report validated and archived',
    description: 'All evidence was consistent. The report is now part of the dataset.',
    reportId: '#ST‑198',
    location: 'Lagoon channel',
    timestamp: 'Yesterday',
    status: 'validated',
  },
];

export default function ResearcherNotificationsScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#F3E8FF', dark: '#2B1241' }}
      headerImage={
        <IconSymbol
          size={260}
          color={Colors.light.tint}
          name="person.text.rectangle.fill"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleRow}>
          <ThemedText
            type="title"
            style={{ fontFamily: Fonts.rounded, flex: 1, flexWrap: 'wrap' }}>
            Researcher Notifications
          </ThemedText>
        </ThemedView>

        <ThemedText type="subtitle" style={styles.subtitle}>
          Central hub for new community reports that need validation.
        </ThemedText>

        {/* Both receive notification callout */}
        <ThemedView style={styles.calloutBox}>
          <IconSymbol name="person.2.fill" size={24} color={Colors.light.tint} style={styles.calloutIcon} />
          <View style={styles.calloutTextWrap}>
            <ThemedText type="defaultSemiBold" style={styles.calloutTitle}>
              Both receive notifications
            </ThemedText>
            <ThemedText style={styles.calloutBody}>
              When a community user submits a new sighting, the system notifies both researchers and community users in real time. You receive alerts here; community users see them in their Notifications screen.
            </ThemedText>
          </View>
        </ThemedView>

        {/* Scenario mapping */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            How this screen fits the scenario
          </ThemedText>
          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <ThemedText type="defaultSemiBold" style={styles.stepBadgeText}>
                1
              </ThemedText>
            </View>
            <ThemedText style={styles.paragraph}>
              A community user submits a new sighting report (e.g. species, photos, and location).
            </ThemedText>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <ThemedText type="defaultSemiBold" style={styles.stepBadgeText}>
                2
              </ThemedText>
            </View>
            <ThemedText style={styles.paragraph}>
              The system sends a notification to researchers and community users about the new
              sighting.
            </ThemedText>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <ThemedText type="defaultSemiBold" style={styles.stepBadgeText}>
                3
              </ThemedText>
            </View>
            <ThemedText style={styles.paragraph}>
              Researchers open this screen to review and validate the report details.
            </ThemedText>
          </View>
        </ThemedView>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Incoming reports
            </ThemedText>
            {notifications.map((item) => (
              <ThemedView key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <IconSymbol
                    name={
                      item.status === 'new'
                        ? 'exclamationmark.bubble.fill'
                        : item.status === 'inReview'
                        ? 'doc.text.magnifyingglass'
                        : 'checkmark.seal.fill'
                    }
                    size={20}
                    color={
                      item.status === 'validated'
                        ? '#027A48'
                        : item.status === 'inReview'
                        ? Colors.light.tint
                        : '#B42318'
                    }
                    style={styles.cardIcon}
                  />
                  <View style={{ flex: 1 }}>
                    <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                      {item.title}
                    </ThemedText>
                    <ThemedText style={styles.cardMeta}>
                      {item.reportId} • {item.location}
                    </ThemedText>
                  </View>
                  <View style={styles.statusPillContainer}>
                    <ThemedText
                      style={[
                        styles.statusPill,
                        item.status === 'new'
                          ? styles.statusNew
                          : item.status === 'inReview'
                          ? styles.statusInReview
                          : styles.statusValidated,
                      ]}>
                      {item.status === 'new'
                        ? 'New'
                        : item.status === 'inReview'
                        ? 'In review'
                        : 'Validated'}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.cardDescription}>{item.description}</ThemedText>
                <View style={styles.cardFooter}>
                  <ThemedText style={styles.cardTimestamp}>{item.timestamp}</ThemedText>
                  <ThemedText style={styles.linkText}>Open report</ThemedText>
                </View>
              </ThemedView>
            ))}
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Alternative scenario: offline queue
            </ThemedText>
            <ThemedText style={styles.paragraph}>
              If a notification cannot be delivered to you because of temporary connectivity issues,
              the backend queues the alert. Once your device is back online and synchronized, the
              queued notifications will appear here with their original timestamps so you do not
              miss any critical reports.
            </ThemedText>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    bottom: -70,
    right: -30,
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
    backgroundColor: '#F3E8FF',
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
    gap: 10,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  paragraph: {
    lineHeight: 22,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardIcon: {
    marginTop: 2,
  },
  cardTitle: {
    flexShrink: 1,
  },
  cardMeta: {
    fontSize: 13,
    opacity: 0.8,
    marginTop: 2,
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
  linkText: {
    fontSize: 13,
    color: Colors.light.tint,
  },
  statusPillContainer: {
    marginLeft: 8,
  },
  statusPill: {
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  statusNew: {
    backgroundColor: '#FEF3F2',
    color: '#B42318',
  },
  statusInReview: {
    backgroundColor: '#EFF8FF',
    color: Colors.light.tint,
  },
  statusValidated: {
    backgroundColor: '#ECFDF3',
    color: '#027A48',
  },
});

