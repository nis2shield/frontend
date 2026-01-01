/**
 * @nis2shield/angular-guard - Nis2Service
 * 
 * Angular service wrapping the @nis2shield/core SessionGuardian.
 * Provides RxJS observables for reactive session state management.
 */

import { Injectable, Inject, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
    SessionGuardian,
    TelemetryReporter,
    CryptoService,
    SecureStorage,
    DeviceFingerprinter,
    DeviceFingerprint,
} from '@nis2shield/core';
import { NIS2_CONFIG, Nis2Config } from './nis2.config';

/**
 * Central Angular service for NIS2 Shield functionality.
 * 
 * @example
 * ```typescript
 * @Component({ ... })
 * export class AppComponent {
 *   constructor(private nis2: Nis2Service) {
 *     this.nis2.isIdle$.subscribe(isIdle => {
 *       if (isIdle) this.logout();
 *     });
 *   }
 * }
 * ```
 */
@Injectable()
export class Nis2Service implements OnDestroy {
    private guardian: SessionGuardian;
    private reporter: TelemetryReporter;
    private cryptoService: CryptoService;
    private secureStorage: SecureStorage;
    private fingerprinter: DeviceFingerprinter;

    private isIdleSubject = new BehaviorSubject<boolean>(false);
    private isActiveSubject = new BehaviorSubject<boolean>(true);
    private warningSubject = new BehaviorSubject<number | null>(null);
    private currentFingerprint: DeviceFingerprint | null = null;

    /** Observable emitting true when user becomes idle */
    readonly isIdle$: Observable<boolean> = this.isIdleSubject.asObservable();

    /** Observable emitting true when user is active */
    readonly isActive$: Observable<boolean> = this.isActiveSubject.asObservable();

    /** Observable emitting seconds remaining before timeout (null when not warning) */
    readonly warning$: Observable<number | null> = this.warningSubject.asObservable();

    constructor(
        @Inject(NIS2_CONFIG) private config: Nis2Config,
        private ngZone: NgZone
    ) {
        // Initialize core services
        this.cryptoService = new CryptoService();
        this.fingerprinter = new DeviceFingerprinter(this.cryptoService);
        this.reporter = new TelemetryReporter({
            endpoint: config.auditEndpoint,
            debug: config.debug,
            headers: config.headers,
        });
        this.secureStorage = new SecureStorage(
            this.cryptoService,
            typeof window !== 'undefined' ? localStorage : ({} as Storage),
            'nis2_'
        );

        // Create SessionGuardian outside Angular zone to avoid change detection on timers
        this.ngZone.runOutsideAngular(() => {
            this.guardian = new SessionGuardian({
                idleTimeoutMinutes: config.idleTimeoutMinutes ?? 15,
                debug: config.debug,
            });

            // Wire up events
            this.guardian.on('idle', () => {
                this.ngZone.run(() => {
                    this.isIdleSubject.next(true);
                    this.isActiveSubject.next(false);
                    this.reporter.warning('SESSION_IDLE_TIMEOUT', {
                        timeoutMinutes: config.idleTimeoutMinutes ?? 15,
                    });
                });
            });

            this.guardian.on('active', () => {
                this.ngZone.run(() => {
                    this.isIdleSubject.next(false);
                    this.isActiveSubject.next(true);
                    this.warningSubject.next(null);
                });
            });

            this.guardian.on('warning', (data: unknown) => {
                this.ngZone.run(() => {
                    const { secondsRemaining } = data as { secondsRemaining: number };
                    this.warningSubject.next(secondsRemaining);
                });
            });

            // Start monitoring
            this.guardian.start();
        });

        // Collect fingerprint
        this.collectFingerprint();

        if (this.config.debug) {
            console.log('[NIS2 Angular] Service initialized', config);
        }
    }

    /**
     * Get secure storage instance for encrypted local storage.
     */
    getSecureStorage(): SecureStorage {
        return this.secureStorage;
    }

    /**
     * Get the current device fingerprint.
     */
    getFingerprint(): DeviceFingerprint | null {
        return this.currentFingerprint;
    }

    /**
     * Manually reset the idle timer.
     */
    resetIdleTimer(): void {
        this.guardian.reset();
    }

    /**
     * Get time remaining until idle timeout in milliseconds.
     */
    getTimeRemaining(): number {
        return this.guardian.getTimeRemaining();
    }

    /**
     * Report a custom security incident.
     */
    async reportIncident(type: string, payload: Record<string, unknown> = {}): Promise<void> {
        await this.reporter.report(type, payload);
    }

    /**
     * Log an info-level security event.
     */
    async logInfo(event: string, meta: Record<string, unknown> = {}): Promise<void> {
        await this.reporter.info(event, meta);
    }

    /**
     * Log a warning-level security event.
     */
    async logWarning(event: string, meta: Record<string, unknown> = {}): Promise<void> {
        await this.reporter.warning(event, meta);
    }

    /**
     * Log a critical security event.
     */
    async logCritical(event: string, meta: Record<string, unknown> = {}): Promise<void> {
        await this.reporter.critical(event, meta);
    }

    /**
     * Send device fingerprint to backend for session validation.
     */
    async sendFingerprintToBackend(): Promise<void> {
        if (this.currentFingerprint) {
            await this.reporter.report('DEVICE_FINGERPRINT', {
                fingerprint: this.currentFingerprint,
                purpose: 'session_validation',
            });
        }
    }

    private async collectFingerprint(): Promise<void> {
        try {
            this.currentFingerprint = await this.fingerprinter.collect();
        } catch (error) {
            if (this.config.debug) {
                console.error('[NIS2 Angular] Failed to collect fingerprint:', error);
            }
        }
    }

    ngOnDestroy(): void {
        this.guardian.stop();
        this.isIdleSubject.complete();
        this.isActiveSubject.complete();
        this.warningSubject.complete();
    }
}
