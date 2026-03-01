# MCP Policy

This document defines which MCP (Model Context Protocol) servers, tools, and operations are permitted during the Ant-Digest workflow. All MCP tool usage must pass through this policy gate before execution.

## Policy Gate

Before any MCP tool call, verify:

1. **Server is listed** in the Allowed Servers section below
2. **Operation type is permitted** for that server
3. **Data classification is known** — what plane does the input/output belong to?
4. **No sensitive data** is sent to external servers (GUARDRAILS: no PII, no secrets)
5. **Output is logged** with source attribution for CRUMBLOG provenance

If any check fails, the tool call is blocked. Log the attempted call and reason for blocking.

## Allowed Servers

### Context7 (`plugin:context7:context7`)

**Purpose:** Fetch up-to-date library documentation and code examples.

| Operation | Permitted | Data Class |
|-----------|-----------|------------|
| `resolve-library-id` | Yes | Query: non-sensitive library name |
| `query-docs` | Yes | Query: technical question, no project secrets |

**Output plane:** B (external documentation)
**Logging:** Log library ID + query + date

### Greptile (`plugin:greptile:greptile`)

**Purpose:** Code review, PR analysis, custom context management.

| Operation | Permitted | Data Class |
|-----------|-----------|------------|
| `list_pull_requests` | Yes | Repo metadata |
| `get_merge_request` | Yes | PR metadata + diff |
| `list_merge_request_comments` | Yes | Review comments |
| `trigger_code_review` | Yes | Sends code for review |
| `search_greptile_comments` | Yes | Search review history |
| `list_custom_context` | Yes | Org context |
| `create_custom_context` | Requires approval | Creates persistent org context |

**Output plane:** B (external analysis)
**Logging:** Log operation + PR number + date

### Playwright (`plugin:playwright:playwright`)

**Purpose:** Browser automation for UI verification.

| Operation | Permitted | Data Class |
|-----------|-----------|------------|
| `browser_navigate` | Yes — localhost only | Local URLs only |
| `browser_snapshot` | Yes | Page accessibility tree |
| `browser_click` / `browser_type` | Yes — localhost only | UI interaction |
| `browser_take_screenshot` | Yes | Visual verification |
| `browser_console_messages` | Yes | Debug output |

**Constraint:** Navigation restricted to `localhost` URLs during development. No external site navigation without explicit user approval.
**Output plane:** A (local verification result)
**Logging:** Log URL + action + result summary

### Firebase (`plugin:firebase:firebase`)

**Purpose:** Firebase project management (if applicable).

| Operation | Permitted | Data Class |
|-----------|-----------|------------|
| All read operations | Yes | Project metadata |
| Create/modify operations | Requires approval | Infrastructure changes |

**Constraint:** No operations permitted without an active, authenticated Firebase project.
**Output plane:** B (external service state)

## Blocked Operations

The following are never permitted regardless of server:

- Sending PII or secrets as tool input
- Navigating to external URLs without user approval (Playwright)
- Creating persistent external state without user approval (Greptile custom context, Firebase resources)
- Any operation not listed in the Allowed Servers section

## Data Classification for MCP

| Data Type | Can Send to MCP? | Notes |
|-----------|-------------------|-------|
| Source code (this repo) | Yes | Public repo content |
| File paths | Yes | Non-sensitive |
| Library names / versions | Yes | Non-sensitive |
| Technical questions | Yes | No project secrets embedded |
| SEMP event payloads (demo) | Yes | Only fictional demo data |
| PII | Never | GUARDRAIL violation |
| API keys / secrets | Never | GUARDRAIL violation |
| DATABASE_URL | Never | GUARDRAIL violation |

## Logging Format

Every MCP tool call should be loggable in this format for CRUMBLOG provenance:

```
SOURCE:mcp/{server}/{tool}|QUERY:{summary}|DATE:{ISO-date}
```

Example:
```
SOURCE:mcp/context7/query-docs|QUERY:React TanStack Query setup|DATE:2026-02-04
```
