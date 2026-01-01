/**
 * @nis2shield/core - TelemetryReporter
 * 
 * Sends security incidents and telemetry to the backend audit endpoint.
 * Provides structured logging levels for NIS2 Art. 23 incident reporting.
 * 
 * @example
 * ```typescript
 * const reporter = new TelemetryReporter({
 *   endpoint: '/api/nis2/telemetry/',
 *   debug: true
 * });
 * 
 * // Log a high-value transaction attempt
 * await reporter.warning('HIGH_VALUE_TRANSACTION', { 
 *   amount: 50000, 
 *   currency: 'EUR' 
 * });
 * 
 * // Log a critical security event
 * await reporter.critical('BRUTE_FORCE_DETECTED', {
 *   ip: '192.168.1.1',
 *   attempts: 10
 * });
 * ```
 */

import type { SecurityIncident } from './types';

const CLIENT_VERSION = '0.1.0';

/**
 * Configuration for TelemetryReporter.
 */
export interface TelemetryConfig {
    /** Backend endpoint URL */
    endpoint: string;
    /** Enable debug logging */
    debug?: boolean;
    /** Custom headers to include in requests */
    headers?: Record<string, string>;
    /** Retry failed requests */
    retry?: boolean;
    /** Maximum retry attempts */
    maxRetries?: number;
}

/**
 * Reports security incidents to the backend for SIEM integration.
 * Implements NIS2 Art. 23 incident reporting requirements.
 */
export class TelemetryReporter {
    private config: Required<TelemetryConfig>;
    private queue: SecurityIncident[] = [];
    private isProcessing: boolean = false;

    constructor(config: TelemetryConfig) {
        this.config = {
            endpoint: config.endpoint,
            debug: config.debug ?? false,
            headers: config.headers ?? {},
            retry: config.retry ?? true,
            maxRetries: config.maxRetries ?? 3,
        };
    }

    /**
     * Report a security incident to the backend.
     * 
     * @param type - Incident type/category
     * @param payload - Additional incident data
     */
    async report(type: string, payload: Record<string, unknown> = {}): Promise<void> {
        const incident: SecurityIncident = {
            type,
            payload,
            timestamp: new Date().toISOString(),
            url: typeof window !== 'undefined' ? window.location.href : undefined,
        };

        if (this.config.debug) {
            console.group('🛡️ [NIS2 Core] Incident Report');
            console.log('Type:', type);
            console.log('Payload:', payload);
            console.groupEnd();
        }

        await this.send(incident);
    }

    /**
     * Log an informational event.
     */
    async info(event: string, meta: Record<string, unknown> = {}): Promise<void> {
        await this.report('INFO', { event, ...meta });
    }

    /**
     * Log a warning event.
     */
    async warning(event: string, meta: Record<string, unknown> = {}): Promise<void> {
        await this.report('WARNING', { event, ...meta });
    }

    /**
     * Log a critical security event.
     */
    async critical(event: string, meta: Record<string, unknown> = {}): Promise<void> {
        await this.report('CRITICAL', { event, ...meta });
    }

    /**
     * Send an incident to the backend with retry logic.
     */
    private async send(incident: SecurityIncident, attempt: number = 1): Promise<void> {
        try {
            const response = await fetch(this.config.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-NIS2-Client-Version': CLIENT_VERSION,
                    ...this.config.headers,
                },
                body: JSON.stringify(incident),
            });

            if (!response.ok && this.config.retry && attempt < this.config.maxRetries) {
                // Exponential backoff
                const delay = Math.pow(2, attempt) * 100;
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.send(incident, attempt + 1);
            }
        } catch (error) {
            // Fail safely - do not crash the app if the audit server is down
            if (this.config.debug) {
                console.error('[NIS2 Core] Failed to send report:', error);
            }

            // Queue for later if retries enabled
            if (this.config.retry && attempt < this.config.maxRetries) {
                this.queue.push(incident);
                this.processQueue();
            }
        }
    }

    /**
     * Process queued incidents.
     */
    private async processQueue(): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) return;

        this.isProcessing = true;

        while (this.queue.length > 0) {
            const incident = this.queue.shift();
            if (incident) {
                await this.send(incident);
            }
            // Small delay between retries
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        this.isProcessing = false;
    }

    /**
     * Update configuration (e.g., change endpoint).
     */
    configure(config: Partial<TelemetryConfig>): void {
        Object.assign(this.config, config);
    }
}
