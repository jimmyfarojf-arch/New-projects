# Aperture

**An orchestrated AI pipeline that researches a topic, drafts content, and scores it for both classic SEO and AI-answer (GEO) visibility.**

Built as a focused engineering sample: not a clone of any commercial product, but a small system that explores the same problem space as "SEO/GEO as software" platforms — research → content → publish, with automated quality gating in between.

## Why this exists

Search is splitting into two channels: classic ranked results, and direct answers pulled by LLM-backed assistants and AI-powered search. A page can rank well in traditional SEO while still being nearly impossible for an AI answer engine to cleanly extract and cite — wrong structure, no direct answer up top, no FAQ block to quote from. Aperture treats those as two separate, both-measured dimensions instead of one blended "SEO score":

- **SEO score** — heading structure, meta description, keyword usage, readability
- **GEO score** — does the opening paragraph give a citable direct answer, is there an FAQ block, are the long-tail questions people actually ask covered, is the structure ready for schema markup

A draft only auto-publishes once it clears a combined quality threshold; anything below that is held for human review instead of failing silently.

## Architecture

```
                 ┌──────────────┐
  topic  ──────▶ │   research   │  SearchAdapter → long-tail questions,
                 └──────┬───────┘  competitor themes, subtopics
                        ▼
                 ┌──────────────┐
                 │    brief     │  LlmAdapter → structured content brief
                 └──────┬───────┘  (title, audience, outline, must-answer Qs)
                        ▼
                 ┌──────────────┐
                 │    draft     │  LlmAdapter → full Markdown article
                 └──────┬───────┘
                        ▼
                 ┌──────────────┐
                 │    score     │  pure functions → SEO score + GEO score
                 └──────┬───────┘
                        ▼
                 ┌──────────────┐
                 │   publish    │  PublisherAdapter, gated by combined score
                 └──────────────┘
```

Every step reads/writes a shared `PipelineContext`. The `PipelineOrchestrator` runs the steps in order, timing each one, retrying transient failures with backoff, and emitting lifecycle events — which is what the CLI's live progress output and the run-history log are built on.

**Adapters, not hard dependencies.** `LlmAdapter`, `SearchAdapter`, and `PublisherAdapter` are narrow interfaces. Production code uses `AnthropicLlmAdapter` and (optionally) `WebhookPublisherAdapter`; tests and offline demo runs use `MockLlmAdapter`, `MockSearchAdapter`, and `MockPublisherAdapter`. This is what keeps the test suite fast and network-free, and it's the same seam a real integration (a different model provider, a real search API, a real CMS) would plug into.

## Project layout

```
src/
  types.ts                 Shared domain types
  pipeline/
    orchestrator.ts         Step runner: sequencing, retries, events
    buildPipeline.ts         Wires adapters into a configured pipeline
    steps/                  research / brief / draft / score / publish
  adapters/
    llm/                    Anthropic + mock implementations
    search/                 Mock research implementation
    publisher/              Mock + webhook implementations
  scoring/
    readability.ts           Flesch Reading Ease, from scratch
    seoScore.ts               Classic SEO scoring
    geoScore.ts               GEO / AI-answer visibility scoring
  storage/runStore.ts        Flat-file run history
  cli.ts                    CLI entry point
  server.ts                 HTTP API (Hono)
tests/                      27 tests covering scoring + orchestrator behaviour
```

## Getting started

```bash
npm install
npm test          # 27 tests, no network or API key required
npm run typecheck

# Run the pipeline end-to-end in offline mode (deterministic mock LLM)
npm run cli -- run --topic "garden fence installation"

# Or with real content generation
export ANTHROPIC_API_KEY=sk-...
npm run cli -- run --topic "garden fence installation"

npm run cli -- history
npm run cli -- show <runId>

# HTTP API
npm run server
curl -X POST localhost:3000/runs -H 'content-type: application/json' \
  -d '{"topic":"garden fence installation"}'
```

See `.env.example` for all configuration options (API key, model, publish webhook, port).

## Example run

```
$ npm run cli -- run --topic "garden fence installation" --offline

-> research (attempt 1)
   ok (0ms)
-> brief (attempt 1)
   ok (1ms)
-> draft (attempt 1)
   ok (0ms)
-> score (attempt 1)
   ok (6ms)
-> publish (attempt 1)
   ok (0ms)

Run 23e43775-e5f2-4077-867e-d2fbff6892b9 -- completed

SEO score:      80/100
GEO score:      100/100
Combined score: 91/100

Published -> mock://local-preview
```

Resulting scoring detail (real output from this run, mock-LLM draft — see `examples/sample-run-output.md` for the full draft and JSON):

```
SEO  breakdown: headingStructure 100, metaDescription 60, keywordUsage 50, readability 100
     issues: meta description under the 120-158 sweet spot; keyword density 5.4% (mock draft
             repeats the exact topic phrase in every heading, which is realistic for what
             happens when a draft isn't varied enough -- exactly the kind of thing this step
             is meant to catch)

GEO  breakdown: directAnswerOpening 100, faqCoverage 100, longTailCoverage 100,
                structuredDataReadiness 100
     issues: none -- direct answer up top, FAQ block present, all long-tail
             questions from research addressed
```

## What this project is (and isn't) demonstrating

- **Workflow orchestration**: a small hand-rolled step runner with retry/backoff and structured logging, rather than a black-box framework — the mechanics are visible and testable.
- **Backend systems & APIs**: the same pipeline is runnable as a CLI, an HTTP API, or a library import.
- **Integrations**: a real LLM integration (Anthropic) and a real outbound webhook integration, both behind adapters so the core logic never touches a network client directly.
- **Automation with a quality gate**: publishing isn't unconditional -- a scoring layer decides whether a draft is good enough to ship automatically or needs a human.
- **Testing discipline**: scoring logic is pure functions with focused unit tests; the orchestrator's retry/failure/event behaviour is covered with real (not mocked-out) sequencing tests; CI runs an actual offline pipeline execution as a smoke test, not just unit tests in isolation.

It intentionally does **not** ship a real search/SERP integration, a real CMS integration, or a UI -- those are the parts that would be genuinely product-specific rather than illustrative of engineering approach, and mocking them out is what keeps this repo reviewable in one sitting.

## License

MIT -- see `LICENSE`.
