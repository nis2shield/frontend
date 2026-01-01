/**
 * @nis2shield/core - Type Definitions
 * Framework-agnostic types for NIS2 compliance features.
 */

/**
 * Configuration options for NIS2 Shield Core.
 */
export interface Nis2Config {
    /**
     * The full URL of the backend endpoint to receive audit logs and telemetry.
     * Must accept POST requests with JSON payload.
     * @example "https://api.myapp.com/api/nis2/report/"
     */
    auditEndpoint: string;

    /**
     * Time in minutes before the user is considered idle.
     * @default 15
     */
    idleTimeoutMinutes?: number;

    /**
     * Events that reset the idle timer.
     * @default ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']
     */
    activityEvents?: string[];

    /**
     * Throttle interval for activity events in milliseconds.
     * Prevents excessive timer resets from rapid mouse movements.
     * @default 1000
     */
    activityThrottleMs?: number;

    /**
     * If true, logs events to console.
     * @default false
     */
    debug?: boolean;
}

/**
 * Encrypted data structure returned by CryptoService.
 */
export interface EncryptedData {
    /** Base64-encoded initialization vector */
    iv: string;
    /** Base64-encoded ciphertext */
    data: string;
}

/**
 * Device fingerprint data for session validation.
 * Passive data collected to help detect session hijacking.
 */
export interface DeviceFingerprint {
    /** Screen resolution (e.g., "1920x1080") */
    screenResolution: string;
    /** Color depth in bits */
    colorDepth: number;
    /** Timezone offset from UTC in minutes */
    timezoneOffset: number;
    /** IANA timezone identifier (e.g., "Europe/Rome") */
    timezone: string;
    /** Browser language */
    language: string;
    /** Preferred languages array */
    languages: string[];
    /** Platform identifier */
    platform: string;
    /** Hardware concurrency (CPU cores) */
    hardwareConcurrency: number;
    /** Device memory in GB (if available) */
    deviceMemory: number | null;
    /** Touch support detection */
    touchSupport: boolean;
    /** Canvas fingerprint hash (SHA-256 of canvas rendering) */
    canvasHash: string | null;
    /** WebGL renderer identifier */
    webglRenderer: string | null;
    /** WebGL vendor identifier */
    webglVendor: string | null;
    /** Timestamp of fingerprint collection */
    collectedAt: string;
}

/**
 * Result of comparing two device fingerprints.
 */
export interface FingerprintComparisonResult {
    /** Similarity score between 0 and 1 */
    similarity: number;
    /** List of fields that don't match */
    mismatches: string[];
}

/**
 * Security incident payload for telemetry.
 */
export interface SecurityIncident {
    type: string;
    payload: Record<string, unknown>;
    timestamp: string;
    url?: string;
}

/**
 * Storage adapter interface for SecureStorage.
 * Allows custom storage backends (localStorage, sessionStorage, IndexedDB, etc.)
 */
export interface StorageAdapter {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

/**
 * Event types emitted by SessionGuardian.
 */
export type SessionGuardianEvent = 'idle' | 'active' | 'visibility-change' | 'warning';

/**
 * Event handler type for SessionGuardian events.
 */
export type SessionGuardianEventHandler = (data?: unknown) => void;
