import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SecurityBanner } from '../components/SecurityBanner';
import { Nis2Provider } from '../context/Nis2Context';

// Mock the useNis2Context hook
const mockReportIncident = vi.fn();

vi.mock('../context/Nis2Context', async () => {
    const actual = await vi.importActual('../context/Nis2Context');
    return {
        ...actual,
        useNis2Context: () => ({
            reportIncident: mockReportIncident,
            config: { auditEndpoint: '/api/test/' },
            securityState: { isIdle: false, isCompromised: false },
            setSecurityState: vi.fn(),
        }),
    };
});


describe('SecurityBanner', () => {
    const originalLocation = window.location;
    const originalNavigator = window.navigator;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        // Restore original location
        Object.defineProperty(window, 'location', {
            value: originalLocation,
            writable: true,
        });
    });

    describe('HTTPS Detection', () => {
        it('should not render banner when on HTTPS', async () => {
            Object.defineProperty(window, 'location', {
                value: {
                    protocol: 'https:',
                    hostname: 'example.com',
                },
                writable: true,
            });

            render(<SecurityBanner config={{ checkBrowserVersion: false }} />);

            // No warnings should be displayed
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });

        it('should render banner when on HTTP (non-localhost)', async () => {
            Object.defineProperty(window, 'location', {
                value: {
                    protocol: 'http:',
                    hostname: 'example.com',
                },
                writable: true,
            });

            render(<SecurityBanner config={{ checkBrowserVersion: false }} />);

            await waitFor(() => {
                expect(screen.getByRole('alert')).toBeInTheDocument();
                expect(screen.getByText(/Insecure Connection/)).toBeInTheDocument();
            });
        });

        it('should NOT render banner for localhost even on HTTP', async () => {
            Object.defineProperty(window, 'location', {
                value: {
                    protocol: 'http:',
                    hostname: 'localhost',
                },
                writable: true,
            });

            render(<SecurityBanner config={{ checkBrowserVersion: false }} />);

            // Banner should not appear for localhost
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });

        it('should report INSECURE_CONNECTION incident', async () => {
            Object.defineProperty(window, 'location', {
                value: {
                    protocol: 'http:',
                    hostname: 'example.com',
                },
                writable: true,
            });

            render(<SecurityBanner config={{ checkBrowserVersion: false }} />);

            await waitFor(() => {
                expect(mockReportIncident).toHaveBeenCalledWith('INSECURE_CONNECTION', {
                    protocol: 'http:',
                    hostname: 'example.com',
                });
            });
        });
    });

    describe('Custom Messages', () => {
        it('should display custom HTTPS warning message', async () => {
            Object.defineProperty(window, 'location', {
                value: {
                    protocol: 'http:',
                    hostname: 'example.com',
                },
                writable: true,
            });

            render(
                <SecurityBanner
                    config={{
                        httpsWarning: 'Custom HTTPS Warning!',
                        checkBrowserVersion: false,
                    }}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('Custom HTTPS Warning!')).toBeInTheDocument();
            });
        });
    });

    describe('Dismissible Banner', () => {
        it('should show dismiss button when dismissible is true', async () => {
            Object.defineProperty(window, 'location', {
                value: {
                    protocol: 'http:',
                    hostname: 'example.com',
                },
                writable: true,
            });

            render(
                <SecurityBanner
                    config={{
                        dismissible: true,
                        checkBrowserVersion: false,
                    }}
                />
            );

            await waitFor(() => {
                expect(screen.getByLabelText('Dismiss security warning')).toBeInTheDocument();
            });
        });

        it('should NOT show dismiss button when dismissible is false', async () => {
            Object.defineProperty(window, 'location', {
                value: {
                    protocol: 'http:',
                    hostname: 'example.com',
                },
                writable: true,
            });

            render(
                <SecurityBanner
                    config={{
                        dismissible: false,
                        checkBrowserVersion: false,
                    }}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('alert')).toBeInTheDocument();
            });
            expect(screen.queryByLabelText('Dismiss security warning')).not.toBeInTheDocument();
        });

        it('should dismiss banner and report incident when clicking dismiss', async () => {
            Object.defineProperty(window, 'location', {
                value: {
                    protocol: 'http:',
                    hostname: 'example.com',
                },
                writable: true,
            });

            render(
                <SecurityBanner
                    config={{
                        dismissible: true,
                        checkBrowserVersion: false,
                    }}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('alert')).toBeInTheDocument();
            });

            const dismissButton = screen.getByLabelText('Dismiss security warning');
            fireEvent.click(dismissButton);

            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
            expect(mockReportIncident).toHaveBeenCalledWith('SECURITY_BANNER_DISMISSED', {
                warnings: expect.arrayContaining([expect.stringContaining('Insecure Connection')]),
            });
        });
    });

    describe('Styling and Position', () => {
        it('should apply custom className', async () => {
            Object.defineProperty(window, 'location', {
                value: {
                    protocol: 'http:',
                    hostname: 'example.com',
                },
                writable: true,
            });

            render(
                <SecurityBanner
                    config={{
                        className: 'custom-banner-class',
                        checkBrowserVersion: false,
                    }}
                />
            );

            await waitFor(() => {
                const banner = screen.getByRole('alert');
                expect(banner).toHaveClass('custom-banner-class');
            });
        });

        it('should have correct accessibility attributes', async () => {
            Object.defineProperty(window, 'location', {
                value: {
                    protocol: 'http:',
                    hostname: 'example.com',
                },
                writable: true,
            });

            render(<SecurityBanner config={{ checkBrowserVersion: false }} />);

            await waitFor(() => {
                const banner = screen.getByRole('alert');
                expect(banner).toHaveAttribute('aria-live', 'polite');
            });
        });
    });

    describe('No Warnings Scenario', () => {
        it('should not render when no warnings are detected (HTTPS + modern browser)', () => {
            Object.defineProperty(window, 'location', {
                value: {
                    protocol: 'https:',
                    hostname: 'example.com',
                },
                writable: true,
            });

            // Simulate modern Chrome
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                configurable: true,
            });

            render(<SecurityBanner config={{ checkBrowserVersion: true }} />);

            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });
    });
});
