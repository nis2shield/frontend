# @nis2shield/vue-guard

[![npm version](https://badge.fury.io/js/@nis2shield%2Fvue-guard.svg)](https://badge.fury.io/js/@nis2shield%2Fvue-guard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue](https://img.shields.io/badge/Vue-3.3%2B-green.svg)](https://vuejs.org/)

**Enterprise-grade Vue 3 wrapper for NIS2 compliance — Session Guard, Secure Storage, and Security Telemetry.**

## Why this package?

Companies subject to the **NIS2 Directive** require strict session management and audit logs. This library provides:

1. **Automatic session termination** (Idle Timer) - `useNis2().isIdle`
2. **Encrypted local storage** (AES-256) - `useSecureStorage()`
3. **Security event hooks** - `logWarning()`, `logCritical()`
4. **Device fingerprinting** - Session hijacking detection

## Part of the NIS2 Shield Ecosystem

- **Backend**: [django-nis2-shield](https://pypi.org/project/django-nis2-shield/), [nis2-spring-shield](https://search.maven.org/artifact/com.nis2shield/nis2-spring-shield)
- **Core SDK**: [@nis2shield/core](../core) (dependency)
- **Angular**: [@nis2shield/angular-guard](../angular)
- **Infrastructure**: [nis2shield/infrastructure](https://github.com/nis2shield/infrastructure)

## Features

- 🛡️ **useNis2** — Composable with reactive `isIdle`, `warningSeconds` refs
- 💾 **useSecureStorage** — Encrypted localStorage with reactive bindings
- 📡 **createNis2Plugin** — Plugin pattern for easy setup
- ⚡ **TypeScript first** — Full type safety
import { createNis2Plugin } from '@nis2shield/vue-guard';
import App from './App.vue';

const app = createApp(App);

app.use(createNis2Plugin({
  auditEndpoint: '/api/nis2/telemetry/',
  idleTimeoutMinutes: 15,
  debug: import.meta.env.DEV
}));

app.mount('#app');
```

### 2. Use in Components

```vue
<script setup lang="ts">
import { watch } from 'vue';
import { useNis2 } from '@nis2shield/vue-guard';

const { isIdle, warningSeconds, logWarning } = useNis2();

watch(isIdle, (idle) => {
  if (idle) {
    window.location.href = '/logout?reason=idle';
  }
});

async function onHighValueTransaction(amount: number) {
  if (amount > 10000) {
    await logWarning('HIGH_VALUE_TRANSACTION', { amount, currency: 'EUR' });
  }
}
</script>

<template>
  <div v-if="warningSeconds" class="warning-banner">
    ⚠️ Session expires in {{ warningSeconds }} seconds
  </div>
</template>
```

### 3. Use Secure Storage

```vue
<script setup lang="ts">
import { useSecureStorage } from '@nis2shield/vue-guard';

const { value: iban, setValue: setIban, isLoading } = useSecureStorage({
  key: 'user_iban',
  initialValue: ''
});

async function saveIban() {
  await setIban(iban.value);
}
</script>

<template>
  <div>
    <input 
      v-if="!isLoading" 
      v-model="iban" 
      @blur="saveIban"
      placeholder="IBAN (encrypted locally)"
    />
    <span v-else>Decrypting...</span>
  </div>
</template>
```

## API Reference

### createNis2Plugin(config)

Creates the Vue plugin.

```typescript
interface Nis2Config {
  auditEndpoint: string;      // Required
  idleTimeoutMinutes?: number; // Default: 15
  debug?: boolean;             // Default: false
  headers?: Record<string, string>;
}
```

### useNis2()

Main composable for session management.

| Property/Method | Type | Description |
|----------------|------|-------------|
| `isIdle` | `Ref<boolean>` | True when user is idle |
| `isActive` | `Ref<boolean>` | True when user is active |
| `warningSeconds` | `Ref<number \| null>` | Seconds before timeout |
| `fingerprint` | `Ref<DeviceFingerprint \| null>` | Device fingerprint |
| `resetIdleTimer()` | `void` | Reset the countdown |
| `getTimeRemaining()` | `number` | Milliseconds until idle |
| `forceLogout()` | `Promise<void>` | Force logout |
| `logInfo()` | `Promise<void>` | Log info event |
| `logWarning()` | `Promise<void>` | Log warning event |
| `logCritical()` | `Promise<void>` | Log critical event |

### useSecureStorage(options)

Composable for encrypted storage.

```typescript
interface UseSecureStorageOptions<T> {
  key: string;
  initialValue: T;
}

interface UseSecureStorageReturn<T> {
  value: Ref<T>;
  setValue: (newValue: T) => Promise<void>;
  remove: () => void;
  isLoading: Ref<boolean>;
}
```

## NIS2 Compliance

| Feature | NIS2 Article |
|---------|--------------|
| Session timeout | Art. 21.2.h |
| Encrypted storage | Art. 21.2.j |
| Device fingerprinting | Art. 21.2.g |
| Incident reporting | Art. 23 |

## License

MIT License - see [LICENSE](../../LICENSE) for details.

---

**Part of the [NIS2 Shield](https://nis2shield.com) ecosystem.**
