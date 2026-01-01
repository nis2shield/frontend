import { InputHTMLAttributes, useMemo } from 'react';

interface SecureInputOptions {
    /**
     * Type of the input (e.g., 'password', 'text').
     */
    type?: string;
    /**
     * Context description for telemetry (e.g., 'Login Password', 'Credit Card').
     */
    label?: string;
}

/**
 * Returns a set of props to secure an HTML input element.
 * Disables autocomplete, copy/paste, and caches to prevent sensitive data retention.
 * 
 * @param {SecureInputOptions} options Configuration options
 * @returns {InputHTMLAttributes<HTMLInputElement>} Security props object
 * 
 * @example
 * ```tsx
 * import { useSecureInput } from '@nis2shield/react-guard';
 * 
 * function CreditCardInput() {
 *   // Automatically adds: type="text", autocomplete="off", onCopy/Paste prevented
 *   const secureProps = useSecureInput({ type: 'text', label: 'Credit Card' });
 * 
 *   return (
 *     <input 
 *       {...secureProps} 
 *       className="secure-field"
 *       placeholder="0000 0000 0000 0000"
 *     />
 *   );
 * }
 * ```
 */
export const useSecureInput = (options: SecureInputOptions = {}): InputHTMLAttributes<HTMLInputElement> => {
    const secureProps = useMemo(() => {
        return {
            type: options.type || 'text',
            autoComplete: 'off',
            autoCorrect: 'off',
            autoCapitalize: 'off',
            spellCheck: false,
            'data-lpignore': 'true', // Ignore LastPass/Password managers if strictly needed (controversial)
            onPaste: (e: React.ClipboardEvent) => {
                e.preventDefault();
                // We could log this attempt if we want to be very strict
            },
            onCopy: (e: React.ClipboardEvent) => {
                e.preventDefault();
            },
            onCut: (e: React.ClipboardEvent) => {
                e.preventDefault();
            },
        } as InputHTMLAttributes<HTMLInputElement>;
    }, [options.type]);

    return secureProps;
};
