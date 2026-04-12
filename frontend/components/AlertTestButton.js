import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAlerts } from '@/contexts/AlertContext.js';

const AlertTestButton = () => {
  const { addHighAlert, addNormalAlert } = useAlerts();
  const [expanded, setExpanded] = useState(false);

  const testHighAlert = () => {
    addHighAlert(
      '🚨 TEST: Injured Animal',
      'This is a test high alert for injured animal reporting',
      'test-report-123'
    );
  };

  const testNormalAlert = () => {
    addNormalAlert(
      '✅ TEST: Normal Report',
      'This is a test normal alert for regular reporting'
    );
  };

  return (
    <View style={styles.wrapper}>

      {/* Expanded buttons */}
      {expanded && (
        <View style={styles.buttonsContainer}>

          {/* High Alert Button */}
          <TouchableOpacity style={styles.alertBtn} onPress={testHighAlert} activeOpacity={0.85}>
            <View style={styles.alertBtnInner}>
              <View style={[styles.alertIconBox, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="alert-circle" size={18} color="#B71C1C" />
              </View>
              <View style={styles.alertBtnText}>
                <Text style={[styles.alertBtnTitle, { color: '#B71C1C' }]}>High Alert</Text>
                <Text style={styles.alertBtnSub}>Injured animal report</Text>
              </View>
              <View style={[styles.alertDot, { backgroundColor: '#FF5252' }]} />
            </View>
          </TouchableOpacity>

          {/* Normal Alert Button */}
          <TouchableOpacity style={styles.alertBtn} onPress={testNormalAlert} activeOpacity={0.85}>
            <View style={styles.alertBtnInner}>
              <View style={[styles.alertIconBox, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
              </View>
              <View style={styles.alertBtnText}>
                <Text style={[styles.alertBtnTitle, { color: '#2E7D32' }]}>Normal Alert</Text>
                <Text style={styles.alertBtnSub}>Regular sighting report</Text>
              </View>
              <View style={[styles.alertDot, { backgroundColor: '#4CAF50' }]} />
            </View>
          </TouchableOpacity>

        </View>
      )}

      {/* FAB Toggle Button */}
      <TouchableOpacity
        style={[styles.fab, expanded && styles.fabActive]}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.9}
      >
        <Ionicons
          name={expanded ? 'close' : 'notifications'}
          size={22}
          color="#fff"
        />
        {!expanded && <View style={styles.fabBadge} />}
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 110,
    right: 16,
    alignItems: 'flex-end',
    gap: 10,
  },

  buttonsContainer: {
    gap: 8,
    alignItems: 'flex-end',
  },

  alertBtn: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    minWidth: 210,
  },

  alertBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  alertIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  alertBtnText: {
    flex: 1,
  },

  alertBtnTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  alertBtnSub: {
    fontSize: 11,
    color: '#999',
    marginTop: 1,
    fontWeight: '500',
  },

  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // FAB
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1B5E20',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },

  fabActive: {
    backgroundColor: '#555',
    shadowColor: '#000',
  },

  fabBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF5252',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
});

export default AlertTestButton;
