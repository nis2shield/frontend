# @nis2shield/core

[![npm version](https://badge.fury.io/js/@nis2shield%2Fcore.svg)](https://badge.fury.io/js/@nis2shield%2Fcore)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

**Enterprise-grade, framework-agnostic NIS2 compliance core library.**

## Why this package?

Companies subject to the **NIS2 Directive** (EU 2022/2555) require strict security controls:

| NIS2 Requirement | This Library Provides |
|------------------|----------------------|
| Art. 21.2.h - Access control | `SessionGuardian` - Automatic idle timeout |
| Art. 21.2.j - Cryptography | `CryptoService` - AES-GCM 256-bit encryption |
| Art. 21.2.g - Incident detection | `DeviceFingerprinter` - Session hijacking detection |
| Art. 23 - Incident notification | `TelemetryReporter` - Audit event dispatch |

**This is the foundation package.** Framework wrappers (`@nis2shield/angular-guard`, `@nis2shield/vue-guard`) consume this core.

## Part of the NIS2 Shield Ecosystem

- **Backend**: [django-nis2-shield](https://pypi.org/project/django-nis2-shield/), [nis2-spring-shield](https://search.maven.org/artifact/com.nis2shield/nis2-spring-shield), [@nis2shield/express-middleware](https://www.npmjs.com/package/@nis2shield/express-middleware)
- **Frontend**: `@nis2shield/core` (this), [@nis2shield/angular-guard](../angular), [@nis2shield/vue-guard](../vue)
- **Infrastructure**: [nis2shield/infrastructure](https://github.com/nis2shield/infrastructure) - Docker, Helm, Terraform

## Features

- 🔐 **CryptoService** - AES-GCM 256-bit encryption/decryption
- ⏱️ **SessionGuardian** - Idle timeout detection with event emitter
- 🔍 **DeviceFingerprinter** - Canvas/WebGL fingerprinting for session validation
- 💾 **SecureStorage** - Encrypted localStorage/sessionStorage wrapper
- 📡 **TelemetryReporter** - Audit event dispatch to backend

// Initialize services
const crypto = new CryptoService();
const storage = new SecureStorage(crypto, localStorage);
const reporter = new TelemetryReporter({ endpoint: '/api/nis2/telemetry/' });
const guardian = new SessionGuardian({ idleTimeoutMinutes: 15 });

// Monitor session
guardian.on('idle', async () => {
  await reporter.warning('SESSION_IDLE_TIMEOUT');
  window.location.href = '/logout';
});

guardian.on('warning', ({ secondsRemaining }) => {
  console.log(`Session will expire in ${secondsRemaining} seconds`);
});

guardian.start();
```

## API Reference

### CryptoService

```typescript
const crypto = new CryptoService();

// Encrypt
const encrypted = await crypto.encrypt('sensitive data');

// Decrypt
const decrypted = await crypto.decrypt(encrypted);

// Hash
const hash = await crypto.sha256('some string');
```

### SessionGuardian

```typescript
const guardian = new SessionGuardian({
  idleTimeoutMinutes: 15,  // Default: 15
  activityThrottleMs: 1000, // Default: 1000
  debug: false
});

guardian.on('idle', () => console.log('User is idle'));
guardian.on('active', () => console.log('User is active'));
guardian.on('warning', (data) => console.log('60 seconds remaining'));
guardian.on('visibility-change', ({ hidden }) => console.log(`Tab ${hidden ? 'hidden' : 'visible'}`));

guardian.start();
guardian.stop();
guardian.reset();
```

### SecureStorage

```typescript
const storage = new SecureStorage(crypto, localStorage, 'myapp_');

await storage.set('user_iban', 'IT60X0542811101000000123456');
const iban = await storage.get<string>('user_iban');
storage.remove('user_iban');
storage.clear(); // Remove all prefixed keys
```

### DeviceFingerprinter

```typescript
const fingerprinter = new DeviceFingerprinter();

const fingerprint = await fingerprinter.collect();
console.log(fingerprint.canvasHash);

// Compare fingerprints
const result = fingerprinter.compare(currentFP, storedFP);
if (result.similarity < 0.8) {
  console.warn('Possible session hijacking!', result.mismatches);
}
```

### TelemetryReporter

```typescript
const reporter = new TelemetryReporter({
  endpoint: '/api/nis2/telemetry/',
  debug: true,
  retry: true
});

await reporter.info('USER_LOGIN', { userId: 123 });
await reporter.warning('HIGH_VALUE_TRANSACTION', { amount: 50000 });
await reporter.critical('BRUTE_FORCE_DETECTED', { attempts: 10 });
```

## NIS2 Compliance Mapping

| Feature | NIS2 Article | Description |
|---------|--------------|-------------|
| SessionGuardian | Art. 21.2.h | Access control & session management |
| CryptoService | Art. 21.2.j | Cryptographic protection |
| SecureStorage | Art. 21.2.j | Data encryption at rest |
| DeviceFingerprinter | Art. 21.2.g | Incident detection |
| TelemetryReporter | Art. 23 | Incident notification |

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Part of the [NIS2 Shield](https://nis2shield.com) ecosystem.**
