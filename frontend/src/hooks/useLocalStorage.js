// ✅ FILE: /frontend/src/hooks/useLocalStorage.js

import { useState, useEffect } from 'react';

/**
 * Hook: useLocalStorage
 *
 * Provides synchronized React state with localStorage persistence.
 * Automatically handles JSON serialization/deserialization and error fallback.
 *
 * @param {string} key - The localStorage key to use
 * @param {*} initialValue - Default value if none exists
 * @returns {[any, function]} State value and setter
 */
const useLocalStorage = (key, initialValue) => {
  const readValue = () => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const storedValue = window.localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : initialValue;
    } catch (error) {
      console.error(`[useLocalStorage] Error reading key "${key}":`, error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState(readValue);

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`[useLocalStorage] Error setting key "${key}":`, error);
    }
  };

  useEffect(() => {
    setStoredValue(readValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [storedValue, setValue];
};

export default useLocalStorage;
