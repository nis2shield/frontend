/**
 * @nis2shield/vue-guard - Configuration
 * 
 * Configuration types for NIS2 Shield Vue integration.
 */

import type { InjectionKey } from 'vue';
import type {
    SessionGuardian,
    TelemetryReporter,
    CryptoService,
    SecureStorage,
    DeviceFingerprinter,
} from '@nis2shield/core';

/**
 * Configuration options for NIS2 Shield Vue Guard.
 */
export interface Nis2Config {
    /**
     * Backend endpoint URL for security telemetry.
     * @example "https://api.myapp.com/api/nis2/telemetry/"
     */
    auditEndpoint: string;

    /**
     * Time in minutes before the user is considered idle.
     * @default 15
     */
    idleTimeoutMinutes?: number;

    /**
     * Enable debug logging to console.
     * @default false
     */
    debug?: boolean;

    /**
     * Custom headers to include in telemetry requests.
     */
    headers?: Record<string, string>;
}

/**
 * Internal instance containing all NIS2 services.
 */
export interface Nis2Instance {
    guardian: SessionGuardian;
    reporter: TelemetryReporter;
    crypto: CryptoService;
    storage: SecureStorage;
    fingerprinter: DeviceFingerprinter;
    config: Nis2Config;
}

/**
 * Vue injection key for NIS2 Shield instance.
 */
export const NIS2_KEY: InjectionKey<Nis2Instance> = Symbol('nis2shield');
