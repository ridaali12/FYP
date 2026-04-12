import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export interface Alert {
  id: string;
  type: 'high' | 'normal';
  title: string;
  message: string;
  reportId?: string;
  timestamp: Date;
  priority: number;
}

interface AlertContextType {
  alerts: Alert[];
  addHighAlert: (title: string, message: string, reportId?: string) => void;
  addNormalAlert: (title: string, message: string) => void;
  removeAlert: (id: string) => void;
  clearAllAlerts: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [animValues] = useState<{ [key: string]: Animated.Value }>({});

  const addHighAlert = (title: string, message: string, reportId?: string) => {
    const newAlert: Alert = {
      id: Date.now().toString(),
      type: 'high',
      title,
      message,
      reportId,
      timestamp: new Date(),
      priority: 100,
    };
    
    setAlerts(prev => {
      const updated = [...prev, newAlert];
      return updated.sort((a, b) => b.priority - a.priority);
    });

    animValues[newAlert.id] = new Animated.Value(SCREEN_WIDTH);
    Animated.spring(animValues[newAlert.id], {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const addNormalAlert = (title: string, message: string) => {
    const newAlert: Alert = {
      id: Date.now().toString(),
      type: 'normal',
      title,
      message,
      timestamp: new Date(),
      priority: 50,
    };
    
    setAlerts(prev => {
      const updated = [...prev, newAlert];
      return updated.sort((a, b) => b.priority - a.priority);
    });

    animValues[newAlert.id] = new Animated.Value(SCREEN_WIDTH);
    Animated.spring(animValues[newAlert.id], {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const removeAlert = (id: string) => {
    Animated.timing(animValues[id], {
      toValue: SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
      delete animValues[id];
    });
  };

  const clearAllAlerts = () => {
    Object.keys(animValues).forEach(id => {
      Animated.timing(animValues[id], {
        toValue: SCREEN_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
    setTimeout(() => {
      setAlerts([]);
    }, 300);
  };

  return (
    <AlertContext.Provider value={{
      alerts,
      addHighAlert,
      addNormalAlert,
      removeAlert,
      clearAllAlerts,
    }}>
      {children}
      <AlertContainer alerts={alerts} animValues={animValues} onRemove={removeAlert} />
    </AlertContext.Provider>
  );
};

interface AlertContainerProps {
  alerts: Alert[];
  animValues: { [key: string]: Animated.Value };
  onRemove: (id: string) => void;
}

const AlertContainer: React.FC<AlertContainerProps> = ({ alerts, animValues, onRemove }) => {
  const router = useRouter();

  const handleViewReport = (reportId: string) => {
    router.push(`/(tabs)/ReportsFeed`);
  };

  const onGestureEvent = (alertId: string, gestureEvent: any) => {
    const { translateX } = gestureEvent.nativeEvent;
    animValues[alertId].setValue(translateX);
  };

  const onHandlerStateChange = (alertId: string, event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translateX, velocityX } = event.nativeEvent;
      
      if (Math.abs(translateX) > SCREEN_WIDTH * 0.3 || Math.abs(velocityX) > 500) {
        onRemove(alertId);
      } else {
        Animated.spring(animValues[alertId], {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
  };

  return (
    <View style={{ position: 'absolute', top: 50, left: 0, right: 0, zIndex: 9999 }}>
      {alerts.map((alert, index) => (
        <PanGestureHandler
          key={alert.id}
          onGestureEvent={(event) => onGestureEvent(alert.id, event)}
          onHandlerStateChange={(event) => onHandlerStateChange(alert.id, event)}
        >
          <Animated.View
            style={[
              {
                transform: [{ translateX: animValues[alert.id] }],
                backgroundColor: alert.type === 'high' ? '#FF5252' : '#4CAF50',
                marginHorizontal: 16,
                marginVertical: 4,
                borderRadius: 12,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
                flexDirection: 'row',
                alignItems: 'center',
                zIndex: 9999 - index,
              },
            ]}
          >
            {/* Alert Icon */}
            <View style={{ marginRight: 12 }}>
              {alert.type === 'high' ? (
                <Ionicons name="warning" size={24} color="#FFFFFF" />
              ) : (
                <Ionicons name="notifications" size={24} color="#FFFFFF" />
              )}
            </View>

            {/* Alert Content */}
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                {alert.title}
              </Text>
              <Text style={{ color: '#FFFFFF', fontSize: 14, opacity: 0.9, marginBottom: 8 }}>
                {alert.message}
              </Text>
              
              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {alert.reportId && (
                  <TouchableOpacity
                    onPress={() => handleViewReport(alert.reportId!)}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>
                      View Report
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => onRemove(alert.id)}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>
                    Dismiss
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </PanGestureHandler>
      ))}
    </View>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};
