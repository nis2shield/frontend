import React, { Component, ErrorInfo, ReactNode } from 'react';
// Note: ErrorBoundaries must be class components in React

interface Props {
    children: ReactNode;
    /**
     * Optional fallback UI to display when an error occurs.
     */
    fallback?: ReactNode;
}

// We need to use valid context consumption for Class Components or assume it's wrapped.
// For simplicity in this library, we'll try to use the Context if possible, or
// we can make AuditBoundary functional with a hook?
// No, ErrorBoundaries MUST be Class Components in React.
// So we will use a "Higher Order Component" or pass the report function as prop if we were strict,
// but let's try to consume context in the class.

import { useNis2Context } from '../context/Nis2Context';

// Wrapper to inject context into the class component
const AuditBoundaryWrapper: React.FC<Props> = (props) => {
    const { reportIncident } = useNis2Context();
    return <AuditBoundaryClass {...props} reportIncident={reportIncident} />;
};

interface InternalProps extends Props {
    reportIncident: (type: string, payload: Record<string, any>) => void;
}

interface State {
    hasError: boolean;
}

class AuditBoundaryClass extends Component<InternalProps, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Sanitize stack trace (remove potential sensitive paths if needed, 
        // though in browser JS paths are usually standard).
        // The main goal is to report it.

        this.props.reportIncident('REACT_COMPONENT_CRASH', {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
        });
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || <h1>Something went wrong. Security audit log created.</h1>;
        }

        return this.props.children;
    }
}

/**
 * Error Boundary that catches React component errors and reports them as security incidents.
 * Automatically allows the application to fail gracefully while ensuring the crash is logged in the SIEM.
 * 
 * **NIS2 Compliance**: Helps meet requirements for "Incident Handling" by capturing client-side failures.
 * 
 * @example
 * ```tsx
 * <AuditBoundary fallback={<SecurityErrorPage />}>
 *   <SensitiveDashboard />
 * </AuditBoundary>
 * ```
 */
export const AuditBoundary = AuditBoundaryWrapper;
