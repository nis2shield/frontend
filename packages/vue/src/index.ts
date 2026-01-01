/**
 * @nis2shield/vue-guard
 * 
 * Vue 3 wrapper for NIS2 Shield - Session Guard, Secure Storage, and Security Telemetry.
 * 
 * @example
 * ```typescript
 * import { createApp } from 'vue';
 * import { createNis2Plugin, useNis2, useSecureStorage } from '@nis2shield/vue-guard';
 * 
 * const app = createApp(App);
 * 
 * app.use(createNis2Plugin({
 *   auditEndpoint: '/api/nis2/telemetry/',
 *   idleTimeoutMinutes: 15
 * }));
 * 
 * app.mount('#app');
 * ```
 * 
 * @packageDocumentation
 */

// Plugin
export { createNis2Plugin } from './plugin';

// Composables
export { useNis2, type UseNis2Return } from './composables/useNis2';
export { useSecureStorage, type UseSecureStorageOptions, type UseSecureStorageReturn } from './composables/useSecureStorage';

// Configuration
export { NIS2_KEY, type Nis2Config, type Nis2Instance } from './config';

// Re-export useful types from core
export type {
    DeviceFingerprint,
    FingerprintComparisonResult,
    EncryptedData,
    SecurityIncident
} from '@nis2shield/core';
