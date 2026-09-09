import { randomUUID } from "node:crypto";
import { buildPipeline } from "./pipeline/buildPipeline.js";
import { MockLlmAdapter } from "./adapters/llm/mock.js";
import { AnthropicLlmAdapter } from "./adapters/llm/anthropic.js";
import { MockSearchAdapter } from "./adapters/search/mock.js";
import { MockPublisherAdapter } from "./adapters/publisher/mock.js";
import { WebhookPublisherAdapter } from "./adapters/publisher/webhook.js";
import { RunStore } from "./storage/runStore.js";
import type { LlmAdapter } from "./adapters/llm/types.js";
import type { PublisherAdapter } from "./adapters/publisher/types.js";
import type { PipelineContext } from "./types.js";

async function main() {
  const [command, ...rest] = process.argv.slice(2);

  switch (command) {
    case "run":
      await runCommand(rest);
      break;
    case "history":
      await historyCommand();
      break;
    case "show":
      await showCommand(rest);
      break;
    default:
      printUsage();
      process.exitCode = command ? 1 : 0;
  }
}

async function runCommand(args: string[]) {
  const topic = getFlag(args, "--topic");
  const offline = args.includes("--offline") || !process.env.ANTHROPIC_API_KEY;

  if (!topic) {
    console.error('Missing required flag: --topic "your topic here"');
    process.exitCode = 1;
    return;
  }

  const llm: LlmAdapter = offline ? new MockLlmAdapter() : new AnthropicLlmAdapter();
  const publisher: PublisherAdapter = process.env.PUBLISH_WEBHOOK_URL
    ? new WebhookPublisherAdapter(process.env.PUBLISH_WEBHOOK_URL)
    : new MockPublisherAdapter();

  if (offline) {
    console.log("Running in offline mode (mock LLM) -- set ANTHROPIC_API_KEY to use real content generation.\n");
  }

  const pipeline = buildPipeline(
    { llm, search: new MockSearchAdapter(), publisher },
    {
      onEvent: (event) => {
        if (event.type === "step:start") console.log(`-> ${event.step} (attempt ${event.attempt})`);
        if (event.type === "step:ok") console.log(`   ok (${event.durationMs}ms)`);
        if (event.type === "step:retry") console.log(`   retrying after error: ${event.error}`);
        if (event.type === "step:failed") console.log(`   FAILED: ${event.error}`);
      },
    }
  );

  const initialContext: PipelineContext = { runId: randomUUID(), topic };
  const record = await pipeline.run(initialContext);

  const store = new RunStore();
  await store.save(record);

  console.log(`\nRun ${record.runId} -- ${record.status}\n`);

  if (record.context.score) {
    const { seo, geo, combined } = record.context.score;
    console.log(`SEO score:      ${seo.total}/100`);
    console.log(`GEO score:      ${geo.total}/100`);
    console.log(`Combined score: ${combined}/100\n`);
  }

  if (record.context.publish) {
    console.log(
      record.context.publish.published
        ? `Published -> ${record.context.publish.target}`
        : `Not published: ${record.context.publish.reason}`
    );
  }

  console.log(`\nSaved to data/runs/${record.runId}.json`);
}

async function historyCommand() {
  const store = new RunStore();
  const runs = await store.list();

  if (runs.length === 0) {
    console.log('No runs yet. Try: npm run cli -- run --topic "your topic"');
    return;
  }

  for (const run of runs) {
    const score = run.context.score?.combined;
    console.log(
      `${run.runId}  ${run.startedAt}  [${run.status}]  ${run.topic}${
        score !== undefined ? `  (score: ${score})` : ""
      }`
    );
  }
}

async function showCommand(args: string[]) {
  const runId = args[0];
  if (!runId) {
    console.error("Usage: npm run cli -- show <runId>");
    process.exitCode = 1;
    return;
  }

  const store = new RunStore();
  const run = await store.get(runId);
  if (!run) {
    console.error(`No run found with id ${runId}`);
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify(run, null, 2));
}

function getFlag(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}

function printUsage() {
  console.log(`Aperture CLI

Usage:
  npm run cli -- run --topic "your topic" [--offline]
  npm run cli -- history
  npm run cli -- show <runId>

Environment:
  ANTHROPIC_API_KEY     Enables real content generation (omit for offline/mock mode)
  PUBLISH_WEBHOOK_URL   If set, the publish step POSTs the draft here instead of mock-publishing
`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
