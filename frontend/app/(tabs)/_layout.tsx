import { Tabs } from 'expo-router';
import * as React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
          title: 'Index',
        }}
      />

      {/* ✅ Home Screen */}
      <Tabs.Screen
        name="HomeScreen"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />

      {/* ✅ Upload Report Screen — Hidden from tab bar */}
      <Tabs.Screen
        name="UploadReport"
        options={{
          href: null,
          title: 'Upload Report',
        }}
      />

      {/* ✅ Wildlife Library Screen — Hidden from tab bar */}
      <Tabs.Screen
        name="WildlifeLibrary"
        options={{
          href: null,
          title: 'Wildlife Library',
        }}
      />

      {/* ✅ Reports Feed Screen — Hidden from tab bar */}
      <Tabs.Screen
        name="ReportsFeed"
        options={{
          href: null,
          title: 'Reports Feed',
        }}
      />

      {/* ✅ User Profile Screen — Hidden from tab bar */}
      <Tabs.Screen
        name="UserProfile"
        options={{
          href: null,
          title: 'User Profile',
        }}
      />
      
      {/* ✅ Reports History Screen — Hidden from tab bar */}
      <Tabs.Screen
        name="ReportsHistory"
        options={{
          href: null,
          title: 'Reports History',
        }}
      />

      {/* ✅ Map Visualization Screen — Hidden from tab bar */}
      <Tabs.Screen
        name="MapVisualization"
        options={{
          href: null,
          title: 'Map Visualization',
        }}
      />

      {/* ✅ Verification Status Screen — Hidden from tab bar */}
      <Tabs.Screen
        name="VerificationStatus"
        options={{
          href: null,
          title: 'Verification Status',
        }}
      />

      {/* ✅ Notification Screens — Hidden from tab bar (navigated from flows) */}
      <Tabs.Screen
        name="CommunityNotifications"
        options={{
          href: null,
          title: 'Community Notifications',
        }}
      />

      <Tabs.Screen
        name="ResearcherNotifications"
        options={{
          href: null,
          title: 'Researcher Notifications',
        }}
      />

      {/* ✅ Researcher Hub Screen — Hidden from tab bar */}
      <Tabs.Screen
        name="ResearcherHub"
        options={{
          href: null,
          title: 'Researcher Hub',
        }}
      />

      {/* ✅ Create Species Card Screen — Hidden from tab bar */}
      <Tabs.Screen
        name="CreateSpeciesCard"
        options={{
          href: null,
          title: 'Create Species Card',
        }}
      />

      {/* ✅ Create Card Screen — Hidden from tab bar */}
      <Tabs.Screen
        name="CreateCard"
        options={{
          href: null,
          title: 'Create Card',
        }}
      />

      {/* ✅ Create Survey Form Screen — Hidden from tab bar */}
      <Tabs.Screen
        name="CreateSurveyForm"
        options={{
          href: null,
          title: 'Create Survey Form',
        }}
      />

      {/* ✅ Auth Screens — Hidden from tab bar */}
      <Tabs.Screen
        name="WildlifeScreen"
        options={{
          href: null,
          title: 'Wildlife Screen',
        }}
      />

      <Tabs.Screen
        name="SignInAs"
        options={{
          href: null,
          title: 'Sign In As',
        }}
      />

      <Tabs.Screen
        name="Login"
        options={{
          href: null,
          title: 'Login',
        }}
      />

      <Tabs.Screen
        name="Signup"
        options={{
          href: null,
          title: 'Signup',
        }}
      />

      <Tabs.Screen
        name="ForgetPassword"
        options={{
          href: null,
          title: 'Forget Password',
        }}
      />
      
    </Tabs>
  );
}
