import React, { useState, useEffect } from 'react';
import { useNis2Context } from '../context/Nis2Context';

export interface SecurityBannerConfig {
    /**
     * Message to show when not using HTTPS.
     * @default "⚠️ Insecure Connection - This page is not served over HTTPS"
     */
    httpsWarning?: string;

    /**
     * Message to show when browser is outdated.
     * @default "⚠️ Your browser may be outdated - Please update for better security"
     */
    browserWarning?: string;

    /**
     * Show a warning for outdated browsers.
     * Currently checks for Chrome < 90, Firefox < 90, Safari < 14.
     * @default true
     */
    checkBrowserVersion?: boolean;

    /**
     * CSS class to apply to the banner container.
     */
    className?: string;

    /**
     * Custom styles to apply to the banner.
     */
    style?: React.CSSProperties;

    /**
     * Position of the banner.
     * @default 'top'
     */
    position?: 'top' | 'bottom';

    /**
     * Whether the banner can be dismissed.
     * @default false
     */
    dismissible?: boolean;
}

interface BrowserInfo {
    name: string;
    version: number;
    isOutdated: boolean;
}

const MIN_BROWSER_VERSIONS: Record<string, number> = {
    chrome: 90,
    firefox: 90,
    safari: 14,
    edge: 90,
};

function detectBrowser(): BrowserInfo {
    const ua = navigator.userAgent;
    let name = 'unknown';
    let version = 0;

    if (ua.includes('Chrome') && !ua.includes('Edg')) {
        name = 'chrome';
        const match = ua.match(/Chrome\/(\d+)/);
        version = match ? parseInt(match[1], 10) : 0;
    } else if (ua.includes('Firefox')) {
        name = 'firefox';
        const match = ua.match(/Firefox\/(\d+)/);
        version = match ? parseInt(match[1], 10) : 0;
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
        name = 'safari';
        const match = ua.match(/Version\/(\d+)/);
        version = match ? parseInt(match[1], 10) : 0;
    } else if (ua.includes('Edg')) {
        name = 'edge';
        const match = ua.match(/Edg\/(\d+)/);
        version = match ? parseInt(match[1], 10) : 0;
    }

    const minVersion = MIN_BROWSER_VERSIONS[name] || 0;
    const isOutdated = minVersion > 0 && version < minVersion;

    return { name, version, isOutdated };
}

const defaultStyles: React.CSSProperties = {
    padding: '12px 16px',
    backgroundColor: '#fef3cd',
    borderBottom: '1px solid #ffc107',
    color: '#856404',
    fontSize: '14px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
};

const positionStyles: Record<string, React.CSSProperties> = {
    top: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
    },
    bottom: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
    },
};

/**
 * SecurityBanner - Displays warnings for insecure connections and outdated browsers.
 * 
 * Part of the NIS2 compliance "Awareness" layer - helps users understand
 * when they're in a potentially risky environment.
 * 
 * @example
 * ```tsx
 * <SecurityBanner 
 *   config={{ 
 *     checkBrowserVersion: true,
 *     dismissible: true,
 *     position: 'top'
 *   }} 
 * />
 * ```
 */
export const SecurityBanner: React.FC<{ config?: SecurityBannerConfig }> = ({
    config = {}
}) => {
    const { reportIncident } = useNis2Context();
    const [dismissed, setDismissed] = useState(false);
    const [warnings, setWarnings] = useState<string[]>([]);

    const {
        httpsWarning = '⚠️ Insecure Connection - This page is not served over HTTPS',
        browserWarning = '⚠️ Your browser may be outdated - Please update for better security',
        checkBrowserVersion = true,
        className,
        style,
        position = 'top',
        dismissible = false,
    } = config;

    useEffect(() => {
        const detectedWarnings: string[] = [];

        // Check HTTPS
        if (typeof window !== 'undefined' && window.location.protocol !== 'https:') {
            // Skip localhost for development
            if (!['localhost', '127.0.0.1', ''].includes(window.location.hostname)) {
                detectedWarnings.push(httpsWarning);
                reportIncident('INSECURE_CONNECTION', {
                    protocol: window.location.protocol,
                    hostname: window.location.hostname,
                });
            }
        }

        // Check browser version
        if (checkBrowserVersion) {
            const browser = detectBrowser();
            if (browser.isOutdated) {
                detectedWarnings.push(browserWarning);
                reportIncident('OUTDATED_BROWSER', {
                    browser: browser.name,
                    version: browser.version,
                    minRequired: MIN_BROWSER_VERSIONS[browser.name],
                });
            }
        }

        setWarnings(detectedWarnings);
    }, [httpsWarning, browserWarning, checkBrowserVersion, reportIncident]);

    // Don't render if dismissed or no warnings
    if (dismissed || warnings.length === 0) {
        return null;
    }

    const handleDismiss = () => {
        setDismissed(true);
        reportIncident('SECURITY_BANNER_DISMISSED', {
            warnings,
        });
    };

    return (
        <div
            role="alert"
            aria-live="polite"
            className={className}
            style={{
                ...defaultStyles,
                ...positionStyles[position],
                ...style,
            }}
        >
            <div>
                {warnings.map((warning, index) => (
                    <div key={index}>{warning}</div>
                ))}
            </div>
            {dismissible && (
                <button
                    onClick={handleDismiss}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '18px',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        color: 'inherit',
                    }}
                    aria-label="Dismiss security warning"
                >
                    ×
                </button>
            )}
        </div>
    );
};
