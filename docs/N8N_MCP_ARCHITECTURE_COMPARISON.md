# comms-blkout: n8n MCP Architecture Comparison

## Overview

This document compares the current React/Supabase implementation of comms-blkout with an alternative architecture using **n8n with MCP (Model Context Protocol)** integration.

---

## Architecture Comparison

### Current Architecture (React + Supabase)

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                        │
│              Custom UI + TypeScript + Tailwind                  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                     Supabase Backend                            │
│  PostgreSQL + Real-time Subscriptions + Storage + Auth          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                   External Services                             │
│    Google Gemini AI │ Instagram API │ TikTok API │ etc.         │
└─────────────────────────────────────────────────────────────────┘
```

### Proposed Architecture (n8n + MCP)

```
┌─────────────────────────────────────────────────────────────────┐
│                n8n Visual Workflow Canvas                       │
│         Low-code/No-code Interface + 543 Built-in Nodes         │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│              MCP Layer (Model Context Protocol)                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  MCP Server     │  │  MCP Client     │  │  AI Agent       │ │
│  │  Triggers       │  │  Tools          │  │  Nodes          │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│              Native n8n Integrations (500+ nodes)               │
│  Supabase │ Google AI │ Instagram │ TikTok │ Slack │ Email      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Differences

| Aspect | Current (React/Supabase) | n8n + MCP |
|--------|--------------------------|-----------|
| **Development Model** | Custom code (TypeScript) | Visual workflow builder |
| **Agent Implementation** | Custom hooks + services | MCP Agent nodes + triggers |
| **Integration Effort** | Manual API coding | Pre-built 543 node library |
| **Real-time Sync** | Supabase subscriptions | MCP SSE channels |
| **AI Model Access** | Google Gemini SDK only | Multi-model via MCP (Claude, GPT, Gemini) |
| **Deployment** | Vercel + Supabase | Docker/Self-hosted/Cloud |
| **Maintenance** | Code updates required | Visual workflow updates |
| **Team Skills Needed** | TypeScript/React developers | No-code/low-code users |
| **Scalability** | Horizontal (Vercel) | Horizontal (n8n queue) |

---

## Agent System: Side-by-Side

### Griot (Storyteller Agent)

**Current Implementation:**
```typescript
// Custom React hook fetching from Supabase
const { agent } = useAgent('griot');

// Generation via custom service
const content = await generateImageAsset(
  AIProvider.GOOGLE,
  "Black queer joy celebration",
  AspectRatio.SQUARE
);
```

**n8n MCP Implementation:**
```
[MCP Trigger: Griot Tasks]
    → [AI Agent Node (Claude/GPT)]
        → System: "You are Griot, BLKOUT's storyteller..."
        → Tools: [MCP Client: Content Generator]
    → [Supabase: Save Draft]
    → [MCP Client: Notify Strategist Agent]
```

### Listener (Intelligence Agent)

**Current Implementation:**
- Custom `useAgentIntelligence.ts` hook
- Manual polling/subscriptions for community signals

**n8n MCP Implementation:**
```
[Schedule Trigger: Every 6 hours]
    → [Twitter Node: Search #BlackQueerJoy]
    → [Instagram Node: Monitor mentions]
    → [AI Agent: Summarize trends]
    → [MCP Client: Send to Strategist workflow]
    → [Supabase: Store intelligence]
```

### Weaver (Community Engager)

**Current Implementation:**
- Planned but not fully automated
- Manual engagement through admin UI

**n8n MCP Implementation:**
```
[MCP Trigger: New Comment Detected]
    → [AI Agent Node]
        → Prompt: "Respond authentically, Black feminist values..."
        → Memory: Window Buffer (last 10 interactions)
    → [Instagram Node: Reply]
    → [Supabase: Log engagement]
```

### Strategist (Campaign Planner)

**Current Implementation:**
- `useCalendarContent.ts` for scheduling
- Manual campaign planning

**n8n MCP Implementation:**
```
[MCP Trigger: Weekly Strategy Session]
    → [MCP Client: Get Listener Intelligence]
    → [MCP Client: Get Griot Drafts]
    → [AI Agent: Create weekly plan]
        → Tools: Calendar API, Analytics
    → [Supabase: Update content calendar]
    → [Slack: Notify team]
```

