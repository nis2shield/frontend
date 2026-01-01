import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import {
    CryptoService,
    DeviceFingerprinter,
    SecureStorage,
    SessionGuardian,
    TelemetryReporter,
    Nis2Config as CoreConfig
} from '@nis2shield/core';

// Re-export type for consumers
export type Nis2Config = CoreConfig;

// Backward compatibility for consumers expecting Nis2SecurityState
export interface Nis2SecurityState {
    isIdle: boolean;
    isActive: boolean;
    isCompromised: boolean;
    lastActive: number;
}

interface Nis2ContextType {
    config: Nis2Config;
    isIdle: boolean;
    isActive: boolean;
    setIdle: (idle: boolean) => void;
    reportIncident: (type: string, payload: Record<string, any>) => void;

    // Exposed Core Services
    guardian: SessionGuardian;
    fingerprinter: DeviceFingerprinter;
    storage: SecureStorage;
    telemetry: TelemetryReporter;
    crypto: CryptoService;
}

const Nis2Context = createContext<Nis2ContextType | undefined>(undefined);

interface Nis2ProviderProps {
    children: ReactNode;
    config: Nis2Config;
}

/**
 * Root provider for NIS2 Shield (Refactored to use Core SDK).
 * Initializes core services and bridges events to React state.
 */
export const Nis2Provider: React.FC<Nis2ProviderProps> = ({ children, config }) => {
    // 1. Initialize Core Services (Stable instances)
    const services = useMemo(() => {
        const crypto = new CryptoService();
        const telemetry = new TelemetryReporter({
            endpoint: config.auditEndpoint,
            debug: config.debug
        });

        const guardian = new SessionGuardian({
            idleTimeoutMinutes: config.idleTimeoutMinutes ?? 15,
            debug: config.debug
        });

        // Pass window.localStorage explicitly as default storage backend
        const storage = new SecureStorage(crypto, window.localStorage);

        const fingerprinter = new DeviceFingerprinter();

        return { crypto, telemetry, guardian, storage, fingerprinter };
    }, [config.auditEndpoint, config.idleTimeoutMinutes, config.debug]);

    // 2. React State for Reactivity
    const [isIdle, setIsIdle] = useState(false);
    const [isActive, setIsActive] = useState(true);

    // 3. Bridge Core Events to React State
    useEffect(() => {
        const { guardian, telemetry } = services;

        // Bridge events
        const handleIdle = () => {
            setIsIdle(true);
            setIsActive(false);

            // Automatic Telemetry for NIS2 compliance
            telemetry.warning('SESSION_IDLE_TIMEOUT', {
                timeoutMinutes: config.idleTimeoutMinutes,
                timestamp: new Date().toISOString()
            });
        };

        const handleActive = () => {
            setIsIdle(false);
            setIsActive(true);
        };

        const handleWarning = (data: unknown) => {
            // Expecting { secondsRemaining: number }
            const payload = data as { secondsRemaining: number };
            if (config.debug) console.log(`[NIS2] Session warning: ${payload?.secondsRemaining}s remaining`);
        };

        guardian.on('idle', handleIdle);
        guardian.on('active', handleActive);
        guardian.on('warning', handleWarning as any);

        // Start monitoring
        guardian.start();

        return () => {
            guardian.stop();
            guardian.off('idle', handleIdle);
            guardian.off('active', handleActive);
            guardian.off('warning', handleWarning as any);
        };
    }, [services, config.debug, config.idleTimeoutMinutes]);

    // 4. Wrapper for reportIncident (legacy support + core usage)
    const reportIncident = (type: string, payload: Record<string, any>) => {
        services.telemetry.report(type, payload);
    };

    // 5. Manual overrides (if needed by legacy components)
    const setIdle = (idle: boolean) => {
        if (idle) {
            // If manual setIdle(true), we trigger logic. 
            // Ideally we should call guardian.triggerIdle() but it's private.
            // We just update local state and report.
            setIsIdle(true);
            services.telemetry.warning('SESSION_IDLE_TIMEOUT_MANUAL', {});
        } else {
            services.guardian.reset();
            setIsIdle(false);
        }
    };

    const value: Nis2ContextType = {
        config: {
            ...config,
            // Ensure idleTimeoutMinutes uses defaults if not provided in config
            idleTimeoutMinutes: config.idleTimeoutMinutes ?? 15
        },
        isIdle,
        isActive,
        setIdle,
        reportIncident,
        ...services
    };

    return (
        <Nis2Context.Provider value={value}>
            {children}
        </Nis2Context.Provider>
    );
};

export const useNis2Context = () => {
    const context = useContext(Nis2Context);
    if (context === undefined) {
        throw new Error('useNis2Context must be used within a Nis2Provider');
    }
    return context;
};
