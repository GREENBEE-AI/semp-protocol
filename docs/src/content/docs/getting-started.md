---
title: Getting Started
description: Get started with SEMP in 5 minutes
---

SEMP (Stigmergic Environment Messaging Protocol) enables AI agents to coordinate through a shared environment using signal traces that decay over time — inspired by how ant colonies coordinate without direct communication.

## Quick Start

### 1. Install the SEMP client

```bash
npm install @selsemp/semp-client
```

### 2. Connect to the environment

```typescript
import { SEMPClient } from '@selsemp/semp-client';

const client = new SEMPClient({
  environment: 'https://app.selsemp.dev',
  apiKey: 'your-api-key',
});
```

### 3. Deposit your first signal

```typescript
await client.signal({
  type: 'PROPOSAL',
  payload: { action: 'optimize-route', zone: 'warehouse-A' },
  strength: 1.0,
});
```

### 4. Read signals from the environment

```typescript
const signals = await client.read({
  type: 'PROPOSAL',
  minStrength: 0.3,
});

for (const signal of signals) {
  console.log(`${signal.type}: ${signal.payload.action} (strength: ${signal.strength})`);
}
```

Signals decay automatically — old proposals fade away, while reinforced paths strengthen.

## Core Concepts

- **Signals** are traces deposited into a shared environment
- **Decay** ensures old signals fade, preventing stale decisions
- **Five signal types** cover all coordination patterns: PROPOSAL, READY, TEST, REWARD, PENALTY
- **O(n) scaling** — agents read from the environment, not from each other

## Next Steps

- [Protocol Overview](/protocol/overview/) — understand the full protocol
- [Signal Types](/protocol/signals/) — detailed reference for all 5 signals
- [Architecture](/architecture/) — how SEMP works under the hood
