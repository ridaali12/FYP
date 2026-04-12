import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Animated,
  Dimensions, StyleSheet, Platform,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const AlertContext = createContext(null);
const { width: SCREEN_W } = Dimensions.get('window');
const NORMAL_AUTO_DISMISS_MS = 5000;

// ─── Single Alert Banner ──────────────────────────────────────────────────────
const AlertBanner = ({ alert, onRemove }) => {
  const router     = useRouter();
  const translateX = useRef(new Animated.Value(SCREEN_W)).current;
  const opacity    = useRef(new Animated.Value(1)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const timerRef   = useRef(null);
  const isHigh     = alert.type === 'high';

  // ── Slide in on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    Animated.spring(translateX, {
      toValue: 0, tension: 90, friction: 10, useNativeDriver: true,
    }).start();

    // Pulse border glow for high alerts
    if (isHigh) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.025, duration: 750, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,     duration: 750, useNativeDriver: true }),
        ])
      ).start();
    }

    // Normal alerts auto-dismiss after 5 seconds
    if (!isHigh) {
      timerRef.current = setTimeout(() => slideOut('right'), NORMAL_AUTO_DISMISS_MS);
    }

    return () => clearTimeout(timerRef.current);
  }, []);

  const slideOut = (dir = 'right') => {
    clearTimeout(timerRef.current);
    const toX = dir === 'right' ? SCREEN_W + 80 : -SCREEN_W - 80;
    Animated.parallel([
      Animated.timing(translateX, { toValue: toX, duration: 270, useNativeDriver: true }),
      Animated.timing(opacity,    { toValue: 0,   duration: 270, useNativeDriver: true }),
    ]).start(() => onRemove(alert.id));
  };

  // ── Swipe gesture handler ─────────────────────────────────────────────────
  const onGestureEvent = ({ nativeEvent }) => {
    translateX.setValue(nativeEvent.translationX);
  };

  const onHandlerStateChange = ({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      const { translationX, velocityX } = nativeEvent;
      if (translationX >  SCREEN_W * 0.28 || velocityX >  600) { slideOut('right'); return; }
      if (translationX < -SCREEN_W * 0.28 || velocityX < -600) { slideOut('left');  return; }
      // Snap back to position
      Animated.spring(translateX, {
        toValue: 0, tension: 100, friction: 8, useNativeDriver: true,
      }).start();
    }
  };

  const timeStr = alert.timestamp
    ? new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      activeOffsetX={[-10, 10]}
    >
      <Animated.View style={[
        styles.banner,
        isHigh ? styles.bannerHigh : styles.bannerNormal,
        { transform: [{ translateX }, { scale: pulseAnim }], opacity },
      ]}>

        {/* Left accent stripe */}
        <View style={[styles.accentStripe, { backgroundColor: isHigh ? '#B71C1C' : '#2E7D32' }]} />

        {/* Alert icon */}
        <View style={[styles.iconCircle, { backgroundColor: isHigh ? '#FFEBEE' : '#E8F5E9' }]}>
          <Ionicons
            name={isHigh ? 'alert-circle' : 'checkmark-circle'}
            size={26}
            color={isHigh ? '#B71C1C' : '#2E7D32'}
          />
        </View>

        {/* Main content */}
        <View style={{ flex: 1 }}>

          {/* Priority chip + timestamp */}
          <View style={styles.topRow}>
            {isHigh ? (
              <View style={styles.highChip}>
                <View style={styles.highChipDot} />
                <Text style={styles.highChipText}>HIGH PRIORITY</Text>
              </View>
            ) : (
              <View style={styles.normalChip}>
                <Text style={styles.normalChipText}>ALERT</Text>
              </View>
            )}
            <Text style={styles.timeText}>{timeStr}</Text>
          </View>

          {/* Title */}
          <Text
            style={[styles.titleText, { color: isHigh ? '#7F0000' : '#1B5E20' }]}
            numberOfLines={1}
          >
            {alert.title}
          </Text>

          {/* Message */}
          <Text style={styles.messageText} numberOfLines={2}>
            {alert.message}
          </Text>

          {/* Swipe hint */}
          <Text style={styles.swipeHint}>← swipe to dismiss →</Text>

          {/* Action buttons */}
          <View style={styles.btnRow}>
            {alert.reportId && (
              <TouchableOpacity
                style={[styles.viewBtn, { backgroundColor: isHigh ? '#B71C1C' : '#2E7D32' }]}
                onPress={() => {
                  slideOut('right');
                  router.push('/(tabs)/ReportsFeed');
                }}
              >
                <Ionicons name="document-text-outline" size={12} color="#fff" />
                <Text style={styles.viewBtnText}>View Report</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.dismissBtn, { borderColor: isHigh ? '#FFCDD2' : '#C8E6C9' }]}
              onPress={() => slideOut('right')}
            >
              <Text style={[styles.dismissBtnText, { color: isHigh ? '#B71C1C' : '#2E7D32' }]}>
                Dismiss
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => slideOut('right')}>
          <Ionicons name="close" size={14} color="#aaa" />
        </TouchableOpacity>

      </Animated.View>
    </PanGestureHandler>
  );
};

