import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotificationSystem } from '../hooks/useNotificationSystem';

// ─── Config ───────────────────────────────────────────────────────────────────
const DEMO_ACTIONS = [
  {
    id:          'high',
    icon:        'alert-circle',
    label:       'Injured Animal Alert',
    sublabel:    'High priority · Red banner · Stays until dismissed',
    chipText:    'HIGH PRIORITY',
    chipBg:      '#FFEBEE',
    chipColor:   '#B71C1C',
    accentColor: '#B71C1C',
    cardBg:      '#FFF5F5',
    borderColor: '#FFCDD2',
    iconBg:      '#FFEBEE',
  },
  {
    id:          'report',
    icon:        'document-text',
    label:       'Report Submitted',
    sublabel:    'Normal alert · Green banner · Auto-dismisses in 5s',
    chipText:    'NORMAL',
    chipBg:      '#E8F5E9',
    chipColor:   '#2E7D32',
    accentColor: '#2E7D32',
    cardBg:      '#F6FBF6',
    borderColor: '#C8E6C9',
    iconBg:      '#E8F5E9',
  },
  {
    id:          'badge',
    icon:        'trophy',
    label:       'Badge Unlocked',
    sublabel:    'Normal alert · Appears below high alerts',
    chipText:    'NORMAL',
    chipBg:      '#E8F5E9',
    chipColor:   '#2E7D32',
    accentColor: '#1565C0',
    cardBg:      '#F3F7FF',
    borderColor: '#BBDEFB',
    iconBg:      '#E3F2FD',
  },
  {
    id:          'system',
    icon:        'megaphone',
    label:       'System Notification',
    sublabel:    'General alerts · Community-wide messages',
    chipText:    'NORMAL',
    chipBg:      '#E8F5E9',
    chipColor:   '#2E7D32',
    accentColor: '#E65100',
    cardBg:      '#FFF8F2',
    borderColor: '#FFE0B2',
    iconBg:      '#FFF3E0',
  },
];