### Herald (Newsletter Curator)

**Current Implementation:**
- `useNewsletter.ts` hook
- Planned SendFox integration

**n8n MCP Implementation:**
```
[Schedule Trigger: Sunday 6pm]
    → [MCP Client: Get week's published content]
    → [AI Agent: Curate newsletter]
    → [SendFox Node: Create draft]
    → [Email Trigger: Send for approval]
    → [SendFox Node: Schedule send]
```

---

## Multi-Agent Coordination with MCP

The key advantage of n8n MCP is **native agent-to-agent communication** without webhooks:

```
┌────────────────────────────────────────────────────────────────┐
│                    MCP Communication Bus                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐    SSE     ┌─────────┐    SSE     ┌─────────┐    │
│  │ Griot   │◄──────────►│Strategist│◄──────────►│ Herald  │    │
│  │ Agent   │            │ Agent    │            │ Agent   │    │
│  └────┬────┘            └────┬─────┘            └────┬────┘    │
│       │                      │                       │         │
│       └──────────────────────┼───────────────────────┘         │
│                              │                                  │
│                     ┌────────┴────────┐                        │
│                     │    Listener     │                        │
│                     │    Agent        │                        │
│                     └─────────────────┘                        │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Communication Pattern:**
1. Listener detects trending topic → sends MCP message to Strategist
2. Strategist creates task → sends MCP message to Griot
3. Griot generates content → sends MCP message to Strategist
4. Strategist approves → sends to publishing queue
5. Herald includes in weekly newsletter

---

## Implementation Roadmap for n8n MCP

### Phase 1: Infrastructure Setup
- [ ] Deploy n8n Docker stack (existing at `/home/robbe/n8n-docker-setup`)
- [ ] Install MCP community nodes (`n8n-nodes-mcp-client`)
- [ ] Set `N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true`
- [ ] Connect to existing Supabase for data persistence

### Phase 2: Core Agent Workflows
- [ ] **Griot Workflow**: Content generation with AI Agent node
- [ ] **Listener Workflow**: Social monitoring + intelligence aggregation
- [ ] **Strategist Workflow**: Campaign planning + scheduling
- [ ] **Weaver Workflow**: Automated community responses
- [ ] **Herald Workflow**: Newsletter curation + SendFox integration

### Phase 3: MCP Inter-Agent Communication
- [ ] Create MCP Trigger endpoints for each agent
- [ ] Build MCP Client connections between agents
- [ ] Implement shared memory/context via Supabase
- [ ] Test multi-agent coordination flows

### Phase 4: Platform Integrations
- [ ] Instagram Graph API workflow (native n8n node)
- [ ] TikTok publishing workflow
- [ ] LinkedIn posting workflow
- [ ] SendFox email automation

### Phase 5: Dashboard & Monitoring
- [ ] Option A: Keep existing React frontend, connect to n8n via API
- [ ] Option B: Use n8n's built-in UI + Supabase for custom dashboards
- [ ] Implement execution monitoring and error alerting

---

## Advantages of n8n MCP Approach

### 1. Reduced Development Time
- **Before**: Custom TypeScript services for each integration
- **After**: Drag-and-drop pre-built nodes (Instagram, TikTok, AI models)

### 2. Multi-Model AI Flexibility
- **Before**: Locked to Google Gemini SDK
- **After**: Easy switching between Claude, GPT-4, Gemini via MCP

### 3. Visual Debugging
- **Before**: Console logs + browser devtools
- **After**: Visual execution history with step-by-step replay

### 4. Team Accessibility
- **Before**: Requires TypeScript developers
- **After**: Content team can modify workflows visually

### 5. Built-in Scheduling
- **Before**: External cron or Supabase functions
- **After**: Native schedule triggers with timezone support

### 6. Error Recovery
- **Before**: Custom retry logic
- **After**: Built-in retry policies, error workflows, alerts

---

## Disadvantages / Trade-offs

### 1. 60-Second MCP Timeout
- Long AI generation tasks may need chunking
- Workaround: Use async patterns with callbacks

### 2. Less UI Customization
- Current bespoke React UI with BLKOUT branding
- n8n UI is functional but generic
- **Mitigation**: Keep React frontend for public pages, use n8n for backend

### 3. Self-Hosting Complexity
- Current Vercel deployment is serverless
- n8n requires Docker/VM management
- **Mitigation**: Use n8n Cloud or Railway for managed hosting

### 4. Learning Curve
- Team familiar with React/TypeScript
- n8n workflow patterns are different
- **Mitigation**: 2,709 workflow templates available

---

## Hybrid Architecture Recommendation

The optimal approach combines both:

```
┌─────────────────────────────────────────────────────────────────┐
│           React Frontend (Existing comms-blkout)                │
│    /discover (public) │ /admin (dashboard) │ /socialsync        │
└─────────────────────────────┬───────────────────────────────────┘
                              │ REST API / Webhooks
