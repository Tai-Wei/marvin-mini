import assert from "node:assert/strict";
import { chmod, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { runGrokWithTools } from "../src/grok-cli.mjs";

async function withFakeGrok(source, fn) {
  const dir = await mkdtemp(join(tmpdir(), "marvin-mini-grok-"));
  const executable = join(dir, "grok");
  await writeFile(executable, source);
  await chmod(executable, 0o755);

  const previous = process.env.MARVIN_GROK_BIN;
  process.env.MARVIN_GROK_BIN = executable;
  try {
    return await fn(executable);
  } finally {
    if (previous === undefined) {
      delete process.env.MARVIN_GROK_BIN;
    } else {
      process.env.MARVIN_GROK_BIN = previous;
    }
  }
}

test("runGrokWithTools resolves the text field from JSON output", async () => {
  await withFakeGrok(
    `#!/usr/bin/env node
console.log(JSON.stringify({ text: "ok", stopReason: "EndTurn" }));
`,
    async () => {
      const result = await runGrokWithTools("prompt", "x_keyword_search");
      assert.equal(result, "ok");
    }
  );
});

test("runGrokWithTools rejects when JSON output is malformed", async () => {
  await withFakeGrok(
    `#!/usr/bin/env node
console.log("not-json");
`,
    async () => {
      await assert.rejects(
        () => runGrokWithTools("prompt", "x_keyword_search"),
        /Failed to parse grok JSON output/
      );
    }
  );
});

test("runGrokWithTools rejects when text field is missing", async () => {
  await withFakeGrok(
    `#!/usr/bin/env node
console.log(JSON.stringify({ stopReason: "EndTurn" }));
`,
    async () => {
      await assert.rejects(
        () => runGrokWithTools("prompt", "x_keyword_search"),
        /string "text" field/
      );
    }
  );
});

test("runGrokWithTools includes stderr when grok exits non-zero", async () => {
  await withFakeGrok(
    `#!/usr/bin/env node
console.error("login required");
process.exit(2);
`,
    async () => {
      await assert.rejects(
        () => runGrokWithTools("prompt", "x_keyword_search"),
        /grok exited with code 2: login required/
      );
    }
  );
});

test("runGrokWithTools reports missing grok binary", async () => {
  const previous = process.env.MARVIN_GROK_BIN;
  process.env.MARVIN_GROK_BIN = "/definitely/missing/grok";
  try {
    await assert.rejects(
      () => runGrokWithTools("prompt", "x_keyword_search"),
      /grok command not found/
    );
  } finally {
    if (previous === undefined) {
      delete process.env.MARVIN_GROK_BIN;
    } else {
      process.env.MARVIN_GROK_BIN = previous;
    }
  }
});
