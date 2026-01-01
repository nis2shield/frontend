import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Nis2Provider, useNis2Context } from '../context/Nis2Context';

// Test component that consumes the context
const TestConsumer = () => {
    const { config, isIdle } = useNis2Context();
    return (
        <div>
            <span data-testid="endpoint">{config.auditEndpoint}</span>
            <span data-testid="timeout">{config.idleTimeoutMinutes}</span>
            <span data-testid="idle">{isIdle ? 'idle' : 'active'}</span>
        </div>
    );
};

describe('Nis2Provider', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('provides configuration to children', () => {
        render(
            <Nis2Provider config={{ auditEndpoint: '/api/test', idleTimeoutMinutes: 10 }}>
                <TestConsumer />
            </Nis2Provider>
        );

        expect(screen.getByTestId('endpoint').textContent).toBe('/api/test');
        expect(screen.getByTestId('timeout').textContent).toBe('10');
    });

    it('defaults idleTimeoutMinutes to 15', () => {
        render(
            <Nis2Provider config={{ auditEndpoint: '/api/test' }}>
                <TestConsumer />
            </Nis2Provider>
        );

        expect(screen.getByTestId('timeout').textContent).toBe('15');
    });

    it('initializes with active security state', () => {
        render(
            <Nis2Provider config={{ auditEndpoint: '/api/test' }}>
                <TestConsumer />
            </Nis2Provider>
        );

        expect(screen.getByTestId('idle').textContent).toBe('active');
    });

    it('throws error when useNis2Context is used outside provider', () => {
        // Suppress console.error for this test
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        expect(() => render(<TestConsumer />)).toThrow(
            'useNis2Context must be used within a Nis2Provider'
        );

        consoleSpy.mockRestore();
    });
});

describe('reportIncident', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('sends incident report to auditEndpoint', async () => {
        const mockFetch = vi.fn().mockResolvedValue({ ok: true });
        global.fetch = mockFetch;

        const ReportButton = () => {
            const { reportIncident } = useNis2Context();
            return (
                <button onClick={() => reportIncident('TEST_EVENT', { foo: 'bar' })}>
                    Report
                </button>
            );
        };

        render(
            <Nis2Provider config={{ auditEndpoint: '/api/nis2/telemetry/' }}>
                <ReportButton />
            </Nis2Provider>
        );

        screen.getByRole('button').click();

        // Wait for async fetch
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                '/api/nis2/telemetry/',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                })
            );
        });
    });
});
