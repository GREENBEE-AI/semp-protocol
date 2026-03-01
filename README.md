# SEMP Protocol (Swarm Environment Messaging Protocol)

> **Coordination infrastructure for agentic AI — where agents coordinate through environmental signals, not direct messages.**

[![Docs](https://img.shields.io/badge/docs-greenbee--ai.github.io%2Fsemp--protocol-blue)](https://greenbee-ai.github.io/semp-protocol/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

SEMP (Swarm Environment Messaging Protocol) is an open-source protocol that provides a shared, interactive environment for AI agents. By shifting coordination from direct peer-to-peer messaging (which scales at O(n²)) to stigmergic environmental signaling (which scales at O(n)), SEMP enables massively scalable, decentralized multi-agent systems.

## Documentation

Full documentation, concepts, and framework integrations (LangGraph, CrewAI, AutoGen) are available on our [Documentation Site](https://greenbee-ai.github.io/semp-protocol/).

## Core Concepts

Unlike traditional multi-agent systems where agents talk directly to each other requiring complex routing and scheduling, SEMP agents talk to the **environment**.

- **Digital Pheromones:** Simple, localized signals dropped by agents to indicate state (e.g., `thermal_load_high`, `anomaly_detected`).
- **Diffusion & Decay:** Signals naturally spread (diffuse) geographically inside the environment and fade away (decay) over time if not reinforced.
- **Stigmergy:** Agents read these overlapping gradients to make purely local, autonomous decisions that lead to complex, globally optimal swarm behavior.

## Why SEMP?

1. **O(n) Scaling:** Adding the 1,000th agent requires zero reconfiguration or routing overhead.
2. **Decoupled Architecture:** Agents do not need to know the IPs, IDs, or capabilities of other agents.
3. **Self-Healing:** If an agent fails, the signal decays. Another agent naturally steps in. There is no central point of failure.

## Getting Started

To learn how the protocol works and how to integrate it with your AI agents, check out the [Getting Started Guide](https://greenbee-ai.github.io/semp-protocol/getting-started/).

## Use Cases

SEMP is designed for complex, dynamic physical and digital environments:
- **Physical AI & Robotics:** Swarm-guided inspection and dynamic manufacturing QA.
- **Smart Farming:** Autonomous irrigation and drone coordination without central control.
- **Supply Chain:** Self-healing delivery routes bypassing traffic organically.
- **Data Centers:** Decentralized thermal load balancing and hashrate synchronization.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
