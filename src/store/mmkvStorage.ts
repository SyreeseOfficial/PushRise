import {createMMKV} from 'react-native-mmkv';
import {createJSONStorage} from 'zustand/middleware';

export function makeMMKVStorage(id?: string) {
  const mmkv = createMMKV(id ? {id} : undefined);
  return createJSONStorage(() => ({
    getItem: (key: string) => mmkv.getString(key) ?? null,
    setItem: (key: string, value: string) => mmkv.set(key, value),
    removeItem: (key: string) => mmkv.delete(key),
  }));
}
