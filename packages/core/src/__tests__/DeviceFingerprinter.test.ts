/**
 * DeviceFingerprinter Tests
 * 
 * Tests for device fingerprint collection and comparison.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeviceFingerprinter } from '../DeviceFingerprinter';
import type { DeviceFingerprint } from '../types';

describe('DeviceFingerprinter', () => {
    let fingerprinter: DeviceFingerprinter;

    beforeEach(() => {
        // Mock browser APIs
        vi.stubGlobal('screen', {
            width: 1920,
            height: 1080,
            colorDepth: 24,
        });

        vi.stubGlobal('navigator', {
            language: 'en-US',
            languages: ['en-US', 'en'],
            platform: 'MacIntel',
            hardwareConcurrency: 8,
            deviceMemory: 16,
            maxTouchPoints: 0,
        });

        fingerprinter = new DeviceFingerprinter();
    });

    describe('collect', () => {
        it('should collect screen information', async () => {
            const fp = await fingerprinter.collect();

            expect(fp.screenResolution).toBe('1920x1080');
            expect(fp.colorDepth).toBe(24);
        });

        it('should collect language information', async () => {
            const fp = await fingerprinter.collect();

            expect(fp.language).toBe('en-US');
            expect(fp.languages).toEqual(['en-US', 'en']);
        });

        it('should collect platform information', async () => {
            const fp = await fingerprinter.collect();

            expect(fp.platform).toBe('MacIntel');
            expect(fp.hardwareConcurrency).toBe(8);
            expect(fp.deviceMemory).toBe(16);
        });

        it('should collect timezone information', async () => {
            const fp = await fingerprinter.collect();

            expect(fp.timezone).toBeTruthy();
            expect(typeof fp.timezoneOffset).toBe('number');
        });

        it('should include timestamp', async () => {
            const fp = await fingerprinter.collect();

            expect(fp.collectedAt).toBeTruthy();
            // Should be ISO format
            expect(() => new Date(fp.collectedAt)).not.toThrow();
        });

        it('should detect touch support', async () => {
            const fp = await fingerprinter.collect();

            expect(typeof fp.touchSupport).toBe('boolean');
        });

        it('should handle missing deviceMemory', async () => {
            vi.stubGlobal('navigator', {
                ...navigator,
                deviceMemory: undefined,
            });

            const fp = await fingerprinter.collect();
            expect(fp.deviceMemory).toBeNull();
        });
    });

    describe('compare', () => {
        const baseFingerprint: DeviceFingerprint = {
            screenResolution: '1920x1080',
            colorDepth: 24,
            timezoneOffset: -60,
            timezone: 'Europe/Rome',
            language: 'en-US',
            languages: ['en-US'],
            platform: 'MacIntel',
            hardwareConcurrency: 8,
            deviceMemory: 16,
            touchSupport: false,
            canvasHash: 'abc123',
            webglRenderer: 'ANGLE (Apple, Apple M1, OpenGL 4.1)',
            webglVendor: 'Google Inc.',
            collectedAt: new Date().toISOString(),
        };

        it('should return 1.0 similarity for identical fingerprints', () => {
            const result = fingerprinter.compare(baseFingerprint, { ...baseFingerprint });

            expect(result.similarity).toBe(1);
            expect(result.mismatches).toHaveLength(0);
        });

        it('should detect screen resolution mismatch', () => {
            const modified = { ...baseFingerprint, screenResolution: '1366x768' };

            const result = fingerprinter.compare(baseFingerprint, modified);

            expect(result.similarity).toBeLessThan(1);
            expect(result.mismatches).toContain('screenResolution');
        });

        it('should detect timezone mismatch', () => {
            const modified = { ...baseFingerprint, timezone: 'America/New_York' };

            const result = fingerprinter.compare(baseFingerprint, modified);

            expect(result.mismatches).toContain('timezone');
        });

        it('should detect canvas hash mismatch', () => {
            const modified = { ...baseFingerprint, canvasHash: 'different-hash' };

            const result = fingerprinter.compare(baseFingerprint, modified);

            expect(result.mismatches).toContain('canvasHash');
        });

        it('should calculate correct similarity with multiple mismatches', () => {
            const modified = {
                ...baseFingerprint,
                screenResolution: 'different',
                timezone: 'different',
                canvasHash: 'different',
                webglRenderer: 'different',
            };

            const result = fingerprinter.compare(baseFingerprint, modified);

            // 4 out of 8 fields different = 50% similarity
            expect(result.similarity).toBe(0.5);
            expect(result.mismatches).toHaveLength(4);
        });

        it('should ignore non-critical fields in comparison', () => {
            const modified = {
                ...baseFingerprint,
                collectedAt: 'different-timestamp',
                languages: ['de-DE'],
                touchSupport: true,
                deviceMemory: 8,
            };

            const result = fingerprinter.compare(baseFingerprint, modified);

            // These fields are not part of the comparison
            expect(result.similarity).toBe(1);
        });
    });
});
