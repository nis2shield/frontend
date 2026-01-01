import { useState, useEffect, useCallback } from 'react';
import { useNis2Context } from '../context/Nis2Context';
import type { DeviceFingerprint } from '@nis2shield/core';

export type { DeviceFingerprint };

/**
 * Hook to collect device fingerprint data using `@nis2shield/core`.
 */
export function useDeviceFingerprint() {
    const { fingerprinter, reportIncident, config } = useNis2Context();
    const [fingerprint, setFingerprint] = useState<DeviceFingerprint | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const collectFingerprint = async () => {
            try {
                const fp = await fingerprinter.collect();
                setFingerprint(fp);
            } catch (error) {
                if (config.debug) {
                    console.error('Failed to collect device fingerprint:', error);
                }
            } finally {
                setIsLoading(false);
            }
        };

        collectFingerprint();
    }, [fingerprinter, config.debug]);

    const sendToBackend = useCallback(() => {
        if (fingerprint) {
            reportIncident('DEVICE_FINGERPRINT', {
                fingerprint,
                purpose: 'session_validation',
            });
        }
    }, [fingerprint, reportIncident]);

    const compareWith = useCallback((previous: DeviceFingerprint) => {
        return fingerprinter.compare(fingerprint!, previous);
    }, [fingerprinter, fingerprint]);

    return {
        fingerprint,
        isLoading,
        sendToBackend,
        compareWith,
    };
}
