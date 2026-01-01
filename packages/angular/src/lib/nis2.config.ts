/**
 * @nis2shield/angular-guard
 * 
 * Configuration for NIS2 Shield Angular integration.
 */

import { InjectionToken } from '@angular/core';

/**
 * Configuration options for NIS2 Shield Angular Guard.
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
     * Enable warning notification before session timeout.
     * @default true
     */
    enableWarning?: boolean;

    /**
     * Seconds before timeout to emit warning.
     * @default 60
     */
    warningSecondsBeforeTimeout?: number;

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
 * Injection token for NIS2 configuration.
 */
export const NIS2_CONFIG = new InjectionToken<Nis2Config>('NIS2_CONFIG');
