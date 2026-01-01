/**
 * @nis2shield/vue-guard - useSecureStorage Composable
 * 
 * Composable for encrypted local storage access.
 */

import { ref, inject, type Ref } from 'vue';
import { NIS2_KEY } from '../config';

export interface UseSecureStorageOptions<T> {
    /** Storage key */
    key: string;
    /** Initial value if not found in storage */
    initialValue: T;
}

export interface UseSecureStorageReturn<T> {
    /** Reactive ref with the stored value */
    value: Ref<T>;
    /** Update the stored value */
    setValue: (newValue: T) => Promise<void>;
    /** Remove the value from storage */
    remove: () => void;
    /** Loading state while decrypting */
    isLoading: Ref<boolean>;
}

/**
 * Composable for encrypted local storage.
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useSecureStorage } from '@nis2shield/vue-guard';
 * 
 * const { value: iban, setValue: setIban, isLoading } = useSecureStorage({
 *   key: 'user_iban',
 *   initialValue: ''
 * });
 * </script>
 * 
 * <template>
 *   <input v-if="!isLoading" v-model="iban" @blur="setIban(iban)" />
 * </template>
 * ```
 */
export function useSecureStorage<T>(options: UseSecureStorageOptions<T>): UseSecureStorageReturn<T> {
    const nis2 = inject(NIS2_KEY);

    if (!nis2) {
        throw new Error('useSecureStorage must be used within a component where createNis2Plugin is installed');
    }

    const { storage, config } = nis2;

    const value = ref<T>(options.initialValue) as Ref<T>;
    const isLoading = ref(true);

    // Load initial value
    (async () => {
        try {
            const stored = await storage.get<T>(options.key);
            if (stored !== null) {
                value.value = stored;
            }
        } catch (error) {
            if (config.debug) {
                console.warn('[NIS2 Vue] SecureStorage read error:', error);
            }
        } finally {
            isLoading.value = false;
        }
    })();

    const setValue = async (newValue: T): Promise<void> => {
        value.value = newValue;
        await storage.set(options.key, newValue);
    };

    const remove = (): void => {
        storage.remove(options.key);
        value.value = options.initialValue;
    };

    return {
        value,
        setValue,
        remove,
        isLoading,
    };
}
