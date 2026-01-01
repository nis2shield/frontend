import { useState, useCallback, useEffect } from 'react';
import { useNis2Context } from '../context/Nis2Context';

type StorageType = 'localStorage' | 'sessionStorage';

/**
 * A hook that works like a persistent useState, but encrypts data 
 * before saving to localStorage/sessionStorage.
 * 
 * Uses `@nis2shield/core` SecureStorage service (AES-GCM).
 */
export function useSecureStorage<T>(key: string, initialValue: T, storageType: StorageType = 'sessionStorage') {
    // We instantiate core SecureStorage dynamically to support storageType selection
    const { crypto } = useNis2Context();

    // We use a local instance to support the requested storageType
    // This is cheap because crypto service is shared (and key is cached there)

    const [storedValue, setStoredValue] = useState<T>(initialValue);
    const [isLoading, setIsLoading] = useState(true);

    const loadFromStorage = useCallback(async () => {
        setIsLoading(true);
        try {
            // Create a temporary instance for this operation
            const { SecureStorage } = await import('@nis2shield/core');
            const tempStorage = new SecureStorage(crypto, window[storageType]);

            const value = await tempStorage.get<T>(key);
            if (value !== null) {
                setStoredValue(value);
            }
        } catch (error) {
            console.warn('SecureStorage read error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [key, storageType, crypto]);

    const setValue = async (value: T) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);

            const { SecureStorage } = await import('@nis2shield/core');
            const tempStorage = new SecureStorage(crypto, window[storageType]);

            await tempStorage.set(key, valueToStore);
        } catch (error) {
            console.error('SecureStorage write error:', error);
        }
    };

    const removeValue = async () => {
        try {
            const { SecureStorage } = await import('@nis2shield/core');
            const tempStorage = new SecureStorage(crypto, window[storageType]);

            tempStorage.remove(key);
            setStoredValue(initialValue);
        } catch (error) {
            console.error('SecureStorage remove error:', error);
        }
    };

    useEffect(() => {
        loadFromStorage();
    }, [loadFromStorage]);

    return { value: storedValue, setValue, removeValue, isLoading };
}
