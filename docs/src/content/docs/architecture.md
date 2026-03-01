---
title: Architecture Overview
---

# Architecture Overview

## System Architecture

SEL/SEMP follows a three-layer architecture designed for scalability, flexibility, and ease of integration.

```
┌────────────────────────────────────────────┐
│           Agent Layer                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │LangGraph │  │ CrewAI   │  │ AutoGen  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
└───────┼─────────────┼─────────────┼────────┘
        │             │             │
        └─────────────┴─────────────┘
                      │ SEMP Events (REST/WebSocket)
        ┌─────────────▼─────────────────────┐
        │   SEL - Shared Environment Layer  │
        │  ┌─────────────────────────────┐  │
        │  │   Event Processing Engine   │  │
        │  │   - Validation (Zod)        │  │
        │  │   - Pattern Matching        │  │
        │  │   - Trace Management        │  │
        │  └─────────────────────────────┘  │
        │  ┌─────────────────────────────┐  │
        │  │   Signal Processing Engine  │  │
        │  │   - Reward Amplification    │  │
        │  │   - Penalty Reduction       │  │
        │  │   - Exponential Decay       │  │
        │  └─────────────────────────────┘  │
        │  ┌─────────────────────────────┐  │
        │  │   Real-Time Broadcasting    │  │
        │  │   - WebSocket Server        │  │
        │  │   - Event Streaming         │  │
        │  └─────────────────────────────┘  │
        └─────────────┬───────────────────┘
                      │ Storage Interface
        ┌─────────────▼───────────────────┐
        │         Data Layer               │
        │  ┌────────────────────────────┐  │
        │  │  Storage Implementation    │  │
        │  │  - Events                  │  │
        │  │  - Signals                 │  │
        │  │  - Graph Nodes             │  │
        │  └────────────────────────────┘  │
        │                                   │
        │  [In-Memory] or [PostgreSQL]     │
        │  or [Redis] or [Neo4j]           │
        └───────────────────────────────────┘
```

## Components

### 1. Agent Layer

The agent layer consists of AI agents from various frameworks that communicate with SEL/SEMP through the SEMP protocol.

**Supported Frameworks:**
- LangGraph
- CrewAI
- AutoGen
- Custom agents (any HTTP/WebSocket client)

**Communication Methods:**
- REST API (HTTP/HTTPS)
- WebSocket (real-time)
- SDK libraries (Python, JavaScript, etc.)

### 2. SEL - Shared Environment Layer

The core platform that manages event processing, signal management, and real-time broadcasting.

#### Event Processing Engine

**Responsibilities:**
- Validate incoming events using Zod schemas
- Route events based on scope and pattern
- Track causality through trace IDs
- Manage parent-child event relationships

**Key Features:**
- Type-safe event validation
- Automatic timestamp generation
- UUID-based event identification
- Scope-based filtering

#### Signal Processing Engine

Implements stigmergic coordination through pheromone-like signals:

**Signal Lifecycle:**
1. **Initialization** - Created on proposal/ready/test events
2. **Amplification** - Reward events increase strength (α factor)
3. **Reduction** - Penalty events decrease strength
4. **Decay** - Exponential decay over time (λ factor)
5. **Cleanup** - Removal when strength < 0.01

**Mathematical Model:**
```
Signal Strength (reward):
  S_new = min(1.0, S_old + (reward_value × α))

Signal Strength (penalty):
  S_new = max(0.0, S_old - |penalty_value|)

Signal Decay (per interval):
  S_new = S_old × λ
  
Where:
  α (alpha) = amplification factor (default: 1.2)
  λ (lambda) = decay factor (default: 0.95)
```

#### Real-Time Broadcasting

**WebSocket Server:**
- Path: `/ws`
- Protocol: JSON messages
- Automatic reconnection support
- Client state management

**Message Format:**
```json
{
  "type": "event",
  "data": {
    "id": "uuid",
    "type": "proposal",
    "scope": "ui.login",
    ...
  }
}
```

### 3. Data Layer

Abstracted storage interface supporting multiple backends:

**Storage Interface (IStorage):**
```typescript
interface IStorage {
  // Event operations
  createEvent(event: InsertSempEvent): Promise<SempEvent>;
  getEvent(id: string): Promise<SempEvent | undefined>;
  getEvents(limit?: number): Promise<SempEvent[]>;
  getEventsByScope(scope: string): Promise<SempEvent[]>;
  getEventsByTraceId(traceId: string): Promise<SempEvent[]>;
  
  // Signal operations
  createSignal(signal: Omit<Signal, 'id'>): Promise<Signal>;
  getSignal(scope: string, pattern: string): Promise<Signal | undefined>;
  getAllSignals(): Promise<Signal[]>;
  updateSignalStrength(id: string, strength: number): Promise<Signal>;
  applySignalDecay(): Promise<void>;
  
  // Graph operations
  createNode(node: Omit<GraphNode, 'id'>): Promise<GraphNode>;
  getNode(id: string): Promise<GraphNode | undefined>;
  addEdge(fromId: string, toId: string, edgeType: string): Promise<void>;
}
```

**Implementations:**
- **MemStorage** - In-memory (default, development)
- **PostgresStorage** - PostgreSQL (production, persistent)
- **RedisStorage** - Redis (distributed, CRDT-based) [planned]
- **Neo4jStorage** - Neo4j (graph-focused) [planned]

## Data Models

### SempEvent

