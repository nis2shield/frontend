import React, { useEffect } from 'react';
import { useNis2Context } from '../context/Nis2Context';

interface Props {
    /**
     * Callback fired when the user becomes idle.
     * Useful for triggering a logout or a lock screen.
     */
    onIdle?: () => void;

    /**
     * Callback fired when the user becomes active again after being idle.
     */
    onActive?: () => void;
}

/**
 * Invisible component that monitors user activity for NIS2 compliance.
 * Handles Idle Timeout (Automatic Logout) and Tab Napping checks.
 * 
 * **Refactored**: Now delegates monitoring to the central `@nis2shield/core` SessionGuardian.
 * 
 * @example
 * // Basic usage - auto-logout after 15 minutes of inactivity
 * <SessionWatchdog onIdle={() => authService.logout()} />
 */
export const SessionWatchdog: React.FC<Props> = ({ onIdle, onActive }) => {
    const { guardian } = useNis2Context();

    useEffect(() => {
        // Event handlers
        // We use the central session guardian events

        const handleIdle = () => {
            if (onIdle) onIdle();
        };

        const handleActive = () => {
            if (onActive) onActive();
        };

        guardian.on('idle', handleIdle);
        guardian.on('active', handleActive);

        // Ensure guardian monitors
        // (It's started by Provider, but calling start() again is safe idempotent)
        guardian.start();

        return () => {
            guardian.off('idle', handleIdle);
            guardian.off('active', handleActive);
            // We do NOT stop the guardian here, as it might be shared by other components
            // or the Provider. The Provider owns the lifecycle.
        };
    }, [guardian, onIdle, onActive]);

    return null; // Render nothing
};
