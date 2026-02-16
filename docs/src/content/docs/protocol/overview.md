---
title: Protocol Overview
description: Understanding the SEMP coordination protocol
---

## What is SEMP?

SEMP (Stigmergic Environment Messaging Protocol) is an open protocol that enables AI agents to coordinate through a shared environment. Instead of agents messaging each other directly (which creates O(n²) complexity), agents deposit and read signals in a shared space.

This approach is called **stigmergy** — a coordination mechanism first described by French biologist Pierre-Paul Grassé in 1959 to explain how termites build complex structures without a central plan.

## Why Not Direct Messaging?

| Approach | Connections | Scaling | Failure Mode |
|----------|------------|---------|-------------|
| Direct Messaging | O(n²) | Exponential cost | Cascade failures |
| SEMP (Stigmergy) | O(n) | Linear cost | Self-healing via decay |

With 10 agents, direct messaging requires 90 connections. With 100 agents, that's 9,900. SEMP always requires just n connections (one per agent to the environment).

## The Five Signal Types

| Signal | Meaning | Example |
|--------|---------|---------|
| **PROPOSAL** | "I suggest..." | Agent proposes a delivery route |
| **READY** | "I'm done." | Agent reports task completion |
| **TEST** | "Did it work?" | Agent requests validation |
| **REWARD** | "Amplify this." | Successful outcome reinforces signal (α=1.2) |
| **PENALTY** | "Suppress this." | Failed outcome accelerates decay (λ=0.95) |

## Signal Decay

Every signal decays over time following: **S(t) = S₀ × λᵗ**

This is the core insight: old decisions fade away naturally. Good paths get reinforced through REWARD signals. Bad paths disappear faster through PENALTY signals. The system is self-healing by design.

## Learn More

- [Signal Types](/protocol/signals/) — detailed reference for each signal
- [Decay Mechanism](/protocol/decay/) — the mathematics of signal decay
- [Architecture](/architecture/) — system architecture and data flow
