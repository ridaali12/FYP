import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Animated, ActivityIndicator, Alert, Switch, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from '../../components/BottomNav';

// ─── Config ──────────────────────────────────────────────────────────────────
const API_URL = 'http://192.168.100.2:5000';
const ALERT_RADIUS_KM = 15;

// ─── Pakistan Northern Region — 4 Tracked Species ────────────────────────────
const SPECIES_META = {
  brown_bear: {
    name: 'Brown Bear',
    urdu: 'بھورا ریچھ',
    icon: '🐻',
    dangerNote: 'Brown Bears are highly territorial. Do NOT approach. Make loud noise while walking on trails.',
    conservationLabel: 'Critically threatened in this zone',
  },
  snow_leopard: {
    name: 'Snow Leopard',
    urdu: 'برفانی چیتا',
    icon: '🐆',
    dangerNote: 'Snow Leopard may be with cubs — extreme caution required. Livestock keepers must secure animals immediately.',
    conservationLabel: 'Endangered — under 50 remain in range',
  },
  markhor: {
    name: 'Markhor',
    urdu: 'مارخور',
    icon: '🐐',
    dangerNote: 'Markhor can charge if cornered. Slow down vehicles near mountain passes. National animal — do not disturb.',
    conservationLabel: 'Vulnerable — national animal of Pakistan',
  },
  ibex: {
    name: 'Himalayan Ibex',
    urdu: 'ہمالیائی آئی بیکس',
    icon: '🦌',
    dangerNote: 'Injured Ibex spotted nearby. Contact wildlife rangers. Do not approach or disturb the animal.',
    conservationLabel: 'Near threatened — poaching risk high',
  },
};

// ─── Severity Config ──────────────────────────────────────────────────────────
const SEVERITY_CONFIG = {
  critical: { color: '#B71C1C', bg: '#FFEBEE', label: 'CRITICAL', pulse: '#EF5350' },
  high:     { color: '#E65100', bg: '#FFF3E0', label: 'HIGH',     pulse: '#FF7043' },
  moderate: { color: '#1565C0', bg: '#E3F2FD', label: 'MODERATE', pulse: '#1E88E5' },
};

// ─── Haversine Distance ───────────────────────────────────────────────────────
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── Pulsing Dot ──────────────────────────────────────────────────────────────
const PulseDot = ({ color }) => {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale,   { toValue: 1.7, duration: 900, useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 1,   duration: 900, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0,   duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.8, duration: 900, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute', width: 18, height: 18, borderRadius: 9,
        backgroundColor: color, opacity, transform: [{ scale }],
      }} />
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
    </View>
  );
};

