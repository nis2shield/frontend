# React NIS2 Guard (@nis2shield/react-guard)

[![npm version](https://badge.fury.io/js/@nis2shield%2Freact-guard.svg)](https://badge.fury.io/js/@nis2shield%2Freact-guard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![CI](https://github.com/nis2shield/react-guard/actions/workflows/ci.yml/badge.svg)](https://github.com/nis2shield/react-guard/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)


**Client-Side Security Telemetry & Session Protection for NIS2 Compliance.**

## Why this package?

Companies subject to NIS2 Directive require strict session management, audit logs, and client-side security controls. This library provides drop-in React components to handle:

1. **Automatic session termination** (Idle Timer) - Art. 21.2.h
2. **Visual protection** against shoulder surfing (Tab Napping)
3. **Security event hooks** for SIEM integration
4. **Encrypted local storage** for sensitive data (GDPR-compliant)

`@nis2shield/react-guard` acts as the "sentinel" for your frontend applications, integrating with any **NIS2 Shield Backend Adapter** (Django, Express, Spring) to provide end-to-end compliance coverage.

> **Part of the NIS2 Shield Ecosystem**: Use with [infrastructure](https://github.com/nis2shield/infrastructure) for **Demonstrable Compliance** (audited via `tfsec`).

## ✨ Features

- **🛡️ Session Watchdog**: Detects user inactivity and "Tab Napping" (background tab hijacking risks)
- **📡 Telemetry Engine**: Automatically captures React component crashes (`AuditBoundary`) and sends sanitized reports to your SIEM
- **🔐 Secure Storage**: Drop-in replacement for `localStorage`/`sessionStorage` with AES-GCM encryption
- **⌨️ Secure Input**: Pre-configured props to harden input fields against caching and clipboard
- **🔍 Device Fingerprinting** *(v0.2.0+)*: Passive device fingerprint collection for session hijacking detection
- **⚠️ Security Banner** *(v0.2.0+)*: Warns users about insecure connections (HTTP) and outdated browsers

## 📦 Installation

```bash
npm install @nis2shield/react-guard
# or
yarn add @nis2shield/react-guard
```

## 🚀 Quick Start

### 1. Wrap your App

```tsx
import { Nis2Provider, SessionWatchdog, AuditBoundary } from '@nis2shield/react-guard';

function App() {
  return (
    <Nis2Provider 
      config={{
        auditEndpoint: '/api/nis2/telemetry/',
        idleTimeoutMinutes: 15,
        debug: process.env.NODE_ENV === 'development'
      }}
    >
      <AuditBoundary fallback={<h1>Security Alert</h1>}>
        <SessionWatchdog onIdle={() => window.location.href = '/logout'} />
        <YourMainApp />
      </AuditBoundary>
    </Nis2Provider>
  );
}
```

### 2. Protect Sensitive Data

```tsx
import { useSecureStorage } from '@nis2shield/react-guard';

const UserProfile = () => {
  const { value: iban, setValue: setIban } = useSecureStorage('user_iban', '');

  return (
    <input 
      value={iban} 
      onChange={(e) => setIban(e.target.value)} 
      placeholder="IBAN (Encrypted locally)"
    />
  );
};
```

### 3. Harden Input Fields

```tsx
import { useSecureInput } from '@nis2shield/react-guard';

const PasswordField = () => {
  const secureProps = useSecureInput({ type: 'password' });
  return <input {...secureProps} placeholder="Enter Password" />;
};
```

### 4. Report Custom Incidents

```tsx
import { useNis2Log } from '@nis2shield/react-guard';

const TransferMoney = () => {
  const { logWarning } = useNis2Log();

  const handleTransfer = (amount: number) => {
    if (amount > 10000) {
      logWarning('HIGH_VALUE_TRANSACTION_ATTEMPT', { amount });
    }
  };
};
```

### 5. Device Fingerprinting (v0.2.0+)

Collect passive device fingerprints to detect session hijacking:

```tsx
import { useDeviceFingerprint } from '@nis2shield/react-guard';

const LoginPage = () => {
  const { fingerprint, isLoading, sendToBackend } = useDeviceFingerprint();

  const handleLogin = async () => {
    // Send fingerprint with login for backend validation
    sendToBackend();
    // ... rest of login logic
  };

  return <button onClick={handleLogin} disabled={isLoading}>Login</button>;
};
```

**Collected data:**
- Screen resolution, color depth
- Timezone, language, platform
- Hardware concurrency, device memory
- Canvas fingerprint (SHA-256 hash)
- WebGL renderer/vendor

## 🔗 NIS2 Shield Ecosystem

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  @nis2shield/react-guard                                    │
│  ├── SessionWatchdog (idle detection)                       │
│  ├── AuditBoundary (crash reports)                         │
│  ├── useDeviceFingerprint (session validation)             │
│  └── → POST /api/nis2/telemetry/                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend (NIS2 Adapter)                      │
│  Supported: Django, Express, Spring Boot, .NET            │
│  ├── ForensicLogger (HMAC signed logs)                     │
│  ├── RateLimiter, SessionGuard, TorBlocker                 │
│  └── → SIEM (Elasticsearch, Splunk, QRadar, etc.)          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure                            │
│  nis2shield/infrastructure                                  │
│  ├── Centralized Logging (ELK/Splunk)                       │
│  ├── Compliance Reporting (Automatic PDF generation)        │
│  └── Audited Deployment (Terraform/Helm)                    │
└─────────────────────────────────────────────────────────────┘
```

## 📖 Recipes

### Banking Dashboard with Auto-Logout

```tsx
import { Nis2Provider, SessionWatchdog, AuditBoundary, useSecureStorage } from '@nis2shield/react-guard';

function BankingApp() {
  return (
    <Nis2Provider config={{ idleTimeoutMinutes: 5, auditEndpoint: '/api/audit/' }}>
      <AuditBoundary fallback={<SecurityLockScreen />}>
        <SessionWatchdog 
          onIdle={() => { 
            window.location.href = '/logout?reason=idle';
          }} 
        />
        <Dashboard />
      </AuditBoundary>
    </Nis2Provider>
  );
}
```

### Protected Form with Encrypted Fields

```tsx
import { useSecureStorage, useSecureInput } from '@nis2shield/react-guard';

const PaymentForm = () => {
  const { value: cardNumber, setValue: setCardNumber } = useSecureStorage('card', '');
  const secureProps = useSecureInput({ type: 'password' });
  
  return (
    <form>
      <input 
        value={cardNumber} 
        onChange={(e) => setCardNumber(e.target.value)}
        placeholder="Card Number (encrypted locally)"
      />
      <input {...secureProps} placeholder="CVV" />
    </form>
  );
};
```

### Login with Device Fingerprinting

```tsx
import { useDeviceFingerprint, useNis2Log } from '@nis2shield/react-guard';

const LoginPage = () => {
  const { fingerprint, sendToBackend } = useDeviceFingerprint();
  const { logWarning } = useNis2Log();

  const handleLogin = async (credentials) => {
    // Send fingerprint with login for session hijacking detection
    await sendToBackend();
    
    // Log high-risk attempts
    if (credentials.failedAttempts > 3) {
      logWarning('BRUTE_FORCE_ATTEMPT', { attempts: credentials.failedAttempts });
    }
  };
};
```

## 🧪 Development

```bash
npm install      # Install dependencies
npm test         # Run test suite (35 tests)
npm run build    # Build for production
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

**[Documentation](https://nis2shield.com)** · **[npm](https://www.npmjs.com/package/@nis2shield/react-guard)** · **[Changelog](CHANGELOG.md)**
