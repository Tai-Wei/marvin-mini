import assert from "node:assert/strict";
import test from "node:test";
import {
  buildKeywordPrompt,
  buildSemanticPrompt,
  buildThreadPrompt,
  buildUserPrompt,
} from "../src/prompts.mjs";

test("buildKeywordPrompt quotes query and includes optional date filters", () => {
  const prompt = buildKeywordPrompt({
    query: 'Claude "Code"\nworkflow',
    from_date: "2026-01-01",
    to_date: "2026-01-31",
  });

  assert.match(prompt, /Use x_keyword_search/);
  assert.match(prompt, /"Claude \\"Code\\"\\nworkflow"/);
  assert.match(prompt, /Filter: only posts from 2026-01-01 to 2026-01-31/);
  assert.match(prompt, /exact visible post text/);
  assert.match(prompt, /no visible text/);
});

test("prompt builders quote user-controlled fields", () => {
  assert.match(buildSemanticPrompt({ query: "AI\nnews" }), /"AI\\nnews"/);
  assert.match(buildUserPrompt({ username: 'xai"' }), /"xai\\""/);
  assert.match(
    buildThreadPrompt({ post_url: "https://x.com/xai/status/123" }),
    /"https:\/\/x.com\/xai\/status\/123"/
  );
});

test("user prompt asks for recent post text and context", () => {
  const prompt = buildUserPrompt({ username: "elonmusk" });

  assert.match(prompt, /Recent posts, newest first/);
  assert.match(prompt, /exact visible post text/);
  assert.match(prompt, /emoji, punctuation, or a short word/);
  assert.match(prompt, /quoted\/replied-to post text/);
});
