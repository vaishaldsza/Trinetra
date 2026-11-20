import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0F172A' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarStyle: {
          backgroundColor: '#0F172A',
          borderTopColor: '#1E293B'
        },
        tabBarActiveTintColor: '#EA580C',
        tabBarInactiveTintColor: '#64748B'
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'TRINETRA Safety',
          tabBarLabel: 'Home'
        }}
      />
    </Tabs>
  );
}
