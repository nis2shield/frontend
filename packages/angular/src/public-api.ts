/**
 * @nis2shield/angular-guard
 * 
 * Angular wrapper for NIS2 Shield - Session Guard, Secure Storage, and Security Telemetry.
 * 
 * @example
 * ```typescript
 * import { Nis2Module, Nis2Service, Nis2CanActivateGuard } from '@nis2shield/angular-guard';
 * 
 * @NgModule({
 *   imports: [
 *     Nis2Module.forRoot({
 *       auditEndpoint: '/api/nis2/telemetry/',
 *       idleTimeoutMinutes: 15
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 * 
 * @packageDocumentation
 */

// Module
export { Nis2Module } from './lib/nis2.module';

// Services
export { Nis2Service } from './lib/nis2.service';

// Guards
export { Nis2CanActivateGuard } from './lib/nis2-can-activate.guard';

// Interceptors
export { Nis2Interceptor } from './lib/nis2.interceptor';

// Configuration
export { Nis2Config, NIS2_CONFIG } from './lib/nis2.config';

// Re-export useful types from core
export type {
    DeviceFingerprint,
    FingerprintComparisonResult,
    EncryptedData,
    SecurityIncident
} from '@nis2shield/core';
