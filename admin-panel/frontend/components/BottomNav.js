import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BottomNav = ({ active }) => {
  const router = useRouter();

  const navItems = [
    { icon: 'book-outline', label: 'ResLib', route: '/(tabs)/ResearcherHub' },
    { icon: 'home-outline', label: 'Home', route: '/(tabs)/HomeScreen' },
    { icon: 'scan-circle-outline', label: 'Specie AI', route: '/(tabs)/UploadReport' },
  ];

  const handleNavigation = (route) => {
    // Use push instead of replace for better navigation
    router.push(route);
  };

  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.label}
          style={styles.navItem}
          onPress={() => handleNavigation(item.route, item.label)}
        >
          <Ionicons
            name={item.icon}
            size={26}
            color={active === item.label ? '#2d6a4f' : '#888'}
          />
          <Text
            style={[
              styles.navText,
              active === item.label && styles.navTextSelected,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default BottomNav;

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 65,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 5,
  },
  navText: {
    fontSize: 11,
    color: '#888',
  },
  navTextSelected: {
    color: '#2d6a4f',
    fontWeight: 'bold',
  },
});