# Integration Guide

This guide shows how to integrate SEL/SEMP with popular AI agent frameworks.

## Quick Integration Checklist

1. ✅ Install SEL/SEMP platform (Docker or npm)
2. ✅ Choose integration method (SDK or REST)
3. ✅ Generate trace IDs for workflows
4. ✅ Send events at key lifecycle points
5. ✅ Listen for signals to coordinate behavior

---

## LangGraph Integration

### Setup

```python
pip install langgraph semp-sdk
```

### Basic Integration

```python
from langgraph.graph import StateGraph, END
from semp_sdk import SEMPClient
from typing import TypedDict
import uuid

# Initialize SEMP client
semp = SEMPClient('http://localhost:5000')

class State(TypedDict):
    task: str
    result: str
    trace_id: str

def agent_propose(state: State):
    """Agent proposes an action"""
    trace_id = state.get('trace_id', str(uuid.uuid4()))
    
    # Send proposal event
    semp.create_event(
        type='proposal',
        scope='workflow.task1',
        trace_id=trace_id,
        agent_id='langgraph-agent-1',
        payload={
            'action': 'process_task',
            'task': state['task']
        }
    )
    
    return {**state, 'trace_id': trace_id}

def agent_execute(state: State):
    """Agent executes the task"""
    # Simulate work
    result = f"Processed: {state['task']}"
    
    # Send ready event
    semp.create_event(
        type='ready',
        scope='workflow.task1',
        trace_id=state['trace_id'],
        agent_id='langgraph-agent-1',
        payload={
            'status': 'completed',
            'result': result
        }
    )
    
    return {**state, 'result': result}

def agent_verify(state: State):
    """Verify the result"""
    # Check quality
    quality_ok = len(state['result']) > 0
    
    if quality_ok:
        # Send reward
        semp.create_event(
            type='reward',
            scope='workflow.task1',
            trace_id=state['trace_id'],
            agent_id='langgraph-supervisor',
            payload={
                'value': 0.8,
                'α': 1.2,
                'reason': 'task_completed_successfully'
            }
        )
    else:
        # Send penalty
        semp.create_event(
            type='penalty',
            scope='workflow.task1',
            trace_id=state['trace_id'],
            agent_id='langgraph-supervisor',
            payload={
                'value': -0.3,
                'reason': 'task_failed_quality_check'
            }
        )
    
    return state

# Build graph
workflow = StateGraph(State)

workflow.add_node("propose", agent_propose)
workflow.add_node("execute", agent_execute)
workflow.add_node("verify", agent_verify)

workflow.set_entry_point("propose")
workflow.add_edge("propose", "execute")
workflow.add_edge("execute", "verify")
workflow.add_edge("verify", END)

app = workflow.compile()

# Run workflow
result = app.invoke({"task": "analyze data"})
print(result)
```

### Signal-Based Coordination

```python
def check_signals_before_action(scope: str, pattern: str):
    """Check signal strength before taking action"""
    signal = semp.get_signal(scope, pattern)
    
    if signal and signal['strength'] > 0.7:
        print(f"Strong signal ({signal['strength']}) - proceed with confidence")
        return True
    elif signal and signal['strength'] > 0.3:
        print(f"Moderate signal ({signal['strength']}) - proceed with caution")
        return True
    else:
        print(f"Weak/no signal - consider alternative approach")
        return False

# Use in agent logic
def agent_with_signals(state: State):
    if check_signals_before_action('workflow.task1', 'process_task'):
        # Execute action
        pass
    else:
        # Skip or use alternative
        pass
```

---

## CrewAI Integration

### Setup

```python
pip install crewai semp-sdk
```

### Basic Integration

```python
from crewai import Agent, Task, Crew
from semp_sdk import SEMPClient
import uuid

semp = SEMPClient('http://localhost:5000')

# Custom callback for SEMP events
class SEMPCallback:
    def __init__(self, trace_id):
        self.trace_id = trace_id
    
    def on_task_start(self, task):
        semp.create_event(
            type='proposal',
            scope=f'crew.{task.name}',
            trace_id=self.trace_id,
            agent_id=task.agent.role,
            payload={
                'action': 'execute_task',
                'description': task.description
            }
        )
    
    def on_task_complete(self, task, result):
        semp.create_event(
            type='ready',
            scope=f'crew.{task.name}',
            trace_id=self.trace_id,
            agent_id=task.agent.role,
            payload={
                'status': 'completed',
                'result': result
            }
        )

# Create agents
researcher = Agent(
    role='Researcher',
    goal='Find relevant information',
    backstory='Expert at web research'
)

writer = Agent(
    role='Writer',
    goal='Write engaging content',
    backstory='Professional content writer'
)

# Create tasks
research_task = Task(
    description='Research AI agent coordination',
    agent=researcher,
    name='research'
)

writing_task = Task(
    description='Write article based on research',
    agent=writer,
    name='writing'
)

# Create crew with SEMP tracking
trace_id = str(uuid.uuid4())
callback = SEMPCallback(trace_id)

crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, writing_task],
    callbacks=[callback]
)

# Run crew
result = crew.kickoff()

# Send final reward based on result quality
semp.create_event(
    type='reward',
    scope='crew.overall',
    trace_id=trace_id,
    agent_id='crew-supervisor',
    payload={
        'value': 0.9,
        'α': 1.3,
        'reason': 'crew_completed_successfully'
    }
)
```

