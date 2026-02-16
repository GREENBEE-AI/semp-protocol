---
title: Decay Mechanism
description: How signal decay enables self-healing coordination
---

Signal decay is the core mechanism that makes SEMP self-healing. Every signal loses strength over time, ensuring the system never gets stuck on stale decisions.

## The Decay Formula

**S(t) = S₀ × λᵗ**

| Symbol | Meaning | Default |
|--------|---------|---------|
| S(t) | Signal strength at time t | — |
| S₀ | Initial signal strength | 1.0 |
| λ | Decay constant | 0.95 |
| t | Time units elapsed | — |

## Decay Over Time

| Time | Strength | Remaining |
|------|----------|-----------|
| 0h | 1.000 | 100% |
| 3h | 0.857 | 86% |
| 6h | 0.735 | 74% |
| 12h | 0.540 | 54% |
| 24h | 0.292 | 29% |
| 48h | 0.085 | 9% |

After 48 hours, a signal retains less than 10% of its original strength. This ensures decisions are always fresh.

## Why Decay Matters

**Self-healing:** If an agent makes a bad decision, the signal naturally fades. No cleanup needed.

**Anti-chaos:** Without decay, the environment would accumulate infinite signals. Decay prevents information overload.

**Recency bias:** Recent signals are stronger than old ones. The system naturally prioritizes current information.

**Equilibrium:** Good patterns are reinforced (REWARD × 1.2), bad patterns decay faster (PENALTY). The system converges on optimal behavior.

## Reward Amplification

When an agent sends a REWARD signal targeting another signal, the target's effective strength is multiplied by the amplification factor **α = 1.2**:

**S_rewarded(t) = S₀ × α × λᵗ = S₀ × 1.2 × 0.95ᵗ**

This counteracts natural decay for successful patterns, keeping them visible longer.

## Penalty Acceleration

PENALTY signals increase the effective decay rate for a targeted signal, causing it to fade faster than the natural rate. This provides active suppression of harmful patterns without requiring centralized control.

## Garbage Collection

Signals below a configurable threshold (default: 0.01) are removed from the environment. This keeps the signal space clean and query performance high.
