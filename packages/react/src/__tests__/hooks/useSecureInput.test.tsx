import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSecureInput } from '../../hooks/useSecureInput';

describe('useSecureInput', () => {
    it('returns input props object', () => {
        const { result } = renderHook(() => useSecureInput());
        expect(result.current).toBeDefined();
        expect(typeof result.current).toBe('object');
    });

    it('defaults to text type', () => {
        const { result } = renderHook(() => useSecureInput());
        expect(result.current.type).toBe('text');
    });

    it('uses provided type', () => {
        const { result } = renderHook(() => useSecureInput({ type: 'password' }));
        expect(result.current.type).toBe('password');
    });

    it('disables autocomplete features', () => {
        const { result } = renderHook(() => useSecureInput());

        expect(result.current.autoComplete).toBe('off');
        expect(result.current.autoCorrect).toBe('off');
        expect(result.current.autoCapitalize).toBe('off');
        expect(result.current.spellCheck).toBe(false);
    });

    it('includes LastPass ignore attribute', () => {
        const { result } = renderHook(() => useSecureInput());
        expect(result.current['data-lpignore']).toBe('true');
    });

    it('prevents paste events', () => {
        const { result } = renderHook(() => useSecureInput());
        const mockEvent = { preventDefault: vi.fn() } as unknown as React.ClipboardEvent;

        result.current.onPaste?.(mockEvent);
        expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('prevents copy events', () => {
        const { result } = renderHook(() => useSecureInput());
        const mockEvent = { preventDefault: vi.fn() } as unknown as React.ClipboardEvent;

        result.current.onCopy?.(mockEvent);
        expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('prevents cut events', () => {
        const { result } = renderHook(() => useSecureInput());
        const mockEvent = { preventDefault: vi.fn() } as unknown as React.ClipboardEvent;

        result.current.onCut?.(mockEvent);
        expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('memoizes return value', () => {
        const { result, rerender } = renderHook(() => useSecureInput({ type: 'password' }));
        const firstResult = result.current;

        rerender();
        expect(result.current).toBe(firstResult);
    });
});
