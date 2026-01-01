/**
 * @nis2shield/vue-guard - useNis2 Composable
 * 
 * Main composable for accessing NIS2 Shield functionality.
 */

import { ref, onMounted, onUnmounted, inject, type Ref } from 'vue';
import { NIS2_KEY, type Nis2Instance } from '../config';
import type { DeviceFingerprint } from '@nis2shield/core';

export interface UseNis2Return {
    /** Reactive ref indicating if user is idle */
    isIdle: Ref<boolean>;
    /** Reactive ref indicating if user is active */
    isActive: Ref<boolean>;
    /** Reactive ref with seconds remaining before timeout (null when not warning) */
    warningSeconds: Ref<number | null>;
    /** Current device fingerprint */
    fingerprint: Ref<DeviceFingerprint | null>;
    /** Manually reset the idle timer */
    resetIdleTimer: () => void;
    /** Get time remaining until idle in milliseconds */
    getTimeRemaining: () => number;
    /** Force logout and report incident */
    forceLogout: (reason?: string) => Promise<void>;
    /** Log an info-level event */
    logInfo: (event: string, meta?: Record<string, unknown>) => Promise<void>;
    /** Log a warning-level event */
    logWarning: (event: string, meta?: Record<string, unknown>) => Promise<void>;
    /** Log a critical event */
    logCritical: (event: string, meta?: Record<string, unknown>) => Promise<void>;
}

/**
 * Main composable for NIS2 Shield functionality.
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useNis2 } from '@nis2shield/vue-guard';
 * 
 * const { isIdle, warningSeconds, logWarning } = useNis2();
 * 
 * watch(isIdle, (idle) => {
 *   if (idle) window.location.href = '/logout';
 * });
 * </script>
 * 
 * <template>
 *   <div v-if="warningSeconds">
 *     ⚠️ Session expires in {{ warningSeconds }} seconds
 *   </div>
 * </template>
 * ```
 */
export function useNis2(): UseNis2Return {
    const nis2 = inject(NIS2_KEY);

    if (!nis2) {
        throw new Error('useNis2 must be used within a component where createNis2Plugin is installed');
    }

    const { guardian, reporter, fingerprinter, config } = nis2;

    // Reactive state
    const isIdle = ref(false);
    const isActive = ref(true);
    const warningSeconds = ref<number | null>(null);
    const fingerprint = ref<DeviceFingerprint | null>(null);

    // Event handlers
    const handleIdle = () => {
        isIdle.value = true;
        isActive.value = false;
        reporter.warning('SESSION_IDLE_TIMEOUT', {
            timeoutMinutes: config.idleTimeoutMinutes ?? 15,
        });
    };

    const handleActive = () => {
        isIdle.value = false;
        isActive.value = true;
        warningSeconds.value = null;
    };

    const handleWarning = (data: unknown) => {
        const { secondsRemaining } = data as { secondsRemaining: number };
        warningSeconds.value = secondsRemaining;
    };

    // Lifecycle
    onMounted(async () => {
        // Register event handlers
        guardian.on('idle', handleIdle);
        guardian.on('active', handleActive);
        guardian.on('warning', handleWarning);

        // Collect fingerprint
        try {
            fingerprint.value = await fingerprinter.collect();
        } catch (error) {
            if (config.debug) {
                console.error('[NIS2 Vue] Failed to collect fingerprint:', error);
            }
        }
    });

    onUnmounted(() => {
        guardian.off('idle', handleIdle);
        guardian.off('active', handleActive);
        guardian.off('warning', handleWarning);
    });

    // Methods
    const resetIdleTimer = () => guardian.reset();
    const getTimeRemaining = () => guardian.getTimeRemaining();

    const forceLogout = async (reason = 'manual') => {
        await reporter.warning('FORCED_LOGOUT', { reason });
        if (typeof window !== 'undefined') {
            window.location.href = `/logout?reason=${reason}`;
        }
    };

    const logInfo = async (event: string, meta: Record<string, unknown> = {}) => {
        await reporter.info(event, meta);
    };

    const logWarning = async (event: string, meta: Record<string, unknown> = {}) => {
        await reporter.warning(event, meta);
    };

    const logCritical = async (event: string, meta: Record<string, unknown> = {}) => {
        await reporter.critical(event, meta);
    };

    return {
        isIdle,
        isActive,
        warningSeconds,
        fingerprint,
        resetIdleTimer,
        getTimeRemaining,
        forceLogout,
        logInfo,
        logWarning,
        logCritical,
    };
}
