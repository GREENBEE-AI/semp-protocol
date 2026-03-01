---
title: Subagent Roles and Output Contracts
---

# Subagent Roles and Output Contracts

Subagents are specialized Task agents invoked during the Ant-Digest workflow. Each has a defined role, input contract, and output contract. The orchestrating agent (the main Claude session) is responsible for routing work and validating outputs.

## Roles

### Explorer

**Purpose:** Codebase navigation and context gathering.
**When:** During `scope` and `plan` steps, or when context about existing code is needed.

| Field | Value |
|-------|-------|
| Agent type | `Explore` |
| Input | Question or search goal |
| Output | File paths with line references, pattern descriptions |
| Plane | A (all claims must cite repo paths) |
| Constraint | Read-only — must not modify files |

### Planner

**Purpose:** Design implementation approach before writing code.
**When:** During `plan` step for non-trivial changes.

| Field | Value |
|-------|-------|
| Agent type | `Plan` |
| Input | Scope statement + relevant file contents |
| Output | Step-by-step plan with file list, trade-offs, risks |
| Plane | A (repo refs) + C (assumptions tagged with RISK) |
| Constraint | Must not write or edit files |

### Implementer

**Purpose:** Write code changes according to an approved plan.
**When:** During `implement` step.

| Field | Value |
|-------|-------|
| Agent type | Language-specific (e.g., `voltagent-lang:typescript-pro`, `voltagent-lang:react-specialist`) |
| Input | Approved plan + file contents to modify |
| Output | File edits with before/after |
| Plane | A (all changes are Plane A once written) |
| Constraint | Must follow plan — no unplanned changes |

### Reviewer

**Purpose:** Review completed code for correctness, security, and guideline compliance.
**When:** During `verify` and `guard` steps.

| Field | Value |
|-------|-------|
| Agent type | `superpowers:code-reviewer` or `feature-dev:code-reviewer` |
| Input | Changed files + plan + GUARDRAILS.md |
| Output | Issue list with severity, file:line references |
| Plane | A (all findings cite repo paths) |
| Constraint | Read-only — reports issues, does not fix them |

### Researcher

**Purpose:** Fetch and synthesize external documentation or information.
**When:** During `federate` step, or when Plane B context is needed.

| Field | Value |
|-------|-------|
| Agent type | `general-purpose` or `voltagent-research:research-analyst` |
| Input | Specific question + allowed sources |
| Output | Answer with source URLs, classified as Plane B |
| Plane | B (all claims must cite external source) |
| Constraint | Must follow MCP_POLICY.md for tool usage |

## Output Contract Rules

1. **Every subagent output must declare its plane.** No untagged claims.
2. **File references must use `path:line` format.** Vague references like "somewhere in the codebase" are rejected.
3. **Assumptions must be tagged.** Any inference not backed by evidence gets `PLANE:C` and `RISK:` description.
4. **The orchestrator validates outputs** before incorporating them into the workflow. Plane C outputs cannot drive implementation without promotion.
5. **Subagents must not exceed their role.** An Explorer must not edit files. A Reviewer must not fix code. Violations are logged and the output is discarded.

## Handoff Protocol

```
Orchestrator → Subagent:
  - Task description
  - Relevant file contents (pre-read)
  - Applicable constraints (GUARDRAILS subset)
  - Expected output format

Subagent → Orchestrator:
  - Result with plane tags
  - Evidence (paths, URLs, or RISK tags)
  - Confidence level (if applicable)
```

## Abort Conditions

A subagent must abort and return an error if:

- Required input files are missing or unreadable
- The task exceeds its role boundary (e.g., Explorer asked to edit)
- A GUARDRAIL violation is detected in the input
- Confidence is too low to produce useful output (return `PLANE:C` with `RISK:low-confidence`)
