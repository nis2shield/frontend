// Core Context & Provider
export { Nis2Provider, useNis2Context } from './context/Nis2Context';

// Components
export { AuditBoundary } from './components/AuditBoundary';
export { SessionWatchdog } from './components/SessionWatchdog';
export { SecurityBanner } from './components/SecurityBanner';

// Hooks
export { useSecureStorage } from './hooks/useSecureStorage';
export { useSecureInput } from './hooks/useSecureInput';
export { useNis2Log } from './hooks/useNis2Log';
export { useDeviceFingerprint } from './hooks/useDeviceFingerprint';

// Types
export type { Nis2Config, Nis2SecurityState } from './context/Nis2Context';
export type { DeviceFingerprint } from './hooks/useDeviceFingerprint';
export type { SecurityBannerConfig } from './components/SecurityBanner';