---

## AutoGen Integration

### Setup

```python
pip install pyautogen semp-sdk
```

### Basic Integration

```python
from autogen import AssistantAgent, UserProxyAgent, config_list_from_json
from semp_sdk import SEMPClient
import uuid

semp = SEMPClient('http://localhost:5000')
trace_id = str(uuid.uuid4())

# Custom AutoGen agent with SEMP
class SEMPAssistantAgent(AssistantAgent):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.semp = semp
        self.trace_id = trace_id
    
    def generate_reply(self, messages, sender):
        # Send proposal before generating
        self.semp.create_event(
            type='proposal',
            scope=f'autogen.{self.name}',
            trace_id=self.trace_id,
            agent_id=self.name,
            payload={
                'action': 'generate_reply',
                'context': messages[-1]['content'][:100]
            }
        )
        
        # Generate reply
        reply = super().generate_reply(messages, sender)
        
        # Send ready after generating
        self.semp.create_event(
            type='ready',
            scope=f'autogen.{self.name}',
            trace_id=self.trace_id,
            agent_id=self.name,
            payload={
                'status': 'completed',
                'reply_length': len(reply) if reply else 0
            }
        )
        
        return reply

# Create agents
config_list = config_list_from_json("OAI_CONFIG_LIST")

assistant = SEMPAssistantAgent(
    name="assistant",
    llm_config={"config_list": config_list}
)

user_proxy = UserProxyAgent(
    name="user_proxy",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=10
)

# Start conversation
user_proxy.initiate_chat(
    assistant,
    message="Write a Python function to calculate fibonacci numbers"
)

# Analyze conversation and send reward/penalty
signals = semp.get_signals()
strong_signals = [s for s in signals if s['strength'] > 0.7]

if len(strong_signals) > 0:
    semp.create_event(
        type='reward',
        scope='autogen.conversation',
        trace_id=trace_id,
        agent_id='supervisor',
        payload={
            'value': 0.8,
            'reason': 'productive_conversation'
        }
    )
```

---

## Custom Agent Integration

### REST API

```python
import requests
import uuid

class CustomAgent:
    def __init__(self, semp_url='http://localhost:5000'):
        self.semp_url = semp_url
        self.trace_id = str(uuid.uuid4())
        self.agent_id = 'custom-agent-1'
    
    def send_event(self, event_type, scope, payload):
        response = requests.post(
            f'{self.semp_url}/api/events',
            json={
                'type': event_type,
                'scope': scope,
                'trace_id': self.trace_id,
                'agent_id': self.agent_id,
                'payload': payload
            }
        )
        return response.json()
    
    def get_signals(self, scope=None):
        response = requests.get(f'{self.semp_url}/api/signals')
        signals = response.json()
        
        if scope:
            return [s for s in signals if s['scope'] == scope]
        return signals
    
    def execute_task(self, task_name):
        # Propose action
        self.send_event(
            'proposal',
            f'task.{task_name}',
            {'action': 'execute', 'task': task_name}
        )
        
        # Check if this action has strong signals
        signals = self.get_signals(f'task.{task_name}')
        if signals and signals[0]['strength'] > 0.7:
            print(f"Strong signal detected, proceeding with {task_name}")
        
        # Execute (simulate)
        result = f"Completed: {task_name}"
        
        # Signal completion
        self.send_event(
            'ready',
            f'task.{task_name}',
            {'status': 'completed', 'result': result}
        )
        
        return result

# Usage
agent = CustomAgent()
result = agent.execute_task('data_analysis')
```

### WebSocket Integration

```python
import asyncio
import websockets
import json

class RealtimeAgent:
    def __init__(self, ws_url='ws://localhost:5000/ws'):
        self.ws_url = ws_url
        self.handlers = {}
    
    def on(self, event_type, handler):
        self.handlers[event_type] = handler
    
    async def connect(self):
        async with websockets.connect(self.ws_url) as ws:
            print("Connected to SEMP")
            
            async for message in ws:
                data = json.loads(message)
                
                if data['type'] == 'event':
                    event = data['data']
                    event_type = event['type']
                    
                    if event_type in self.handlers:
                        await self.handlers[event_type](event)

# Usage
agent = RealtimeAgent()

@agent.on('proposal')
async def handle_proposal(event):
    print(f"Proposal received: {event['scope']}")
    # React to proposal

@agent.on('reward')
async def handle_reward(event):
    print(f"Reward received: {event['payload']['value']}")
    # Learn from reward

asyncio.run(agent.connect())
```

