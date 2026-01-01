import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Nis2Provider } from '../context/Nis2Context';
import { SessionWatchdog } from '../components/SessionWatchdog';

describe('SessionWatchdog', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.restoreAllMocks();
        global.fetch = vi.fn().mockResolvedValue({ ok: true });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const renderWithProvider = (onIdle?: () => void, onActive?: () => void, timeout = 1) => {
        return render(
            <Nis2Provider config={{ auditEndpoint: '/api/test', idleTimeoutMinutes: timeout }}>
                <SessionWatchdog onIdle={onIdle} onActive={onActive} />
                <div data-testid="content">Content</div>
            </Nis2Provider>
        );
    };

    it('renders nothing (invisible component)', () => {
        renderWithProvider();
        expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('calls onIdle after timeout', async () => {
        const onIdle = vi.fn();
        renderWithProvider(onIdle, undefined, 1); // 1 minute timeout

        // Advance time past the idle timeout (1 minute = 60000ms)
        act(() => {
            vi.advanceTimersByTime(61 * 1000); // 61s
        });

        expect(onIdle).toHaveBeenCalled();
    });

    it('resets timer on user activity', () => {
        const onIdle = vi.fn();
        renderWithProvider(onIdle, undefined, 1);

        // Advance time partially
        act(() => {
            vi.advanceTimersByTime(30 * 1000);
        });

        // Simulate user activity
        act(() => {
            fireEvent.mouseDown(window);
        });

        // Advance time again, but not enough from activity to trigger idle
        act(() => {
            vi.advanceTimersByTime(30 * 1000);
        });

        expect(onIdle).not.toHaveBeenCalled();
    });

    it('calls onActive when user becomes active after being idle', async () => {
        const onActive = vi.fn();
        renderWithProvider(undefined, onActive, 1);

        // 1. Go Idle first
        act(() => {
            vi.advanceTimersByTime(61 * 1000);
        });

        // 2. Simulate User Activity
        act(() => {
            fireEvent.keyDown(window);
        });

        expect(onActive).toHaveBeenCalled();
    });

    it('does NOT call onActive if already active', () => {
        const onActive = vi.fn();
        renderWithProvider(undefined, onActive, 1);

        // Already active. Activity shouldn't trigger transition.
        act(() => {
            fireEvent.keyDown(window);
        });

        expect(onActive).not.toHaveBeenCalled();
    });

    it('sends telemetry when idle timeout occurs (via Provider)', async () => {
        const mockFetch = vi.fn().mockResolvedValue({ ok: true });
        global.fetch = mockFetch;

        renderWithProvider(undefined, undefined, 1);

        // Trigger idle
        act(() => {
            vi.advanceTimersByTime(61 * 1000);
        });

        expect(mockFetch).toHaveBeenCalledWith(
            '/api/test',
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('SESSION_IDLE_TIMEOUT'),
            })
        );
    });
});
