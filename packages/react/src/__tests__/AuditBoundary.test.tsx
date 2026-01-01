import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Nis2Provider } from '../context/Nis2Context';
import { AuditBoundary } from '../components/AuditBoundary';

// Component that throws an error
const BrokenComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
        throw new Error('Test error');
    }
    return <div>Working Component</div>;
};

describe('AuditBoundary', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        global.fetch = vi.fn().mockResolvedValue({ ok: true });
        // Suppress error boundary console.error
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    const renderWithProvider = (fallback?: React.ReactNode, shouldThrow = true) => {
        return render(
            <Nis2Provider config={{ auditEndpoint: '/api/test' }}>
                <AuditBoundary fallback={fallback}>
                    <BrokenComponent shouldThrow={shouldThrow} />
                </AuditBoundary>
            </Nis2Provider>
        );
    };

    it('renders children when no error', () => {
        renderWithProvider(undefined, false);
        expect(screen.getByText('Working Component')).toBeInTheDocument();
    });

    it('renders default fallback when error occurs', () => {
        renderWithProvider();
        expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
    });

    it('renders custom fallback when provided', () => {
        renderWithProvider(<div>Custom Error Message</div>);
        expect(screen.getByText('Custom Error Message')).toBeInTheDocument();
    });

    it('reports incident when error occurs', async () => {
        const mockFetch = vi.fn().mockResolvedValue({ ok: true });
        global.fetch = mockFetch;

        renderWithProvider();

        // Verify fetch was called with crash report
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                '/api/test',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('REACT_COMPONENT_CRASH'),
                })
            );
        });
    });

    it('includes error message in report', async () => {
        const mockFetch = vi.fn().mockResolvedValue({ ok: true });
        global.fetch = mockFetch;

        renderWithProvider();

        await waitFor(() => {
            const call = mockFetch.mock.calls[0];
            const body = JSON.parse(call[1].body);
            expect(body.payload.message).toBe('Test error');
        });
    });
});