---

## Best Practices

### 1. Trace ID Management

```python
# Generate once per workflow
trace_id = str(uuid.uuid4())

# Use same trace_id for all related events
semp.create_event(..., trace_id=trace_id)
semp.create_event(..., trace_id=trace_id)
semp.create_event(..., trace_id=trace_id)
```

### 2. Scope Hierarchy

```python
# Good - hierarchical
scope = 'workflow.step1.subtask_a'

# Bad - flat
scope = 'workflow_step1_subtask_a'
```

### 3. Signal Checking

```python
def should_execute(scope, pattern, threshold=0.5):
    signal = semp.get_signal(scope, pattern)
    return signal and signal['strength'] > threshold

if should_execute('workflow.task1', 'process_data'):
    # Execute with confidence
    pass
```

### 4. Error Handling

```python
import time

def send_event_with_retry(semp, event_data, max_retries=3):
    for attempt in range(max_retries):
        try:
            return semp.create_event(**event_data)
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)  # Exponential backoff
```

### 5. Batch Operations

```python
# Collect events
events = []

for task in tasks:
    events.append({
        'type': 'proposal',
        'scope': f'batch.{task.id}',
        'trace_id': trace_id,
        'agent_id': 'batch-agent',
        'payload': {'task': task.name}
    })

# Send in parallel
import asyncio

async def send_events(events):
    tasks = [semp.create_event_async(**e) for e in events]
    return await asyncio.gather(*tasks)

asyncio.run(send_events(events))
```

---

## Framework Comparison

| Framework | Integration Effort | Real-Time Support | Signal Usage |
|-----------|-------------------|-------------------|--------------|
| LangGraph | Medium | Via callbacks | Manual check |
| CrewAI | Easy | Built-in callbacks | Manual check |
| AutoGen | Medium | Override methods | Manual check |
| Custom | Low | Full control | Full control |

---

## Advanced Patterns

### Multi-Agent Coordination

```python
# Agent 1: Proposes
semp.create_event(
    type='proposal',
    scope='shared.workspace',
    trace_id=trace_id,
    agent_id='agent-1',
    payload={'action': 'analyze_data'}
)

# Agent 2: Checks signal and decides
signals = semp.get_signals()
workspace_signal = next(
    (s for s in signals if s['scope'] == 'shared.workspace'),
    None
)

if workspace_signal and workspace_signal['strength'] > 0.6:
    # Agent 2 builds on Agent 1's work
    semp.create_event(
        type='proposal',
        scope='shared.workspace',
        trace_id=trace_id,
        agent_id='agent-2',
        payload={'action': 'visualize_results'}
    )
```

### Reinforcement Learning

```python
class RLAgent:
    def __init__(self, semp_client):
        self.semp = semp_client
        self.action_history = []
    
    def take_action(self, state, action):
        # Record action
        self.action_history.append({
            'state': state,
            'action': action
        })
        
        # Send proposal
        event = self.semp.create_event(
            type='proposal',
            scope=f'rl.{state}',
            trace_id=self.trace_id,
            agent_id='rl-agent',
            payload={'action': action}
        )
        
        return event['id']
    
    def learn_from_reward(self, event_id, reward_value):
        # Send reward/penalty
        event_type = 'reward' if reward_value > 0 else 'penalty'
        
        self.semp.create_event(
            type=event_type,
            scope='rl.learning',
            trace_id=self.trace_id,
            agent_id='rl-agent',
            parent_ids=[event_id],
            payload={'value': abs(reward_value)}
        )
        
        # Update policy based on signals
        signals = self.semp.get_signals()
        self.update_policy(signals)
```

---

## Troubleshooting

### Events Not Appearing

1. Check server is running: `curl http://localhost:5000/api/events`
2. Verify event schema validation
3. Check server logs for errors

### WebSocket Connection Issues

1. Verify WebSocket URL: `ws://` (not `http://`)
2. Check firewall settings
3. Implement reconnection logic

### Signal Not Updating

1. Verify decay job is running (every 60s)
2. Check signal strength calculation
3. Ensure events reference correct scope/pattern

---

## Next Steps

- [SEMP Protocol Specification](protocol.md)
- [API Reference](api-reference.md)
- [SDK Documentation](sdks/)
- [Examples Repository](https://github.com/semp/examples)