// ─── Action Card ──────────────────────────────────────────────────────────────
const ActionCard = ({ item, onPress, index }) => {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, delay: index * 80, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const handlePressIn  = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <Animated.View style={{
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
    }}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: item.cardBg, borderColor: item.borderColor }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Left accent */}
        <View style={[styles.cardAccent, { backgroundColor: item.accentColor }]} />

        {/* Icon */}
        <View style={[styles.cardIconWrap, { backgroundColor: item.iconBg }]}>
          <Ionicons name={item.icon} size={22} color={item.accentColor} />
        </View>

        {/* Text */}
        <View style={{ flex: 1 }}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, { color: item.accentColor }]}>{item.label}</Text>
            <View style={[styles.chip, { backgroundColor: item.chipBg }]}>
              <Text style={[styles.chipText, { color: item.chipColor }]}>{item.chipText}</Text>
            </View>
          </View>
          <Text style={styles.cardSub}>{item.sublabel}</Text>
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={16} color="#ccc" style={{ marginLeft: 6 }} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const NotificationDemo = () => {
  const router  = useRouter();
  const {
    triggerBadgeUnlock,
    triggerReportSubmission,
    triggerInjuredAnimalAlert,
    triggerSystemNotification,
  } = useNotificationSystem();

  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const actions = [
    () => triggerInjuredAnimalAlert('Snow Leopard', { latitude: 36.307, longitude: 74.872 }, 'report-001'),
    () => triggerReportSubmission('Himalayan Ibex'),
    () => triggerBadgeUnlock('Wildlife Photographer', 'Submitted 10 quality reports'),
    () => triggerSystemNotification('Community Update', 'New sighting reports in your area'),
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      {/* ── Header ── */}
      <Animated.View style={[styles.header, { opacity: headerFade }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Alert System</Text>
          <Text style={styles.headerSub}>Test notification behaviors</Text>
        </View>
        <View style={{ width: 36 }} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Info Banner ── */}
        <View style={styles.infoBanner}>
          <View style={styles.infoBannerIconWrap}>
            <Ionicons name="notifications" size={20} color="#1565C0" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoBannerTitle}>How alerts work</Text>
            <Text style={styles.infoBannerBody}>
              High priority alerts stay until manually dismissed.
              Normal alerts auto-dismiss after 5 seconds.
              Swipe left or right to dismiss any alert instantly.
            </Text>
          </View>
        </View>

        {/* ── Priority Legend ── */}
        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>Priority Order</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#B71C1C' }]} />
              <View>
                <Text style={styles.legendItemTitle}>High Priority</Text>
                <Text style={styles.legendItemSub}>Always on top · Manual dismiss</Text>
              </View>
            </View>
            <View style={styles.legendDivider} />
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#2E7D32' }]} />
              <View>
                <Text style={styles.legendItemTitle}>Normal</Text>
                <Text style={styles.legendItemSub}>Below high alerts · Auto-dismiss</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Section label ── */}
        <Text style={styles.sectionLabel}>TAP TO TRIGGER</Text>

        {/* ── Action Cards ── */}
        {DEMO_ACTIONS.map((item, index) => (
          <ActionCard
            key={item.id}
            item={item}
            index={index}
            onPress={actions[index]}
          />
        ))}

        {/* ── Swipe Tip ── */}
        <View style={styles.tipCard}>
          <Ionicons name="hand-left-outline" size={18} color="#888" />
          <Text style={styles.tipText}>
            Swipe any active banner left or right to dismiss it immediately
          </Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationDemo;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: '#1B5E20' },
  container: { paddingBottom: 90, backgroundColor: '#F2F4F2' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13, backgroundColor: '#1B5E20',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { alignItems: 'center' },
  headerTitle:  { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  headerSub:    { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 1 },

  // Info banner
  infoBanner: {
    backgroundColor: '#E3F2FD', borderWidth: 0.5, borderColor: '#BBDEFB',
    marginHorizontal: 12, marginTop: 14, borderRadius: 14,
    padding: 13, flexDirection: 'row', alignItems: 'flex-start', gap: 10,
  },
  infoBannerIconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  infoBannerTitle: { fontSize: 13, fontWeight: '700', color: '#0D47A1', marginBottom: 3 },
  infoBannerBody:  { fontSize: 11, color: '#1565C0', lineHeight: 16 },

  // Legend
  legendCard: {
    backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10,
    borderRadius: 14, padding: 14, elevation: 1,
    borderWidth: 0.5, borderColor: '#E8E8E8',
  },
  legendTitle:     { fontSize: 11, fontWeight: '800', color: '#aaa', letterSpacing: 0.8, marginBottom: 10, textTransform: 'uppercase' },
  legendRow:       { flexDirection: 'row', alignItems: 'center' },
  legendItem:      { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  legendDot:       { width: 10, height: 10, borderRadius: 5, marginTop: 3, flexShrink: 0 },
  legendItemTitle: { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  legendItemSub:   { fontSize: 10, color: '#888', marginTop: 1 },
  legendDivider:   { width: 1, height: 36, backgroundColor: '#F0F0F0', marginHorizontal: 12 },

  // Section label
  sectionLabel: {
    fontSize: 10, fontWeight: '800', color: '#bbb', letterSpacing: 1,
    marginHorizontal: 16, marginTop: 18, marginBottom: 8,
  },

  // Action card
  card: {
    marginHorizontal: 12, marginBottom: 8, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, overflow: 'hidden',
    paddingVertical: 13, paddingRight: 14,
    elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  cardAccent:   { width: 4, alignSelf: 'stretch', marginRight: 12 },
  cardIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12, flexShrink: 0,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  cardTitle:    { fontSize: 14, fontWeight: '700', flex: 1 },
  cardSub:      { fontSize: 11, color: '#888', lineHeight: 15 },

  chip:     { borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  chipText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },

  // Tip card
  tipCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10,
    borderRadius: 12, padding: 13,
    borderWidth: 0.5, borderColor: '#E8E8E8',
  },
  tipText: { fontSize: 12, color: '#888', flex: 1, lineHeight: 17 },
});