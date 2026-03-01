---
title: API Reference
---

# API Reference

SEL/SEMP provides REST and WebSocket APIs for event-driven agent coordination.

## Base URL

```
Development: http://localhost:5000/api
Production:  https://api.semp.dev
```

## Authentication

**Current:** No authentication required (v0.1)

**Future:** JWT Bearer tokens
```
Authorization: Bearer <token>
```

---

## REST API

### Create Event

Create a new SEMP event.

```http
POST /api/events
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "proposal",
  "scope": "ui.login",
  "trace_id": "trace-001",
  "agent_id": "agent-1",
  "parent_ids": ["parent-uuid"],  // optional
  "payload": {
    "action": "improve_ux"
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "proposal",
  "scope": "ui.login",
  "trace_id": "trace-001",
  "agent_id": "agent-1",
  "parent_ids": [],
  "timestamp": "2025-01-15T10:30:00.000Z",
  "payload": {
    "action": "improve_ux"
  }
}
```

**Errors:**
- `400 Bad Request` - Validation error
- `500 Internal Server Error` - Server error

**Validation:**
```typescript
{
  type: z.enum(['proposal', 'ready', 'test', 'reward', 'penalty']),
  scope: z.string().min(1),
  trace_id: z.string().min(1),
  agent_id: z.string().min(1),
  parent_ids: z.array(z.string()).optional(),
  payload: z.record(z.any())
}
```

---

### Get Events

Retrieve recent events (max 100).

```http
GET /api/events
```

**Response:** `200 OK`
```json
[
  {
    "id": "uuid-1",
    "type": "proposal",
    "scope": "ui.login",
    "trace_id": "trace-001",
    "agent_id": "agent-1",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "payload": { "action": "improve_ux" }
  },
  ...
]
```

**Sorting:** Descending by timestamp (newest first)

---

### Get Events by Scope

Filter events by scope.

```http
GET /api/events/scope/:scope
```

**Parameters:**
- `scope` - Scope string (URL encoded)

**Example:**
```http
GET /api/events/scope/ui.login
```

**Response:** `200 OK`
```json
[
  {
    "id": "uuid-1",
    "type": "proposal",
    "scope": "ui.login",
    ...
  },
  {
    "id": "uuid-2",
    "type": "ready",
    "scope": "ui.login",
    ...
  }
]
```

---

### Get Events by Trace ID

Retrieve all events for a specific trace.

```http
GET /api/events/trace/:traceId
```

**Parameters:**
- `traceId` - Trace identifier

**Example:**
```http
GET /api/events/trace/trace-001
```

**Response:** `200 OK`
```json
[
  {
    "id": "uuid-1",
    "trace_id": "trace-001",
    "type": "proposal",
    ...
  },
  {
    "id": "uuid-2",
    "trace_id": "trace-001",
    "type": "ready",
    ...
  }
]
```

---

### Get Signals

Retrieve all active signals.

```http
GET /api/signals
```

**Response:** `200 OK`
```json
[
  {
    "id": "signal-uuid-1",
    "scope": "ui.login",
    "pattern": "improve_ux",
    "strength": 0.85,
    "last_updated": "2025-01-15T10:35:00.000Z",
    "alpha": 1.2,
    "lambda": 0.95
  },
  ...
]
```

---

## WebSocket API

### Connection

```javascript
const ws = new WebSocket('ws://localhost:5000/ws');

ws.onopen = () => {
  console.log('Connected to SEL/SEMP');
};

ws.onclose = () => {
  console.log('Disconnected from SEL/SEMP');
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};
```

### Message Format

**Server → Client:**
```json
{
  "type": "event",
  "data": {
    "id": "uuid",
    "type": "proposal",
    "scope": "ui.login",
    "trace_id": "trace-001",
    "agent_id": "agent-1",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "payload": { ... }
  }
}
```

### Event Handling