```typescript
{
  id: string;              // UUID
  type: 'proposal' | 'ready' | 'test' | 'reward' | 'penalty';
  scope: string;           // e.g., "ui.login"
  trace_id: string;        // Causality tracking
  agent_id: string;        // Agent identifier
  parent_ids?: string[];   // Event dependencies
  timestamp: string;       // ISO 8601
  payload: Record<string, any>;
}
```

### Signal

```typescript
{
  id: string;              // UUID
  scope: string;           // Event scope
  pattern: string;         // Action pattern
  strength: number;        // 0.0 to 1.0
  last_updated: string;    // ISO 8601
  alpha: number;           // Amplification factor
  lambda: number;          // Decay factor
}
```

### GraphNode

```typescript
{
  id: string;              // UUID
  type: string;            // Node type
  data: Record<string, any>;
  edges: Array<{
    to: string;            // Target node ID
    type: string;          // Edge type
  }>;
}
```

## Request Flow

### Event Creation Flow

```
1. Client sends POST /api/events
   ↓
2. Zod validation (sempEventSchema)
   ↓
3. Storage.createEvent() - Assigns ID, timestamp
   ↓
4. Signal processing (if reward/penalty/proposal/ready/test)
   ↓
5. WebSocket broadcast to all connected clients
   ↓
6. Response returned to client
```

### Signal Decay Flow

```
1. setInterval(60s) triggers decay job
   ↓
2. For each signal:
   - Calculate: S_new = S_old × λ
   - Update signal strength
   - If S_new < 0.01: Remove signal
   ↓
3. Cleanup complete
```

### WebSocket Connection Flow

```
1. Client connects to /ws
   ↓
2. Server adds client to wsClients Set
   ↓
3. On event creation:
   - broadcastEvent() sends to all clients
   ↓
4. On client disconnect:
   - Remove from wsClients Set
```

## Scalability Considerations

### Horizontal Scaling

**Challenges:**
- WebSocket client distribution
- Signal state synchronization
- Event ordering guarantees

**Solutions:**
- **Redis Pub/Sub** - For WebSocket message distribution
- **CRDT-based signals** - Conflict-free replicated data types
- **Event sourcing** - Append-only event log

### Performance Optimization

**Current:**
- In-memory storage (fast reads/writes)
- WebSocket for real-time (low latency)
- Efficient signal decay (batch processing)

**Future:**
- Database connection pooling
- Read replicas for query scaling
- Event stream processing (Kafka/RabbitMQ)
- Caching layer (Redis)

## Security Architecture

**Current:**
- No authentication (open platform)
- HTTPS/WSS for transport security
- Input validation (Zod schemas)

**Planned:**
- JWT-based authentication
- API key management
- Role-based access control (RBAC)
- Rate limiting
- Audit logging

## Deployment Architecture

### Development

```
┌─────────────────┐
│   Developer     │
│   Machine       │
│                 │
│  ┌───────────┐  │
│  │ SEL/SEMP  │  │
│  │   :5000   │  │
│  └───────────┘  │
│                 │
│  [MemStorage]   │
└─────────────────┘
```

### Docker Single-Node

```
┌────────────────────────────┐
│      Docker Host           │
│                            │
│  ┌──────────────────────┐  │
│  │   semp-platform      │  │
│  │      :5000           │  │
│  └──────────────────────┘  │
│             │              │
│  ┌──────────▼───────────┐  │
│  │   PostgreSQL         │  │
│  │      :5432           │  │
│  └──────────────────────┘  │
└────────────────────────────┘
```

### Kubernetes Multi-Node (Future)

```
┌─────────────────────────────────────┐
│         Kubernetes Cluster          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Ingress (LoadBalancer)    │   │
│  └──────────────┬──────────────┘   │
│                 │                   │
│  ┌──────────────▼──────────────┐   │
│  │   SEL/SEMP Pods (3x)        │   │
│  │   - Auto-scaling            │   │
│  │   - Health checks           │   │
│  └──────────────┬──────────────┘   │
│                 │                   │
│  ┌──────────────▼──────────────┐   │
│  │   PostgreSQL (StatefulSet)  │   │
│  │   - PVC for persistence     │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Redis (for WebSocket)     │   │
│  │   - Pub/Sub                 │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Technology Stack

### Backend
- **Node.js 20+** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **Zod** - Schema validation
- **Drizzle ORM** - Database toolkit
- **ws** - WebSocket library

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **TanStack Query** - Data fetching
- **Wouter** - Routing
- **Shadcn/ui** - Component library
- **Tailwind CSS** - Styling

### Database
- **PostgreSQL** - Primary database
- **Redis** - Caching & Pub/Sub (planned)
- **Neo4j** - Graph relationships (planned)

### DevOps
- **Docker** - Containerization
- **GitHub Actions** - CI/CD
- **Kubernetes** - Orchestration (planned)

## Design Principles

1. **Event-Driven** - All agent coordination through events
2. **Stigmergic** - Indirect communication via signals
3. **Type-Safe** - Zod validation + TypeScript
4. **Real-Time** - WebSocket for instant updates
5. **Pluggable** - Storage abstraction for flexibility
6. **Observable** - Signal strength visualization
7. **Scalable** - Designed for distributed deployment

## Next Steps

- [SEMP Protocol Specification](protocol.md)
- [API Reference](api-reference.md)
- [Integration Guide](integration.md)
- [Deployment Guide](deployment.md)
