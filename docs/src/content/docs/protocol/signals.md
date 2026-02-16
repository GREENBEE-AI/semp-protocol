---
title: Signal Types
description: Reference for all five SEMP signal types
---

SEMP defines five signal types that cover all coordination patterns between agents.

## PROPOSAL

**Meaning:** "I suggest this action."

An agent deposits a PROPOSAL when it identifies a potential action or decision. Other agents can read proposals, evaluate them, and either reinforce (REWARD) or suppress (PENALTY) them.

```typescript
await client.signal({
  type: 'PROPOSAL',
  payload: {
    action: 'reroute-delivery',
    target: 'zone-B',
    reason: 'congestion-detected',
  },
  strength: 1.0,
});
```

**Decay:** Standard decay at λ=0.95 per time unit. Unacted proposals fade naturally.

## READY

**Meaning:** "I have completed my task."

Agents deposit READY signals to indicate task completion. This enables coordination without polling — other agents waiting on results simply watch for READY signals.

```typescript
await client.signal({
  type: 'READY',
  payload: {
    task: 'quality-inspection',
    result: 'pass',
    itemId: 'batch-4422',
  },
  strength: 1.0,
});
```

## TEST

**Meaning:** "Did this work? Validate the outcome."

TEST signals request validation from other agents. This enables distributed quality control — any agent can request peer review of a decision or outcome.

```typescript
await client.signal({
  type: 'TEST',
  payload: {
    hypothesis: 'route-B-is-faster',
    evidence: { latency_ms: 230 },
  },
  strength: 1.0,
});
```

## REWARD

**Meaning:** "This was good. Amplify it."

REWARD signals reinforce successful outcomes. They increase a signal's effective strength by the amplification factor **α = 1.2**, making successful patterns more visible to other agents.

```typescript
await client.signal({
  type: 'REWARD',
  payload: {
    targetSignalId: 'sig-abc123',
    reason: 'delivery-time-reduced-15-percent',
  },
  strength: 1.0,  // amplified by α=1.2
});
```

**Effect:** Target signal strength is multiplied by 1.2, counteracting natural decay.

## PENALTY

**Meaning:** "This was bad. Suppress it."

PENALTY signals accelerate the decay of unsuccessful outcomes. The decay constant **λ = 0.95** is applied more aggressively, causing bad patterns to disappear faster.

```typescript
await client.signal({
  type: 'PENALTY',
  payload: {
    targetSignalId: 'sig-def456',
    reason: 'route-caused-collision',
  },
  strength: 1.0,
});
```

**Effect:** Target signal decay rate increases, suppressing the pattern.

## Signal Lifecycle

1. Agent deposits signal → strength = 1.0
2. Signal decays naturally over time: S(t) = S₀ × 0.95ᵗ
3. REWARD signals amplify (× 1.2), PENALTY signals accelerate decay
4. Signals below threshold (default: 0.01) are garbage collected
5. System reaches equilibrium: good patterns persist, bad patterns vanish