┌─────────────────────────────┴───────────────────────────────────┐
│                    n8n Workflow Engine                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │   Griot     │ │  Listener   │ │ Strategist  │ │  Herald   │ │
│  │  Workflow   │ │  Workflow   │ │  Workflow   │ │ Workflow  │ │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └─────┬─────┘ │
│         └───────────────┴───────────────┴───────────────┘       │
│                         MCP Communication                       │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                   Supabase (Shared Database)                    │
│   agent_tasks │ generated_assets │ social_media_queue │ content │
└─────────────────────────────────────────────────────────────────┘
```

**Benefits of Hybrid:**
- Keep existing custom UI investment
- Add n8n for agent automation backend
- Shared Supabase for data consistency
- Gradual migration path

---

## Example n8n Workflow: Griot Content Generator

```json
{
  "name": "BLKOUT Griot Agent",
  "nodes": [
    {
      "name": "MCP Trigger",
      "type": "n8n-nodes-mcp.mcpTrigger",
      "parameters": {
        "toolName": "griot_create_content",
        "toolDescription": "Create authentic BLKOUT content"
      }
    },
    {
      "name": "AI Agent",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "parameters": {
        "model": "claude-3-5-sonnet",
        "systemPrompt": "You are Griot, BLKOUT's storyteller. Create content rooted in Black feminist thought...",
        "tools": ["google_gemini_image", "supabase_storage"]
      }
    },
    {
      "name": "Save to Supabase",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "insert",
        "table": "generated_assets"
      }
    },
    {
      "name": "Notify Strategist",
      "type": "n8n-nodes-mcp.mcpClient",
      "parameters": {
        "serverUrl": "http://localhost:5678/mcp/strategist",
        "tool": "new_content_ready"
      }
    }
  ]
}
```

---

## Cost Comparison

| Item | Current (React/Supabase) | n8n MCP |
|------|--------------------------|---------|
| **Hosting** | Vercel Pro ($20/mo) | n8n Cloud Starter ($20/mo) or Self-hosted ($0) |
| **Database** | Supabase Pro ($25/mo) | Same Supabase ($25/mo) |
| **AI API** | Gemini ($~50/mo est.) | Same + flexibility ($~50/mo) |
| **Development** | High (custom code) | Medium (workflow building) |
| **Maintenance** | Ongoing TypeScript | Visual updates |

**Total**: Similar monthly costs, but **lower ongoing development effort** with n8n.

---

## Conclusion

Migrating BLKOUT's agent system to n8n MCP would:

1. **Simplify** multi-agent coordination with native MCP triggers/clients
2. **Accelerate** new integrations using 543 pre-built nodes
3. **Enable** non-technical team members to modify workflows
4. **Maintain** flexibility with hybrid architecture (React frontend + n8n backend)

The recommended path is a **phased hybrid migration**, keeping the existing React frontend while gradually moving agent logic to n8n workflows connected via webhooks and shared Supabase database.

---

## Sources

- [n8n MCP Server - GitHub](https://github.com/czlonkowski/n8n-mcp)
- [Exploring Multi-Agent Patterns in n8n](https://community.n8n.io/t/exploring-multi-agent-patterns-in-n8n-using-mcp-triggers-clients-without-webhooks/114944)
- [n8n MCP Integration Guide](https://generect.com/blog/n8n-mcp/)
- [Supercharge AI Agents with n8n and MCP](https://leandrocaladoferreira.medium.com/supercharge-ai-agents-with-n8n-and-mcp-a-developers-guide-a4aeb43e6089)
- [n8n-MCP Official Site](https://www.n8n-mcp.com/)

---

*Document created for BLKOUT UK communications platform architecture planning*