// ─── Alert Container ──────────────────────────────────────────────────────────
const AlertContainer = ({ alerts, onRemove }) => {
  if (alerts.length === 0) return null;

  // Max 3 visible, high alerts always first (sorted in provider)
  const visible = alerts.slice(0, 3);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {visible.map((alert, index) => (
        <View
          key={alert.id}
          style={[styles.bannerWrapper, { top: index * 10, zIndex: 9999 - index }]}
        >
          <AlertBanner alert={alert} onRemove={onRemove} />
        </View>
      ))}

      {/* Overflow count badge */}
      {alerts.length > 3 && (
        <View style={[styles.overflowBadge, { top: 3 * 10 + 6 }]}>
          <Ionicons name="notifications" size={11} color="#fff" />
          <Text style={styles.overflowText}>+{alerts.length - 3} more alerts</Text>
        </View>
      )}
    </View>
  );
};

// ─── Alert Provider ───────────────────────────────────────────────────────────
export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  // High alerts always sorted above normal, then newest first within each group
  const sortedInsert = (prev, newAlert) => {
    const updated = [...prev, newAlert];
    return updated.sort((a, b) => {
      if (a.type === b.type) {
        return new Date(b.timestamp) - new Date(a.timestamp);
      }
      return a.type === 'high' ? -1 : 1;
    });
  };

  const addHighAlert = (title, message, reportId = null) => {
    const newAlert = {
      id:        Date.now().toString() + '_' + Math.random().toString(36).slice(2),
      type:      'high',
      title,
      message,
      reportId,
      timestamp: new Date(),
      priority:  100,
    };
    setAlerts(prev => sortedInsert(prev, newAlert));
  };

  const addNormalAlert = (title, message, reportId = null) => {
    const newAlert = {
      id:        Date.now().toString() + '_' + Math.random().toString(36).slice(2),
      type:      'normal',
      title,
      message,
      reportId,
      timestamp: new Date(),
      priority:  50,
    };
    setAlerts(prev => sortedInsert(prev, newAlert));
  };

  const removeAlert   = (id) => setAlerts(prev => prev.filter(a => a.id !== id));
  const clearAllAlerts = ()  => setAlerts([]);

  return (
    <AlertContext.Provider value={{
      alerts,
      addHighAlert,
      addNormalAlert,
      removeAlert,
      clearAllAlerts,
      highAlertCount:  alerts.filter(a => a.type === 'high').length,
      totalAlertCount: alerts.length,
    }}>
      {children}
      <AlertContainer alerts={alerts} onRemove={removeAlert} />
    </AlertContext.Provider>
  );
};

export const useAlerts = () => {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlerts must be used within AlertProvider');
  return ctx;
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 46,
    left: 0, right: 0,
    zIndex: 9999,
  },
  bannerWrapper: {
    position: 'absolute',
    left: 12, right: 12,
  },

  banner: {
    flexDirection: 'row', alignItems: 'flex-start',
    borderRadius: 16, overflow: 'hidden',
    paddingTop: 12, paddingBottom: 12,
    paddingRight: 34, paddingLeft: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14, shadowRadius: 14,
    elevation: 12,
  },
  bannerHigh: {
    backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: '#FFCDD2',
  },
  bannerNormal: {
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#C8E6C9',
  },

  accentStripe: { width: 5, alignSelf: 'stretch', marginRight: 12 },

  iconCircle: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10, flexShrink: 0, marginTop: 2,
  },

  topRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 4,
  },

  highChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFEBEE', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  highChipDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#B71C1C',
  },
  highChipText: { fontSize: 8, fontWeight: '800', color: '#B71C1C', letterSpacing: 0.6 },

  normalChip: {
    backgroundColor: '#E8F5E9', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  normalChipText: { fontSize: 8, fontWeight: '800', color: '#2E7D32', letterSpacing: 0.6 },

  timeText:    { fontSize: 10, color: '#bbb', fontWeight: '500' },
  titleText:   { fontSize: 14, fontWeight: '800', marginBottom: 3, letterSpacing: 0.2 },
  messageText: { fontSize: 12, color: '#555', lineHeight: 17, marginBottom: 3 },
  swipeHint:   { fontSize: 9,  color: '#ccc', marginBottom: 8, letterSpacing: 0.3 },

  btnRow: { flexDirection: 'row', gap: 8 },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
  },
  viewBtnText:    { fontSize: 12, fontWeight: '700', color: '#fff' },
  dismissBtn:     { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  dismissBtnText: { fontSize: 12, fontWeight: '700' },

  closeBtn: {
    position: 'absolute', top: 10, right: 10,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },

  overflowBadge: {
    position: 'absolute', alignSelf: 'center',
    left: 40, right: 40,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10, paddingVertical: 5,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5,
  },
  overflowText: { fontSize: 11, color: '#fff', fontWeight: '700' },
});