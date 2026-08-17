# LangGraph Agent Starter

A three-agent pipeline (Researcher → Writer → Reviewer) built on
[LangGraph](https://github.com/langchain-ai/langgraph). The Reviewer can send
the draft back to the Writer with feedback, up to `MAX_REVISIONS` times, then
the graph ends. Use this starter for client projects where you need explicit
control over agent state, retries, and branching logic.

## Structure

```
src/
  config.py          Settings + LLM factory (reads .env)
  logging_config.py  Structured logging setup
  state.py           Shared AgentState TypedDict
  tools/
    web_search.py    DuckDuckGo search, fails gracefully to []
    file_access.py   Read/write confined to WORKSPACE_DIR (blocks path traversal)
  agents/
    researcher.py    Gathers findings via web_search + LLM summary
    writer.py         Drafts the article, incorporates reviewer feedback
    reviewer.py       Approves or requests a revision
  graph.py           Wires the nodes + the approve/revise loop
  main.py            CLI entry point
tests/
  test_graph.py         Routing logic (no API key needed)
  test_file_access.py   Workspace path-traversal guard
```

## Setup

```bash
cd langgraph-agent-starter
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add your ANTHROPIC_API_KEY
```

## Run

```bash
python -m src.main "the state of AI agent tooling in 2026"
```

The final article prints to stdout and is saved to `workspace/output/article.md`.

## Test

```bash
pytest
```

Tests don't call the LLM or the network, so they run without an API key.

## Extending for a client project

- Add tools in `src/tools/` and pass them into an agent's LLM call (or bind
  them with `.bind_tools(...)` if you want the LLM to call them directly
  instead of the node calling them itself).
- Add nodes in `src/agents/` and wire them into `src/graph.py`.
- Swap the model provider by editing `get_llm()` in `src/config.py`.
- Keep `WORKSPACE_DIR` scoped per client/project so agents can't read or
  write outside their sandbox.
