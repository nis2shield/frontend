/**
 * SessionGuardian Tests
 * 
 * Tests for idle detection and activity monitoring.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionGuardian } from '../SessionGuardian';

describe('SessionGuardian', () => {
    let guardian: SessionGuardian;

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        guardian?.stop();
        vi.useRealTimers();
    });

    describe('initialization', () => {
        it('should create with default config', () => {
            guardian = new SessionGuardian();

            expect(guardian.getIsIdle()).toBe(false);
        });

        it('should accept custom timeout', () => {
            guardian = new SessionGuardian({ idleTimeoutMinutes: 5 });

            expect(guardian.getIsIdle()).toBe(false);
        });
    });

    describe('idle detection', () => {
        it('should emit idle event after timeout', () => {
            const idleHandler = vi.fn();
            guardian = new SessionGuardian({ idleTimeoutMinutes: 1 });
            guardian.on('idle', idleHandler);

            guardian.start();

            // Fast-forward 1 minute
            vi.advanceTimersByTime(60 * 1000);

            expect(idleHandler).toHaveBeenCalled();
            expect(guardian.getIsIdle()).toBe(true);
        });

        it('should not emit idle before timeout', () => {
            const idleHandler = vi.fn();
            guardian = new SessionGuardian({ idleTimeoutMinutes: 1 });
            guardian.on('idle', idleHandler);

            guardian.start();

            // Fast-forward 30 seconds
            vi.advanceTimersByTime(30 * 1000);

            expect(idleHandler).not.toHaveBeenCalled();
            expect(guardian.getIsIdle()).toBe(false);
        });

        it('should emit warning 60 seconds before idle', () => {
            const warningHandler = vi.fn();
            guardian = new SessionGuardian({ idleTimeoutMinutes: 2 });
            guardian.on('warning', warningHandler);

            guardian.start();

            // Fast-forward to 1 minute (warning at 2 min - 1 min = 1 min)
            vi.advanceTimersByTime(60 * 1000);

            expect(warningHandler).toHaveBeenCalledWith({ secondsRemaining: 60 });
        });
    });

    describe('activity reset', () => {
        it('should reset timer and emit active when reset is called', () => {
            const idleHandler = vi.fn();
            const activeHandler = vi.fn();
            guardian = new SessionGuardian({ idleTimeoutMinutes: 1 });
            guardian.on('idle', idleHandler);
            guardian.on('active', activeHandler);

            guardian.start();

            // Advance to idle
            vi.advanceTimersByTime(60 * 1000);
            expect(guardian.getIsIdle()).toBe(true);

            // Reset
            guardian.reset();

            expect(activeHandler).toHaveBeenCalled();
            expect(guardian.getIsIdle()).toBe(false);
        });

        it('should reset idle timer on activity', () => {
            const idleHandler = vi.fn();
            guardian = new SessionGuardian({ idleTimeoutMinutes: 1 });
            guardian.on('idle', idleHandler);

            guardian.start();

            // Advance 30 seconds
            vi.advanceTimersByTime(30 * 1000);

            // Reset timer
            guardian.reset();

            // Advance another 30 seconds (total 60 from start, but only 30 from reset)
            vi.advanceTimersByTime(30 * 1000);

            // Should not be idle yet
            expect(idleHandler).not.toHaveBeenCalled();

            // Advance remaining 30 seconds
            vi.advanceTimersByTime(30 * 1000);

            // Now should be idle
            expect(idleHandler).toHaveBeenCalled();
        });
    });

    describe('getTimeRemaining', () => {
        it('should return correct remaining time', () => {
            guardian = new SessionGuardian({ idleTimeoutMinutes: 2 });
            guardian.start();

            // Advance 30 seconds
            vi.advanceTimersByTime(30 * 1000);

            const remaining = guardian.getTimeRemaining();

            // Should be approximately 90 seconds (2 min - 30 sec)
            expect(remaining).toBeLessThanOrEqual(90 * 1000);
            expect(remaining).toBeGreaterThan(85 * 1000);
        });

        it('should return 0 when past timeout', () => {
            guardian = new SessionGuardian({ idleTimeoutMinutes: 1 });
            guardian.start();

            // Advance past timeout
            vi.advanceTimersByTime(120 * 1000);

            expect(guardian.getTimeRemaining()).toBe(0);
        });
    });

    describe('start/stop', () => {
        it('should not emit events after stop', () => {
            const idleHandler = vi.fn();
            guardian = new SessionGuardian({ idleTimeoutMinutes: 1 });
            guardian.on('idle', idleHandler);

            guardian.start();
            guardian.stop();

            vi.advanceTimersByTime(120 * 1000);

            expect(idleHandler).not.toHaveBeenCalled();
        });

        it('should not start twice', () => {
            guardian = new SessionGuardian({ idleTimeoutMinutes: 1 });

            guardian.start();
            guardian.start(); // Should be ignored

            // Just ensure no errors
            expect(guardian.getIsIdle()).toBe(false);
        });
    });

    describe('event listeners', () => {
        it('should allow removing listeners with off()', () => {
            const handler = vi.fn();
            guardian = new SessionGuardian({ idleTimeoutMinutes: 1 });

            guardian.on('idle', handler);
            guardian.off('idle', handler);

            guardian.start();
            vi.advanceTimersByTime(60 * 1000);

            expect(handler).not.toHaveBeenCalled();
        });
    });
});