```javascript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'event') {
    const sempEvent = message.data;
    
    switch (sempEvent.type) {
      case 'proposal':
        handleProposal(sempEvent);
        break;
      case 'reward':
        handleReward(sempEvent);
        break;
      // ... other types
    }
  }
};
```

### Reconnection Logic

```javascript
class SEMPWebSocket {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      console.log('Connected');
      this.reconnectDelay = 1000;
    };
    
    this.ws.onclose = () => {
      console.log('Disconnected, reconnecting...');
      setTimeout(() => this.connect(), this.reconnectDelay);
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        this.maxReconnectDelay
      );
    };
    
    this.ws.onmessage = (event) => {
      this.handleMessage(event);
    };
  }
  
  handleMessage(event) {
    // Process message
  }
}

const semp = new SEMPWebSocket('ws://localhost:5000/ws');
```

---

## Error Responses

### Validation Error

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
```

```json
{
  "message": "Validation error: Invalid event type"
}
```

### Server Error

```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json
```

```json
{
  "message": "Internal server error"
}
```

---

## Rate Limits

**Current:** No rate limits (v0.1)

**Future:**
- Free tier: 100 requests/minute
- Pro tier: 1000 requests/minute
- Enterprise: Custom limits

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { SEMPClient } from '@semp/sdk';

const client = new SEMPClient('http://localhost:5000');

// Create event
const event = await client.createEvent({
  type: 'proposal',
  scope: 'ui.login',
  trace_id: 'trace-001',
  agent_id: 'my-agent',
  payload: {
    action: 'improve_ux'
  }
});

// Get events
const events = await client.getEvents();

// Filter by scope
const loginEvents = await client.getEventsByScope('ui.login');

// Get signals
const signals = await client.getSignals();

// Listen for real-time events
client.on('event', (event) => {
  console.log('New event:', event);
});
```

### Python

```python
from semp_sdk import SEMPClient

client = SEMPClient('http://localhost:5000')

# Create event
event = client.create_event(
    type='proposal',
    scope='ui.login',
    trace_id='trace-001',
    agent_id='my-agent',
    payload={'action': 'improve_ux'}
)

# Get events
events = client.get_events()

# Filter by scope
login_events = client.get_events_by_scope('ui.login')

# Get signals
signals = client.get_signals()

# Listen for real-time events
@client.on('event')
def handle_event(event):
    print(f'New event: {event}')

client.connect()
```

### cURL

```bash
# Create event
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "type": "proposal",
    "scope": "ui.login",
    "trace_id": "trace-001",
    "agent_id": "my-agent",
    "payload": {
      "action": "improve_ux"
    }
  }'

# Get events
curl http://localhost:5000/api/events

# Get events by scope
curl http://localhost:5000/api/events/scope/ui.login

# Get events by trace
curl http://localhost:5000/api/events/trace/trace-001

# Get signals
curl http://localhost:5000/api/signals
```

---

## Webhook Integration (Future)

Subscribe to events via webhooks:

```http
POST /api/webhooks
Content-Type: application/json
```

```json
{
  "url": "https://your-server.com/webhook",
  "events": ["proposal", "reward", "penalty"],
  "scopes": ["ui.*", "api.users.*"]
}
```

---

## GraphQL API (Future)

```graphql
query GetEvents {
  events(limit: 10, scope: "ui.login") {
    id
    type
    scope
    trace_id
    agent_id
    timestamp
    payload
  }
}

mutation CreateEvent($input: EventInput!) {
  createEvent(input: $input) {
    id
    type
    scope
    timestamp
  }
}

subscription OnEvent($scope: String) {
  eventCreated(scope: $scope) {
    id
    type
    scope
    payload
  }
}
```

---

## Next Steps

- [SEMP Protocol](protocol.md)
- [Integration Guide](integration.md)
- [WebSocket Guide](websocket-api.md)
- [SDK Documentation](sdks/)
