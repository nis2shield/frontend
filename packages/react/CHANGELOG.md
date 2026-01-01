# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Security Banner component for HTTPS/browser warnings

## [0.2.0] - 2025-12-26

### Added
- **Device Fingerprinting** (`useDeviceFingerprint` hook)
  - Passive collection: screen, timezone, language, platform, hardware info
  - Canvas fingerprint with SHA-256 hash
  - WebGL renderer/vendor detection
  - `sendToBackend()` method for login telemetry
  - `compareWith()` for session hijack detection
- **Comprehensive Test Suite**
  - Tests for `Nis2Context`, `AuditBoundary`, `SessionWatchdog`
  - Tests for `useNis2Log`, `useSecureInput`, crypto utilities
- **Project Documentation**
  - `CHANGELOG.md` (Keep a Changelog format)
  - `CODE_OF_CONDUCT.md` (Contributor Covenant)
  - `CONTRIBUTING.md` (contribution guidelines)
  - `SECURITY.md` (responsible disclosure policy)
  - `LICENSE` (MIT)
- **GitHub Actions** CI workflow for Node 18/20
- **npm Publishing** metadata (files, repository, bugs, homepage)
- **SecurityBanner Component**
  - HTTPS connection detection and warning
  - Outdated browser detection (Chrome/Firefox/Safari/Edge)
  - Dismissible banner with telemetry
  - Customizable position and styling

## [0.1.0] - 2025-12-26

### Added
- **Nis2Provider**: Core context provider for security configuration and state management
  - Configurable audit endpoint for backend telemetry
  - Idle timeout configuration
  - Debug mode for development
- **SessionWatchdog**: Invisible component for session security
  - Idle detection with configurable timeout (default: 15 minutes)
  - Activity tracking (mouse, keyboard, touch, scroll events)
  - Tab Napping protection via visibility change detection
  - Automatic telemetry reporting on idle timeout
- **AuditBoundary**: Enhanced ErrorBoundary for security telemetry
  - Catches React component crashes
  - Sends sanitized stack traces to backend
  - Customizable fallback UI
- **useSecureStorage**: Encrypted localStorage/sessionStorage hook
  - AES-GCM encryption via Web Crypto API
  - Ephemeral session keys (cleared on page reload)
  - Support for both localStorage and sessionStorage
- **useSecureInput**: Security-hardened input props
  - Disables autocomplete, autocorrect, autocapitalize
  - Prevents copy/paste/cut operations
  - Password manager ignore option
- **useNis2Log**: Manual incident reporting hook
  - `logInfo()`, `logWarning()`, `logCritical()` methods
  - Automatic context enrichment (URL, timestamp)
- **Crypto Utilities**: Web Crypto API wrappers
  - AES-256-GCM encryption/decryption
  - Base64 encoding helpers

[Unreleased]: https://github.com/nis2shield/react-guard/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/nis2shield/react-guard/releases/tag/v0.1.0
