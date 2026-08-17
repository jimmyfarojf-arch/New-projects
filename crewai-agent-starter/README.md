# CrewAI Agent Starter

A three-agent crew (Researcher → Writer → Editor) built on
[CrewAI](https://github.com/crewAIInc/crewAI), run sequentially. Use this
starter for smaller or faster client projects where CrewAI's role-based API
gets you to a working multi-agent flow quicker than hand-wiring a graph.

## Structure

```
src/
  config.py          Settings + LLM factory (reads .env)
  logging_config.py  Structured logging setup
  tools/
    web_search.py    DuckDuckGo search, fails gracefully to []; wrapped as a CrewAI tool
    file_access.py   Read/write confined to WORKSPACE_DIR (blocks path traversal)
  agents.py          Researcher / Writer / Editor agent definitions (built lazily)
  tasks.py           The task chain, each with context from the previous task
  crew.py            Assembles the sequential Crew
  main.py            CLI entry point
tests/
  test_file_access.py   Workspace path-traversal guard (no API key needed)
```

## Setup

```bash
cd crewai-agent-starter
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

Agent/crew construction requires an API key (it builds a real LLM client), so
those paths aren't unit-tested here — `test_file_access.py` covers the pure
logic. For an end-to-end check, run `python -m src.main "<topic>"` with a key
set.

## Extending for a client project

- Add tools in `src/tools/`, decorate with `@tool(...)`, and add them to an
  agent's `tools=[...]` list in `src/agents.py`.
- Add agents in `build_agents()` and matching tasks in `build_tasks()`.
- Switch `Process.sequential` to `Process.hierarchical` in `src/crew.py` if
  you want a manager agent delegating to the others instead of a fixed order.
- Keep `WORKSPACE_DIR` scoped per client/project so agents can't read or
  write outside their sandbox.
