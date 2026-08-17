# New-projects

Starter kits for building AI agents for client work.

## Starters

- **[langgraph-agent-starter](./langgraph-agent-starter)** — a Researcher → Writer → Reviewer
  pipeline on [LangGraph](https://github.com/langchain-ai/langgraph), with an explicit
  approve/revise loop. Pick this when you need fine-grained control over agent state,
  branching, and retries, or the client's stack is technical/code-first.
- **[crewai-agent-starter](./crewai-agent-starter)** — the same three-role pipeline on
  [CrewAI](https://github.com/crewAIInc/crewAI). Pick this when you want a working
  multi-agent flow faster and don't need custom branching logic.

Both starters are self-contained (own `requirements.txt`, `.env.example`, tests) so you can
copy either one as the base for a new client repo. Each includes:

- A web search tool and a file-access tool sandboxed to a `workspace/` directory
  (path traversal is blocked), both failing gracefully instead of crashing the run.
- Structured logging per agent.
- Tests that run without an API key or network access.

See each starter's README for setup, run, and extension instructions.
