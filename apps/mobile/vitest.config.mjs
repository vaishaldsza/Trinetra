import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';

export default defineConfig({
  test: {
    environment: 'node',
    alias: {
      'react-native': 'react-native-web',
      '@react-native-async-storage/async-storage': fileURLToPath(new URL('./src/__mocks__/asyncStorage.ts', import.meta.url)),
      'expo-localization': fileURLToPath(new URL('./src/__mocks__/expoLocalization.ts', import.meta.url))
    }
  }
});