// ─── Radar Ring ───────────────────────────────────────────────────────────────
const RadarRing = ({ delay, color }) => {
  const scale   = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.parallel([
        Animated.timing(scale,   { toValue: 1, duration: 2400, delay, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 2400, delay, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute', width: 150, height: 150, borderRadius: 75,
      borderWidth: 1.5, borderColor: color,
      opacity, transform: [{ scale }],
    }} />
  );
};

// ─── Conservation Bar ─────────────────────────────────────────────────────────
const ConservationBar = ({ pct, color, label }) => (
  <View style={styles.conservationWrap}>
    <Text style={styles.conservationTitle}>Conservation threat level</Text>
    <View style={styles.conservationTrack}>
      <View style={[styles.conservationFill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
    <Text style={[styles.conservationLabel, { color }]}>{label}</Text>
  </View>
);

// ─── Alert Detail Modal ───────────────────────────────────────────────────────
const AlertDetail = ({ alert, onClose }) => {
  const cfg      = SEVERITY_CONFIG[alert.severity];
  const meta     = SPECIES_META[alert.speciesKey] || {};
  const slideUp  = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    Animated.spring(slideUp, { toValue: 0, tension: 65, friction: 12, useNativeDriver: true }).start();
  }, []);

  const infoRows = [
    { icon: 'location',      label: 'Location',    value: alert.location },
    { icon: 'person',        label: 'Reported by', value: alert.reportedBy },
    { icon: 'time',          label: 'Time',        value: alert.time },
    { icon: 'heart',         label: 'Health',      value: alert.health },
    { icon: 'navigate',      label: 'Coordinates', value: `${alert.lat.toFixed(4)}°N, ${alert.lon.toFixed(4)}°E` },
    { icon: 'warning',       label: 'Safety note', value: meta.dangerNote },
  ];

  return (
    <Modal transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View style={[styles.modalCard, { transform: [{ translateY: slideUp }] }]}>
          <Pressable onPress={() => {}} /* block tap-through */>

            {/* Header */}
            <View style={[styles.modalHeader, { backgroundColor: cfg.color }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalSevLabel}>{cfg.label} ALERT</Text>
                <Text style={styles.modalSpecies}>{alert.icon}  {alert.species}</Text>
                <Text style={styles.modalUrdu}>{meta.urdu}</Text>
                <Text style={styles.modalStatus}>{alert.status}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
              <View style={styles.modalBody}>

                {/* Distance pill */}
                <View style={[styles.distancePill, { borderColor: cfg.color }]}>
                  <Ionicons name="navigate" size={15} color={cfg.color} />
                  <Text style={[styles.distancePillText, { color: cfg.color }]}>
                    {alert.distance} km from your location
                  </Text>
                </View>

                {/* Conservation bar */}
                <ConservationBar
                  pct={alert.conservationPct}
                  color={cfg.color}
                  label={meta.conservationLabel}
                />

                {/* Info rows */}
                {infoRows.map((row) => (
                  <View key={row.label} style={styles.modalRow}>
                    <View style={[styles.modalRowIcon, { backgroundColor: cfg.color + '18' }]}>
                      <Ionicons name={row.icon} size={14} color={cfg.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalRowLabel}>{row.label}</Text>
                      <Text style={styles.modalRowValue}>{row.value}</Text>
                    </View>
                  </View>
                ))}

                {/* Action buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: cfg.color }]}
                    onPress={() => Alert.alert('Navigate', 'Opening navigation...')}
                  >
                    <Ionicons name="navigate-circle" size={17} color="#fff" />
                    <Text style={styles.modalActionText}>Navigate</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalActionBtnOutline, { borderColor: cfg.color }]}
                    onPress={() => Alert.alert('Share', 'Alert shared with community!')}
                  >
                    <Ionicons name="share-social" size={17} color={cfg.color} />
                    <Text style={[styles.modalActionTextOutline, { color: cfg.color }]}>Share alert</Text>
                  </TouchableOpacity>
                </View>

              </View>
            </ScrollView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

// ─── Alert Card ───────────────────────────────────────────────────────────────
const AlertCard = ({ item, index, onPress }) => {
  const cfg       = SEVERITY_CONFIG[item.severity];
  const pct       = Math.max(0, 100 - (item.distance / ALERT_RADIUS_KM) * 100);
  const cardFade  = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardFade,  { toValue: 1, duration: 400, delay: index * 100, useNativeDriver: true }),
      Animated.timing(cardSlide, { toValue: 0, duration: 400, delay: index * 100, useNativeDriver: true }),
    ]).start();
  }, []);

  const isInjured = item.health === 'Injured' || item.health === 'Sick';

  return (
    <Animated.View style={{ opacity: cardFade, transform: [{ translateY: cardSlide }] }}>
      <TouchableOpacity style={styles.alertCard} onPress={() => onPress(item)} activeOpacity={0.85}>

        <View style={[styles.alertAccent, { backgroundColor: cfg.color }]} />

        <View style={styles.alertContent}>
          {/* Top row */}
          <View style={styles.alertTopRow}>
            <View style={styles.alertEmojiWrap}>
              <Text style={styles.alertEmoji}>{item.icon}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={styles.alertTitleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertSpecies}>{item.species}</Text>
                  <Text style={styles.alertUrdu}>{item.urdu}</Text>
                </View>
                <View style={[styles.severityBadge, { backgroundColor: cfg.bg }]}>
                  <PulseDot color={cfg.color} />
                  <Text style={[styles.severityText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>
              <Text style={styles.alertStatusText} numberOfLines={1}>{item.status}</Text>
            </View>
          </View>

          {/* Distance row */}
          <View style={styles.distanceRow}>
            <Ionicons name="radio" size={12} color={cfg.color} />
            <Text style={[styles.distanceLabel, { color: cfg.color }]}>{item.distance} km away</Text>
            <Text style={styles.alertTime}>{item.time}</Text>
          </View>
          <View style={styles.distanceBarBg}>
            <View style={[styles.distanceBarFill, { width: `${pct}%`, backgroundColor: cfg.color }]} />
          </View>

          {/* Bottom row */}
          <View style={styles.alertBottomRow}>
            <Ionicons name="person-circle-outline" size={13} color="#888" />
            <Text style={styles.alertReporter} numberOfLines={1}>{item.reportedBy} · {item.location}</Text>
            <View style={[styles.healthPill, { backgroundColor: isInjured ? '#FFEBEE' : '#E8F5E9' }]}>
              <Text style={[styles.healthPillText, { color: isInjured ? '#C62828' : '#2E7D32' }]}>
                {item.health}
              </Text>
            </View>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={15} color="#ccc" style={{ alignSelf: 'center', marginRight: 6 }} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const InstantAlertScreen = () => {
  const router = useRouter();
  const [location, setLocation]           = useState(null);
  const [locLoading, setLocLoading]       = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [alerts, setAlerts]               = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [notifCount, setNotifCount]       = useState(0);

  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initScreen();
    Animated.timing(headerFade, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    loadToggleState();
  }, []);

  const loadToggleState = async () => {
    try {
      const stored = await AsyncStorage.getItem('alertsEnabled');
      if (stored !== null) setAlertsEnabled(JSON.parse(stored));
    } catch (_) {}
  };

  const initScreen = async () => {
    setLocLoading(true);
    setLoadingAlerts(true);

    // ── Step 1: Location ──────────────────────────────────────────────────
    let coords = null;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (loc && loc.coords) {
          coords = loc.coords;
          setLocation(coords);
        }
      }
    } catch (locErr) {
      console.warn('Location error:', locErr);
    } finally {
      setLocLoading(false);
    }

    // ── Step 2: Fetch alerts ──────────────────────────────────────────────
    try {
      const lat = (coords && coords.latitude)  ? coords.latitude  : 36.307;
      const lon = (coords && coords.longitude) ? coords.longitude : 74.872;

      const response = await fetch(
        `${API_URL}/api/reports/nearby?lat=${lat}&lon=${lon}&radius=${ALERT_RADIUS_KM}`,
        { headers: { Accept: 'application/json' } }
      );

      if (!response.ok) {
        console.warn('Server responded:', response.status);
        setAlerts([]);
        setNotifCount(0);
        return;
      }

      const raw = await response.json();
      const data = Array.isArray(raw) ? raw : [];

      const enriched = data.map(a => ({
        ...a,
        icon:           SPECIES_META[a.speciesKey] ? SPECIES_META[a.speciesKey].icon    : '🐾',
        species:        SPECIES_META[a.speciesKey] ? SPECIES_META[a.speciesKey].name    : (a.species || 'Unknown'),
        urdu:           SPECIES_META[a.speciesKey] ? SPECIES_META[a.speciesKey].urdu    : '',
        distance:       typeof a.distance      === 'number' ? a.distance      : 0,
        severity:       a.severity      || 'moderate',
        health:         a.health        || 'Unknown',
        location:       a.location      || '',
        reportedBy:     a.reportedBy    || 'Anonymous',
        time:           a.time          || '',
        lat:            typeof a.lat    === 'number' ? a.lat : 0,
        lon:            typeof a.lon    === 'number' ? a.lon : 0,
        conservationPct: typeof a.conservationPct === 'number' ? a.conservationPct : 50,
      }));

      setAlerts(enriched);
      setNotifCount(enriched.filter(a => a.severity === 'critical').length);
    } catch (fetchErr) {
      console.warn('Fetch error:', fetchErr);
      setAlerts([]);
      setNotifCount(0);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const toggleAlerts = async (val) => {
    setAlertsEnabled(val);
    await AsyncStorage.setItem('alertsEnabled', JSON.stringify(val));
    Alert.alert(
      val ? '🔔 Alerts Enabled' : '🔕 Alerts Disabled',
      val
        ? `You'll be notified when Brown Bear, Snow Leopard, Markhor, or Ibex are spotted within ${ALERT_RADIUS_KM} km.`
        : 'You won\'t receive nearby wildlife alerts.'
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerFade }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Instant Alerts</Text>
          <Text style={styles.headerSub}>Himalaya · Karakoram · {ALERT_RADIUS_KM} km radius</Text>
        </View>
        <View style={styles.headerBadgeWrap}>
          {notifCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{notifCount}</Text>
            </View>
          )}
          <Ionicons name="notifications" size={22} color="#fff" />
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── Radar Card ── */}
        <View style={styles.radarCard}>
          <View style={styles.radarBg}>
            <View style={styles.radarRing3} />
            <View style={styles.radarRing2} />
            <View style={styles.radarRing1} />
            <RadarRing delay={0}    color="rgba(139,195,74,0.6)" />
            <RadarRing delay={800}  color="rgba(139,195,74,0.4)" />
            <RadarRing delay={1600} color="rgba(139,195,74,0.2)" />
            <View style={styles.radarCenter}>
              <Ionicons name="location" size={16} color="#fff" />
            </View>
            {alerts.map((a, i) => {
              const cfg = SEVERITY_CONFIG[a.severity];
              const angle = (i * 83 + 30) % 360;
              const radiusPx = (a.distance / ALERT_RADIUS_KM) * 65;
              const x = Math.cos((angle * Math.PI) / 180) * radiusPx;
              const y = Math.sin((angle * Math.PI) / 180) * radiusPx;
              return (
                <View key={a.id} style={[styles.radarDot, {
                  backgroundColor: cfg.color,
                  transform: [{ translateX: x }, { translateY: y }],
                }]} />
              );
            })}
          </View>

          <View style={styles.radarInfo}>
            <Text style={styles.radarTitle}>🛰️ Live Radar</Text>
            <Text style={styles.radarSubtitle}>Scanning northern wilderness</Text>
            {locLoading ? (
              <View style={styles.radarLocRow}>
                <ActivityIndicator size="small" color="#A5D6A7" />
                <Text style={styles.radarLocText}> Detecting location...</Text>
              </View>
            ) : location ? (
              <View style={styles.radarLocRow}>
                <Ionicons name="navigate-circle" size={13} color="#A5D6A7" />
                <Text style={styles.radarLocText}>
                  {location.latitude.toFixed(3)}°N, {location.longitude.toFixed(3)}°E
                </Text>
              </View>
            ) : null}
            <View style={styles.radarStatsRow}>
              <View style={styles.radarStat}>
                <Text style={styles.radarStatNum}>{alerts.length}</Text>
                <Text style={styles.radarStatLabel}>Nearby</Text>
              </View>
              <View style={styles.radarStatDivider} />
              <View style={styles.radarStat}>
                <Text style={[styles.radarStatNum, { color: '#EF5350' }]}>
                  {alerts.filter(a => a.severity === 'critical').length}
                </Text>
                <Text style={styles.radarStatLabel}>Critical</Text>
              </View>
              <View style={styles.radarStatDivider} />
              <View style={styles.radarStat}>
                <Text style={styles.radarStatNum}>{ALERT_RADIUS_KM} km</Text>
                <Text style={styles.radarStatLabel}>Radius</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Region + Species Chips ── */}
        <View style={styles.regionCard}>
          <Text style={styles.regionTitle}>🏔️ Northern Pakistan — Tracked Species</Text>
          <Text style={styles.regionSub}>Himalayan & Karakoram range · 4 endangered species monitored</Text>
          <View style={styles.speciesChipsRow}>
            {Object.values(SPECIES_META).map(s => (
              <View key={s.name} style={styles.speciesChip}>
                <Text style={styles.speciesChipText}>{s.icon} {s.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Journey Warning Banner ── */}
        <View style={styles.journeyBanner}>
          <Text style={styles.journeyBannerIcon}>⚠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.journeyBannerTitle}>Plan your journey carefully</Text>
            <Text style={styles.journeyBannerBody}>
              Wild animals are active in nearby zones. Avoid high-altitude trails after dusk.
              Shepherd routes near Fairy Meadows have active Brown Bear sightings.
            </Text>
          </View>
        </View>

        {/* ── Alert Toggle ── */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleLeft}>
            <View style={[styles.toggleIconBox, { backgroundColor: alertsEnabled ? '#E8F5E9' : '#F5F5F5' }]}>
              <Ionicons
                name={alertsEnabled ? 'notifications' : 'notifications-off'}
                size={17}
                color={alertsEnabled ? '#2E7D32' : '#aaa'}
              />
            </View>
            <View>
              <Text style={styles.toggleTitle}>Receive Nearby Alerts</Text>
              <Text style={styles.toggleSub}>
                {alertsEnabled ? `Active — ${ALERT_RADIUS_KM} km radius` : 'Notifications paused'}
              </Text>
            </View>
          </View>
          <Switch
            value={alertsEnabled}
            onValueChange={toggleAlerts}
            trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
            thumbColor={alertsEnabled ? '#2E7D32' : '#f4f3f4'}
          />
        </View>

        {/* ── Legend ── */}
        <View style={styles.legendRow}>
          {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
            <View key={key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: cfg.color }]} />
              <Text style={styles.legendText}>{cfg.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Section Header ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>⚠️ Active Alerts Nearby</Text>
          <TouchableOpacity onPress={initScreen}>
            <Ionicons name="refresh-circle" size={26} color="#2E7D32" />
          </TouchableOpacity>
        </View>

        {/* ── Alerts List ── */}
        {loadingAlerts ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.loadingText}>Scanning nearby reports...</Text>
            <Text style={styles.loadingSubText}>Checking within {ALERT_RADIUS_KM} km radius</Text>
          </View>
        ) : alerts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🏔️</Text>
            <Text style={styles.emptyTitle}>No alerts nearby</Text>
            <Text style={styles.emptySubtitle}>
              No Brown Bear, Snow Leopard, Markhor, or Ibex reported within {ALERT_RADIUS_KM} km
            </Text>
          </View>
        ) : (
          alerts.map((item, index) => (
            <AlertCard
              key={item.id}
              item={item}
              index={index}
              onPress={setSelectedAlert}
            />
          ))
        )}

        {/* ── How It Works ── */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ How It Works</Text>
          {[
            { icon: 'eye-outline',          text: 'A community member spots a Brown Bear, Snow Leopard, Markhor, or Ibex and submits a report' },
            { icon: 'radio-outline',         text: 'System instantly scans all community users within a 15 km radius of the sighting' },
            { icon: 'notifications-outline', text: 'Push notification sent — hikers, shepherds & travelers are warned to adjust their plans' },
            { icon: 'shield-checkmark-outline', text: 'Reduces human-wildlife conflict and protects Pakistan\'s endangered northern species' },
          ].map((step, i) => (
            <View key={i} style={[styles.infoRow, i === 3 && { marginBottom: 0 }]}>
              <View style={styles.infoStepNum}>
                <Text style={styles.infoStepNumText}>{i + 1}</Text>
              </View>
              <View style={styles.infoIconBox}>
                <Ionicons name={step.icon} size={14} color="#2E7D32" />
              </View>
              <Text style={styles.infoText}>{step.text}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Alert Detail Modal ── */}
      {selectedAlert && (
        <AlertDetail
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}

      <BottomNav />
    </SafeAreaView>
  );
};

export default InstantAlertScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: '#1A3A1A' },
  container: { paddingBottom: 90, backgroundColor: '#F2F4F2' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13,
    backgroundColor: '#1A3A1A',
  },
  headerBackBtn:  { padding: 2 },
  headerCenter:   { alignItems: 'center' },
  headerTitle:    { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  headerSub:      { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  headerBadgeWrap:{ position: 'relative', width: 28, alignItems: 'center' },
  notifBadge: {
    position: 'absolute', top: -4, right: -5, zIndex: 1,
    backgroundColor: '#FFD700', borderRadius: 8,
    width: 16, height: 16, alignItems: 'center', justifyContent: 'center',
  },
  notifBadgeText: { fontSize: 9, fontWeight: '900', color: '#000' },

  // Radar
  radarCard: {
    backgroundColor: '#0D1A0D', marginHorizontal: 12, marginTop: 12,
    borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center',
    overflow: 'hidden',
  },
  radarBg: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  radarRing3: { position: 'absolute', width: 132, height: 132, borderRadius: 66, borderWidth: 1, borderColor: 'rgba(139,195,74,0.15)' },
  radarRing2: { position: 'absolute', width: 92,  height: 92,  borderRadius: 46, borderWidth: 1, borderColor: 'rgba(139,195,74,0.28)' },
  radarRing1: { position: 'absolute', width: 52,  height: 52,  borderRadius: 26, borderWidth: 1, borderColor: 'rgba(139,195,74,0.45)' },
  radarCenter: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#8BC34A', alignItems: 'center', justifyContent: 'center',
    elevation: 4,
  },
  radarDot: {
    position: 'absolute', width: 8, height: 8, borderRadius: 4, elevation: 3,
  },
  radarInfo:       { flex: 1, paddingLeft: 12 },
  radarTitle:      { fontSize: 14, fontWeight: '800', color: '#fff', marginBottom: 2 },
  radarSubtitle:   { fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 8 },
  radarLocRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  radarLocText:    { fontSize: 9, color: '#A5D6A7', marginLeft: 4 },
  radarStatsRow:   { flexDirection: 'row', alignItems: 'center' },
  radarStat:       { alignItems: 'center', flex: 1 },
  radarStatNum:    { fontSize: 15, fontWeight: '900', color: '#fff' },
  radarStatLabel:  { fontSize: 8, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 },
  radarStatDivider:{ width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.1)' },

  // Region card
  regionCard: {
    backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10,
    borderRadius: 14, padding: 13, elevation: 1,
  },
  regionTitle:     { fontSize: 13, fontWeight: '800', color: '#1a1a1a', marginBottom: 2 },
  regionSub:       { fontSize: 10, color: '#888', marginBottom: 8 },
  speciesChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  speciesChip: {
    backgroundColor: '#F1F8E9', borderWidth: 0.5, borderColor: '#C5E1A5',
    borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4,
  },
  speciesChipText: { fontSize: 10, color: '#33691E', fontWeight: '600' },

  // Journey banner
  journeyBanner: {
    backgroundColor: '#FFF8E1', borderWidth: 0.5, borderColor: '#FFCA28',
    marginHorizontal: 12, marginTop: 10, borderRadius: 12,
    padding: 11, flexDirection: 'row', alignItems: 'flex-start', gap: 8,
  },
  journeyBannerIcon:  { fontSize: 15, marginTop: 1 },
  journeyBannerTitle: { fontSize: 12, fontWeight: '700', color: '#E65100', marginBottom: 3 },
  journeyBannerBody:  { fontSize: 10, color: '#5D4037', lineHeight: 15 },

  // Toggle
  toggleCard: {
    backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10,
    borderRadius: 14, padding: 13, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', elevation: 1,
  },
  toggleLeft:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleIconBox: { width: 35, height: 35, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  toggleTitle:   { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  toggleSub:     { fontSize: 10, color: '#888', marginTop: 1 },

  // Legend
  legendRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 16,
    marginTop: 10, marginHorizontal: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 10, color: '#555', fontWeight: '600' },

  // Section header
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 12, marginTop: 14, marginBottom: 6,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#1a1a1a' },

  // Loading / Empty
  loadingBox:    { padding: 40, alignItems: 'center', gap: 10 },
  loadingText:   { fontSize: 14, color: '#2E7D32', fontWeight: '700' },
  loadingSubText:{ fontSize: 12, color: '#aaa' },
  emptyBox:      { padding: 40, alignItems: 'center' },
  emptyIcon:     { fontSize: 46, marginBottom: 10 },
  emptyTitle:    { fontSize: 15, fontWeight: '700', color: '#333' },
  emptySubtitle: { fontSize: 11, color: '#aaa', marginTop: 4, textAlign: 'center', lineHeight: 17 },

  // Alert card
  alertCard: {
    backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 8,
    borderRadius: 14, flexDirection: 'row', overflow: 'hidden',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4,
  },
  alertAccent:   { width: 4 },
  alertContent:  { flex: 1, padding: 11 },
  alertTopRow:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  alertEmojiWrap:{ width: 38, height: 38, borderRadius: 11, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  alertEmoji:    { fontSize: 20 },
  alertTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', flex: 1 },
  alertSpecies:  { fontSize: 13, fontWeight: '800', color: '#1a1a1a' },
  alertUrdu:     { fontSize: 9, color: '#888', textAlign: 'right', direction: 'rtl' },
  alertStatusText:{ fontSize: 10, color: '#888', marginTop: 2 },
  severityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  severityText:  { fontSize: 8, fontWeight: '800', letterSpacing: 0.4 },
  distanceRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  distanceLabel: { fontSize: 10, fontWeight: '700', flex: 1 },
  alertTime:     { fontSize: 9, color: '#aaa' },
  distanceBarBg: { height: 3, backgroundColor: '#F0F0F0', borderRadius: 2, marginBottom: 7 },
  distanceBarFill:{ height: 3, borderRadius: 2 },
  alertBottomRow:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  alertReporter: { fontSize: 10, color: '#888', flex: 1 },
  healthPill:    { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  healthPillText:{ fontSize: 9, fontWeight: '700' },

  // Info card
  infoCard: {
    backgroundColor: '#fff', marginHorizontal: 12, marginTop: 12,
    borderRadius: 14, padding: 15, elevation: 1,
  },
  infoTitle:       { fontSize: 13, fontWeight: '800', color: '#1a1a1a', marginBottom: 12 },
  infoRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginBottom: 10 },
  infoStepNum:     { width: 19, height: 19, borderRadius: 10, backgroundColor: '#1B5E20', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  infoStepNumText: { fontSize: 9, fontWeight: '900', color: '#fff' },
  infoIconBox:     { width: 26, height: 26, borderRadius: 7, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  infoText:        { fontSize: 11, color: '#444', flex: 1, lineHeight: 16 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  modalSevLabel: { fontSize: 9, color: 'rgba(255,255,255,0.8)', fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  modalSpecies:  { fontSize: 21, fontWeight: '900', color: '#fff' },
  modalUrdu:     { fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'right', marginTop: 2 },
  modalStatus:   { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
  modalCloseBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 15,
    width: 30, height: 30, alignItems: 'center', justifyContent: 'center',
  },
  modalBody:      { padding: 18 },
  distancePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    alignSelf: 'flex-start', marginBottom: 14,
  },
  distancePillText: { fontSize: 12, fontWeight: '800' },

  // Conservation bar
  conservationWrap:  { marginBottom: 14 },
  conservationTitle: { fontSize: 10, color: '#888', fontWeight: '600', marginBottom: 5 },
  conservationTrack: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  conservationFill:  { height: 6, borderRadius: 3 },
  conservationLabel: { fontSize: 10, fontWeight: '700', marginTop: 4 },

  modalRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, marginBottom: 13 },
  modalRowIcon:  { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  modalRowLabel: { fontSize: 9, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  modalRowValue: { fontSize: 13, color: '#1a1a1a', fontWeight: '600', marginTop: 1, lineHeight: 18 },
  modalActions:  { flexDirection: 'row', gap: 10, marginTop: 6 },
  modalActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 12,
  },
  modalActionText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  modalActionBtnOutline: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5,
  },
  modalActionTextOutline: { fontWeight: '800', fontSize: 13 },
});