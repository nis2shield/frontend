/**
 * TelemetryReporter Tests
 * 
 * Tests for security incident reporting.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TelemetryReporter } from '../TelemetryReporter';

describe('TelemetryReporter', () => {
    let reporter: TelemetryReporter;
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn().mockResolvedValue({ ok: true });
        vi.stubGlobal('fetch', fetchMock);

        reporter = new TelemetryReporter({
            endpoint: 'https://api.example.com/telemetry',
            debug: false,
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('report', () => {
        it('should send POST request to configured endpoint', async () => {
            await reporter.report('TEST_EVENT', { data: 'value' });

            expect(fetchMock).toHaveBeenCalledWith(
                'https://api.example.com/telemetry',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        'X-NIS2-Client-Version': expect.any(String),
                    }),
                })
            );
        });

        it('should include incident type and payload in body', async () => {
            await reporter.report('SECURITY_ALERT', { severity: 'high' });

            const call = fetchMock.mock.calls[0];
            const body = JSON.parse(call[1].body);

            expect(body.type).toBe('SECURITY_ALERT');
            expect(body.payload).toEqual({ severity: 'high' });
            expect(body.timestamp).toBeTruthy();
        });

        it('should include URL in body when in browser', async () => {
            // Mock window.location
            vi.stubGlobal('window', { location: { href: 'https://app.example.com/dashboard' } });

            await reporter.report('PAGE_VIEW', {});

            const call = fetchMock.mock.calls[0];
            const body = JSON.parse(call[1].body);

            expect(body.url).toBe('https://app.example.com/dashboard');
        });
    });

    describe('convenience methods', () => {
        it('info() should report with INFO type', async () => {
            await reporter.info('user_login', { userId: 123 });

            const body = JSON.parse(fetchMock.mock.calls[0][1].body);
            expect(body.type).toBe('INFO');
            expect(body.payload.event).toBe('user_login');
            expect(body.payload.userId).toBe(123);
        });

        it('warning() should report with WARNING type', async () => {
            await reporter.warning('suspicious_activity', { ip: '1.2.3.4' });

            const body = JSON.parse(fetchMock.mock.calls[0][1].body);
            expect(body.type).toBe('WARNING');
            expect(body.payload.event).toBe('suspicious_activity');
        });

        it('critical() should report with CRITICAL type', async () => {
            await reporter.critical('data_breach', { affectedUsers: 1000 });

            const body = JSON.parse(fetchMock.mock.calls[0][1].body);
            expect(body.type).toBe('CRITICAL');
            expect(body.payload.event).toBe('data_breach');
        });
    });

    describe('custom headers', () => {
        it('should include custom headers in request', async () => {
            const customReporter = new TelemetryReporter({
                endpoint: 'https://api.example.com/telemetry',
                headers: {
                    'X-API-Key': 'secret-key',
                    'X-Custom-Header': 'custom-value',
                },
            });

            await customReporter.report('TEST', {});

            const headers = fetchMock.mock.calls[0][1].headers;
            expect(headers['X-API-Key']).toBe('secret-key');
            expect(headers['X-Custom-Header']).toBe('custom-value');
        });
    });

    describe('error handling', () => {
        it('should not throw when fetch fails', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Network error'));

            // Should not throw
            await expect(reporter.report('TEST', {})).resolves.not.toThrow();
        });

        it('should not throw when server returns error', async () => {
            fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });

            // Should not throw
            await expect(reporter.report('TEST', {})).resolves.not.toThrow();
        });
    });

    describe('configure', () => {
        it('should allow updating endpoint', async () => {
            reporter.configure({ endpoint: 'https://new.api.com/logs' });

            await reporter.report('TEST', {});

            expect(fetchMock).toHaveBeenCalledWith(
                'https://new.api.com/logs',
                expect.any(Object)
            );
        });
    });

    describe('debug mode', () => {
        it('should log to console when debug is enabled', async () => {
            const consoleSpy = vi.spyOn(console, 'group').mockImplementation(() => { });
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
            const consoleEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => { });

            const debugReporter = new TelemetryReporter({
                endpoint: 'https://api.example.com/telemetry',
                debug: true,
            });

            await debugReporter.report('DEBUG_TEST', { foo: 'bar' });

            expect(consoleSpy).toHaveBeenCalled();
            expect(consoleLogSpy).toHaveBeenCalled();
            expect(consoleEndSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
            consoleLogSpy.mockRestore();
            consoleEndSpy.mockRestore();
        });
    });
});
