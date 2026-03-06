import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

export const mmkvStorage = createMMKV({
  id: 'voxa-storage',
});

export const zustandStorage: StateStorage = {
  getItem: key => {
    const value = mmkvStorage.getString(key);
    return value ?? null;
  },
  setItem: (key, value) => {
    mmkvStorage.set(key, value);
  },
  removeItem: key => {
    mmkvStorage.remove(key);
  },
};
