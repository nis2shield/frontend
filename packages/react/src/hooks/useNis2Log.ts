import { useCallback } from 'react';
import { useNis2Context } from '../context/Nis2Context';

/**
 * Hook to manually report security events or warnings to the centralized logging system.
 * Useful for catching business logic errors, validation failures, or suspicious user behavior.
 * 
 * @example
 * ```tsx
 * import { useNis2Log } from '@nis2shield/react-guard';
 * 
 * function PaymentForm() {
 *   const { logWarning, logCritical } = useNis2Log();
 * 
 *   const handlePayment = (amount: number) => {
 *     if (amount > 10000) {
 *       // Audit trail for significant actions
 *       logWarning('HIGH_VALUE_TRANSACTION', { amount, currency: 'EUR' });
 *     }
 * 
 *     if (isSuspiciousIp()) {
 *       logCritical('SUSPICIOUS_PAYMENT_ATTEMPT', { ip: currentIp });
 *       return;
 *     }
 *   };
 * }
 * ```
 */
export const useNis2Log = () => {
    const { reportIncident } = useNis2Context();

    const logInfo = useCallback((event: string, meta: Record<string, any> = {}) => {
        reportIncident('INFO', { event, ...meta });
    }, [reportIncident]);

    const logWarning = useCallback((event: string, meta: Record<string, any> = {}) => {
        reportIncident('WARNING', { event, ...meta });
    }, [reportIncident]);

    const logCritical = useCallback((event: string, meta: Record<string, any> = {}) => {
        reportIncident('CRITICAL', { event, ...meta });
    }, [reportIncident]);

    return {
        logInfo,
        logWarning,
        logCritical
    };
};
