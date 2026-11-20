import { isSupabaseConfigured } from '../supabase';
import { DataProvider } from './types';
import { MockDataProvider } from './MockDataProvider';
import { SupabaseDataProvider } from './SupabaseDataProvider';

// Singleton instance preserved across client renders
let providerInstance: DataProvider | null = null;

export function getDataProvider(): DataProvider {
  if (!providerInstance) {
    if (isSupabaseConfigured) {
      providerInstance = new SupabaseDataProvider();
    } else {
      providerInstance = new MockDataProvider();
    }
  }
  return providerInstance;
}

export const dataProvider = getDataProvider();

export * from './types';
export * from './mockData';
