---
title: Architecture
description: How SEMP works under the hood
---

## System Architecture

SEMP follows a simple three-layer architecture:

```
┌─────────┐     ┌─────────────────────┐     ┌─────────┐
│ Agent A  │────▶│  Shared Environment │◀────│ Agent B  │
│          │     │       (SEL)         │     │          │
│ deposits │     │                     │     │  reads   │
│ signals  │     │  signals + decay    │     │ signals  │
└─────────┘     └─────────────────────┘     └─────────┘
```

**Key principle:** Agents never communicate directly. All coordination happens through the shared environment.

## Components

### SEMP Protocol Layer

The protocol defines:
- Five signal types (PROPOSAL, READY, TEST, REWARD, PENALTY)
- Signal schema (type, payload, strength, timestamp, decay parameters)
- Decay formula: S(t) = S₀ × λᵗ
- Reward/penalty amplification rules

### SEL Platform Layer

The platform provides:
- **Signal Storage:** PostgreSQL-backed persistent signal store
- **Decay Engine:** Continuous signal strength recalculation
- **WebSocket Gateway:** Real-time signal streaming to dashboards and agents
- **REST API:** CRUD operations for signals
- **Dashboard:** React-based real-time observability UI

### Agent Connectors

Framework-specific adapters that let agents interact with the environment:
- [LangGraph Connector](/connectors/langgraph/)
- [CrewAI Connector](/connectors/crewai/)
- [AutoGen Connector](/connectors/autogen/)

## Data Flow

1. **Agent deposits signal** via REST API or WebSocket
2. **Environment stores signal** with initial strength S₀ = 1.0
3. **Decay engine** continuously updates signal strengths
4. **Other agents query** signals filtered by type and minimum strength
5. **Dashboard** displays real-time signal flow via WebSocket

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Backend | TypeScript, Node.js, Express |
| Frontend | React, WebSocket |
| Database | PostgreSQL (Drizzle ORM) |
| Real-time | WebSocket (native) |
| Protocol | JSON over HTTP/WebSocket |
