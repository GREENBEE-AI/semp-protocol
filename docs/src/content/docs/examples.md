---
title: Examples
description: Sample coordination scenarios using SEMP
---

## Smart Farming: Multi-Agent Field Coordination

A real-world implementation of SEMP for agricultural drone coordination.

### Scenario

Multiple drones monitor crop fields. When one drone detects a pest outbreak, it deposits a PROPOSAL signal. Other drones read this signal and converge on the affected area without any central coordinator.

```typescript
// Drone detects pest outbreak
await client.signal({
  type: 'PROPOSAL',
  payload: {
    action: 'investigate-pest',
    location: { lat: 49.9456, lon: 11.5842 },
    severity: 'high',
    cropType: 'wheat',
  },
  strength: 1.0,
});

// Other drones read high-strength proposals
const alerts = await client.read({
  type: 'PROPOSAL',
  minStrength: 0.5,
  filter: { 'payload.action': 'investigate-pest' },
});

// Drone confirms finding, reinforces the signal
await client.signal({
  type: 'REWARD',
  payload: {
    targetSignalId: alerts[0].id,
    reason: 'pest-confirmed-visual',
  },
  strength: 1.0,
});
```

### How Decay Helps

- If the pest is handled, the PROPOSAL decays naturally — drones stop converging
- If confirmed by multiple drones (REWARD), the signal stays strong — more drones investigate
- False alarms fade away without manual intervention

## Warehouse Logistics: Delivery Robot Coordination

50 delivery robots share a warehouse. No central planner.

```typescript
// Robot claims a delivery zone
await client.signal({
  type: 'PROPOSAL',
  payload: { action: 'claim-zone', zone: 'aisle-7' },
  strength: 1.0,
});

// Other robots check before entering
const claims = await client.read({
  type: 'PROPOSAL',
  filter: { 'payload.zone': 'aisle-7' },
  minStrength: 0.3,
});

if (claims.length > 0) {
  // Zone is claimed — pick a different aisle
}

// Robot finishes delivery
await client.signal({
  type: 'READY',
  payload: { task: 'delivery-complete', zone: 'aisle-7' },
  strength: 1.0,
});
```

**Result:** Zero collisions. Zero idle time. Each robot follows the strongest signal trail.

## Energy Grid: Distributed Load Balancing

1000 solar panels, 500 batteries, 1 grid. Agents signal surplus and demand.

```typescript
// Solar panel agent reports surplus
await client.signal({
  type: 'PROPOSAL',
  payload: {
    action: 'energy-available',
    source: 'panel-042',
    kwh: 3.5,
  },
  strength: 1.0,
});

// Battery agent reads surplus signals, stores energy
const surpluses = await client.read({
  type: 'PROPOSAL',
  filter: { 'payload.action': 'energy-available' },
  minStrength: 0.5,
});

// Grid agent balances based on signal landscape
// Strong signals = surplus areas, weak signals = deficit areas
```
