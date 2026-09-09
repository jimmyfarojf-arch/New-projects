import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RunRecord } from "../types.js";

/**
 * Flat-file run store: one JSON file per run under `dataDir`.
 *
 * A real product would use a database (this project's original inspiration
 * uses Postgres); JSON-on-disk keeps the sample project runnable with zero
 * external services while still giving a genuine "list past runs / inspect
 * one run" experience for the CLI and API.
 */
export class RunStore {
  constructor(private readonly dataDir: string = path.resolve("data", "runs")) {}

  async save(record: RunRecord): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });
    const filePath = path.join(this.dataDir, `${record.runId}.json`);
    await writeFile(filePath, JSON.stringify(record, null, 2), "utf-8");
  }

  async get(runId: string): Promise<RunRecord | undefined> {
    try {
      const raw = await readFile(path.join(this.dataDir, `${runId}.json`), "utf-8");
      return JSON.parse(raw) as RunRecord;
    } catch {
      return undefined;
    }
  }

  async list(): Promise<RunRecord[]> {
    try {
      const files = await readdir(this.dataDir);
      const records = await Promise.all(
        files
          .filter((f) => f.endsWith(".json"))
          .map(async (f) => JSON.parse(await readFile(path.join(this.dataDir, f), "utf-8")) as RunRecord)
      );
      return records.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    } catch {
      return [];
    }
  }
}
