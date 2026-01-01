import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { Nis2Provider } from '../../context/Nis2Context';
import { useNis2Log } from '../../hooks/useNis2Log';

describe('useNis2Log', () => {
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.restoreAllMocks();
        mockFetch = vi.fn().mockResolvedValue({ ok: true });
        global.fetch = mockFetch;
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Nis2Provider config={{ auditEndpoint: '/api/test' }}>
            {children}
        </Nis2Provider>
    );

    it('returns logInfo, logWarning, logCritical functions', () => {
        const { result } = renderHook(() => useNis2Log(), { wrapper });

        expect(result.current.logInfo).toBeDefined();
        expect(result.current.logWarning).toBeDefined();
        expect(result.current.logCritical).toBeDefined();
    });

    it('logInfo sends INFO type incident', async () => {
        const { result } = renderHook(() => useNis2Log(), { wrapper });

        act(() => {
            result.current.logInfo('TEST_EVENT', { foo: 'bar' });
        });

        await waitFor(() => {
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.type).toBe('INFO');
            expect(body.payload.event).toBe('TEST_EVENT');
            expect(body.payload.foo).toBe('bar');
        });
    });

    it('logWarning sends WARNING type incident', async () => {
        const { result } = renderHook(() => useNis2Log(), { wrapper });

        act(() => {
            result.current.logWarning('SUSPICIOUS_ACTIVITY', { count: 5 });
        });

        await waitFor(() => {
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.type).toBe('WARNING');
            expect(body.payload.event).toBe('SUSPICIOUS_ACTIVITY');
        });
    });

    it('logCritical sends CRITICAL type incident', async () => {
        const { result } = renderHook(() => useNis2Log(), { wrapper });

        act(() => {
            result.current.logCritical('BREACH_DETECTED', { severity: 'high' });
        });

        await waitFor(() => {
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.type).toBe('CRITICAL');
            expect(body.payload.event).toBe('BREACH_DETECTED');
        });
    });

    it('includes URL and timestamp in report', async () => {
        const { result } = renderHook(() => useNis2Log(), { wrapper });

        act(() => {
            result.current.logInfo('TEST');
        });

        await waitFor(() => {
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.url).toBeDefined();
            expect(body.timestamp).toBeDefined();
        });
    });
});
