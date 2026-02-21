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

## Physical AI: Mixed Robot Fleet Coordination

SEMP coordinates heterogeneous robot fleets -- mobile robots, arms, humanoids, and drones -- in shared physical spaces without direct messaging.

### Scenario

A warehouse deploys 50+ robots across multiple fleets. Mobile robots pick items, arms assemble packages, and humanoids handle complex tasks. SEMP coordinates zone congestion, handoffs, and battery management through the shared environment.

```typescript
// Mobile robot detects congestion in aisle A
await client.signal({
  type: 'PROPOSAL',
  scope: 'facility/wh-1/fleet/picking/robot/mobile-07/zone_congestion',
  payload: {
    action: 'zone_congestion',
    zone_id: 'aisle-a',
    occupancy_count: 3,
    max_occupancy: 3,
    congestion_level: 'congested',
  },
  strength: 1.0,
});

// Other robots read congestion signals and reroute
const congestion = await client.read({
  scope: 'facility/wh-1/fleet/picking/*/zone_congestion',
  minStrength: 0.3,
});

if (congestion.some(s => s.payload.zone_id === 'aisle-a')) {
  // Reroute around aisle A — no direct message needed
}

// Mobile robot arrives at assembly station, signals ready for handoff
await client.signal({
  type: 'READY',
  scope: 'facility/wh-1/fleet/picking/robot/mobile-07/handoff_ready',
  payload: {
    action: 'handoff_ready',
    station_id: 'station-b',
    payload_type: 'package-SKU-4829',
  },
  strength: 1.0,
});

// Arm robot reads environment, picks up handoff
const handoffs = await client.read({
  scope: 'facility/wh-1/*/handoff_ready',
  minStrength: 0.5,
  filter: { 'payload.station_id': 'station-b' },
});

// Fleet supervisor rewards successful coordination
await client.signal({
  type: 'REWARD',
  scope: 'facility/wh-1/fleet/picking/fleet_status',
  payload: {
    value: 0.7,
    reason: 'Congestion resolved via autonomous rerouting, zero collisions',
  },
  strength: 1.0,
});
```

### How Signal Decay Works for Robots

| Signal Type | Decay Rate (λ) | Why |
|-------------|----------------|-----|
| `collision_risk` | 0.80 (fast) | Safety signals must be current — 3h half-life |
| `zone_congestion` | 0.85 (fast) | Traffic patterns change quickly — 4h half-life |
| `handoff_ready` | 0.82 (fast) | Handoff windows are time-sensitive — 3.5h half-life |
| `battery_level` | 0.97 (slow) | Battery changes gradually — 23h half-life |
| `maintenance_need` | 0.96 (slow) | Persists until addressed — 17h half-life |

**Key insight:** Safety-critical signals (collision risk) decay 10x faster than operational signals (battery level). The same decay mechanism that manages farming irrigation decisions manages robot fleet coordination.

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
