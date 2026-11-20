import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { FallAlertModal } from '../src/components/FallAlertModal';
import { useSafetyStore } from '../src/store/safetyStore';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { initI18n } from '../src/i18n';

function ThemedAppContent() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const isStoreDemoMode = useSafetyStore((s) => s.isDemoMode);
  const isEnvDemoMode = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
  const showDemoBanner = isStoreDemoMode || isEnvDemoMode;

  useEffect(() => {
    initI18n().catch(() => {});
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.surface} />

      {/* High-Contrast Demo Mode Top Indicator */}
      {showDemoBanner && (
        <View style={[styles.demoBanner, { backgroundColor: colors.demoBannerBg }]}>
          <Text style={[styles.demoBadge, { backgroundColor: colors.surface, color: colors.warningText }]}>
            {t('common.demo_badge')}
          </Text>
          <Text style={[styles.demoText, { color: colors.demoBannerText }]}>
            {t('common.demo_banner')}
          </Text>
        </View>
      )}

      {/* Global Fall Alert Modal */}
      <FallAlertModal />

      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: colors.background }
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ title: t('onboarding.welcome'), headerShown: false }} />
        <Stack.Screen name="login" options={{ title: t('nav.login') }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="session" options={{ title: t('nav.session') }} />
        <Stack.Screen
          name="sos"
          options={{
            title: t('nav.sos'),
            headerStyle: { backgroundColor: colors.sosButtonBg },
            headerTintColor: colors.sosButtonText
          }}
        />
        <Stack.Screen name="triage" options={{ title: t('nav.triage') }} />
        <Stack.Screen name="vitals" options={{ title: t('nav.vitals') }} />
        <Stack.Screen name="incidents/[id]" options={{ title: t('common.status') }} />
        <Stack.Screen name="contacts" options={{ title: t('nav.contacts') }} />
        <Stack.Screen name="history" options={{ title: t('nav.history') }} />
        <Stack.Screen name="settings" options={{ title: t('nav.settings') }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ThemedAppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  demoBanner: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  demoBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3
  },
  demoText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5
  }
});
