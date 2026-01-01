/**
 * @nis2shield/core
 * 
 * Framework-agnostic NIS2 compliance core library.
 * Provides encryption, session management, device fingerprinting,
 * secure storage, and telemetry reporting.
 * 
 * @example
 * ```typescript
 * import { 
 *   CryptoService, 
 *   SessionGuardian, 
 *   SecureStorage,
 *   TelemetryReporter 
 * } from '@nis2shield/core';
 * 
 * // Initialize services
 * const crypto = new CryptoService();
 * const storage = new SecureStorage(crypto, localStorage);
 * const reporter = new TelemetryReporter({ endpoint: '/api/nis2/telemetry/' });
 * const guardian = new SessionGuardian({ idleTimeoutMinutes: 15 });
 * 
 * // Start monitoring
 * guardian.on('idle', () => reporter.warning('SESSION_IDLE_TIMEOUT'));
 * guardian.start();
 * ```
 * 
 * @packageDocumentation
 */

// Classes
export { CryptoService } from './CryptoService';
export { SessionGuardian } from './SessionGuardian';
export { DeviceFingerprinter } from './DeviceFingerprinter';
export { SecureStorage } from './SecureStorage';
export { TelemetryReporter } from './TelemetryReporter';
export type { TelemetryConfig } from './TelemetryReporter';

// Types
export type {
    Nis2Config,
    EncryptedData,
    DeviceFingerprint,
    FingerprintComparisonResult,
    SecurityIncident,
    StorageAdapter,
    SessionGuardianEvent,
    SessionGuardianEventHandler,
} from './types';
