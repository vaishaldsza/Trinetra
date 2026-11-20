const storage = new Map<string, string>();

const mockAsyncStorage = {
  getItem: async (key: string): Promise<string | null> => storage.get(key) || null,
  setItem: async (key: string, value: string): Promise<void> => {
    storage.set(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    storage.delete(key);
  },
  clear: async (): Promise<void> => {
    storage.clear();
  },
  getAllKeys: async (): Promise<string[]> => Array.from(storage.keys())
};

export default mockAsyncStorage;
