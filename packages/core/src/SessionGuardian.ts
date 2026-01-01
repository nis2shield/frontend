/**
 * @nis2shield/core - SessionGuardian
 * 
 * Framework-agnostic session monitoring for NIS2 compliance.
 * Handles idle timeout detection and visibility change monitoring.
 * 
 * @example
 * ```typescript
 * const guardian = new SessionGuardian({ idleTimeoutMinutes: 15 });
 * 
 * guardian.on('idle', () => {
 *   console.log('User is idle! Logging out...');
 *   window.location.href = '/logout';
 * });
 * 
 * guardian.on('active', () => {
 *   console.log('User is active again');
 * });
 * 
 * guardian.start();
 * 
 * // Cleanup on unmount
 * guardian.stop();
 * ```
 */

import type { Nis2Config, SessionGuardianEvent, SessionGuardianEventHandler } from './types';

const DEFAULT_ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
const DEFAULT_THROTTLE_MS = 1000;
const DEFAULT_TIMEOUT_MINUTES = 15;

/**
 * Monitors user activity and emits events for session management.
 * Implements Art. 21.2.h session timeout requirements.
 */
export class SessionGuardian {
    private config: Required<Pick<Nis2Config, 'idleTimeoutMinutes' | 'activityEvents' | 'activityThrottleMs' | 'debug'>>;
    private timer: ReturnType<typeof setTimeout> | null = null;
    private lastActivity: number = Date.now();
    private isIdle: boolean = false;
    private isRunning: boolean = false;
    private listeners: Map<SessionGuardianEvent, Set<SessionGuardianEventHandler>> = new Map();
    private boundHandleActivity: () => void;
    private boundHandleVisibility: () => void;

    constructor(config: Partial<Nis2Config> = {}) {
        this.config = {
            idleTimeoutMinutes: config.idleTimeoutMinutes ?? DEFAULT_TIMEOUT_MINUTES,
            activityEvents: config.activityEvents ?? DEFAULT_ACTIVITY_EVENTS,
            activityThrottleMs: config.activityThrottleMs ?? DEFAULT_THROTTLE_MS,
            debug: config.debug ?? false,
        };

        // Bind handlers once for proper cleanup
        this.boundHandleActivity = this.handleActivity.bind(this);
        this.boundHandleVisibility = this.handleVisibilityChange.bind(this);

        // Initialize listener maps
        this.listeners.set('idle', new Set());
        this.listeners.set('active', new Set());
        this.listeners.set('visibility-change', new Set());
        this.listeners.set('warning', new Set());
    }

    /**
     * Register an event listener.
     */
    on(event: SessionGuardianEvent, handler: SessionGuardianEventHandler): void {
        this.listeners.get(event)?.add(handler);
    }

    /**
     * Remove an event listener.
     */
    off(event: SessionGuardianEvent, handler: SessionGuardianEventHandler): void {
        this.listeners.get(event)?.delete(handler);
    }

    /**
     * Emit an event to all registered listeners.
     */
    private emit(event: SessionGuardianEvent, data?: unknown): void {
        if (this.config.debug) {
            console.log(`[NIS2 SessionGuardian] Event: ${event}`, data);
        }
        this.listeners.get(event)?.forEach(handler => handler(data));
    }

    /**
     * Start monitoring user activity.
     */
    start(): void {
        if (this.isRunning) return;
        this.isRunning = true;

        // Register activity event listeners
        this.config.activityEvents.forEach(event => {
            window.addEventListener(event, this.boundHandleActivity, { passive: true });
        });

        // Register visibility change listener
        document.addEventListener('visibilitychange', this.boundHandleVisibility);

        // Start the idle timer
        this.resetTimer();

        if (this.config.debug) {
            console.log('[NIS2 SessionGuardian] Started monitoring', this.config);
        }
    }

    /**
     * Stop monitoring and cleanup all listeners.
     */
    stop(): void {
        if (!this.isRunning) return;
        this.isRunning = false;

        // Clear timer
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        // Remove activity listeners
        this.config.activityEvents.forEach(event => {
            window.removeEventListener(event, this.boundHandleActivity);
        });

        // Remove visibility listener
        document.removeEventListener('visibilitychange', this.boundHandleVisibility);

        if (this.config.debug) {
            console.log('[NIS2 SessionGuardian] Stopped monitoring');
        }
    }

    /**
     * Reset the idle timer. Call this when you detect external activity.
     */
    reset(): void {
        this.lastActivity = Date.now();
        if (this.isIdle) {
            this.isIdle = false;
            this.emit('active');
        }
        this.resetTimer();
    }

    /**
     * Get the current idle state.
     */
    getIsIdle(): boolean {
        return this.isIdle;
    }

    /**
     * Get time remaining until idle timeout in milliseconds.
     */
    getTimeRemaining(): number {
        const elapsed = Date.now() - this.lastActivity;
        const timeout = this.config.idleTimeoutMinutes * 60 * 1000;
        return Math.max(0, timeout - elapsed);
    }

    /**
     * Handle user activity events with throttling.
     */
    private handleActivity(): void {
        const now = Date.now();

        // Throttle to prevent excessive processing
        if (now - this.lastActivity < this.config.activityThrottleMs) {
            return;
        }

        this.lastActivity = now;

        if (this.isIdle) {
            this.isIdle = false;
            this.emit('active');
        }

        this.resetTimer();
    }

    /**
     * Handle document visibility changes.
     */
    private handleVisibilityChange(): void {
        const isHidden = document.hidden;

        this.emit('visibility-change', { hidden: isHidden });

        if (!isHidden) {
            // Tab came back to foreground - check if we should trigger idle
            const elapsed = Date.now() - this.lastActivity;
            const timeout = this.config.idleTimeoutMinutes * 60 * 1000;

            if (elapsed >= timeout && !this.isIdle) {
                this.triggerIdle();
            } else {
                // Reset activity since user came back
                this.handleActivity();
            }
        }
    }

    /**
     * Reset the idle timeout timer.
     */
    private resetTimer(): void {
        if (this.timer) {
            clearTimeout(this.timer);
        }

        const timeoutMs = this.config.idleTimeoutMinutes * 60 * 1000;

        // Optional: emit warning before idle (e.g., 1 minute before)
        const warningMs = timeoutMs - 60000;
        if (warningMs > 0) {
            setTimeout(() => {
                if (!this.isIdle && this.isRunning) {
                    this.emit('warning', { secondsRemaining: 60 });
                }
            }, warningMs);
        }

        this.timer = setTimeout(() => {
            this.triggerIdle();
        }, timeoutMs);
    }

    /**
     * Trigger the idle state.
     */
    private triggerIdle(): void {
        if (this.isIdle) return;

        this.isIdle = true;
        this.emit('idle', {
            idleSince: this.lastActivity,
            timeoutMinutes: this.config.idleTimeoutMinutes
        });
    }
}
