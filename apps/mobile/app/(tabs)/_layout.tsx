import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/theme/ThemeContext';

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('common.app_name'),
          tabBarLabel: t('nav.home')
        }}
      />
      <Tabs.Screen
        name="demo"
        options={{
          title: t('demo.title'),
          tabBarLabel: t('nav.scenarios')
        }}
      />
    </Tabs>
  );
}
