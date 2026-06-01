import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { registerTools } from "../src/tools.mjs";

class FakeServer {
  constructor() {
    this.tools = new Map();
  }

  registerTool(name, config, handler) {
    this.tools.set(name, { config, handler });
  }
}

test("registerTools registers the five expected tools", () => {
  const server = new FakeServer();
  registerTools(server);

  assert.deepEqual([...server.tools.keys()], [
    "x_keyword_search",
    "x_semantic_search",
    "x_user_search",
    "x_user_posts_search",
    "x_thread_fetch",
  ]);
});

test("tool schemas validate expected inputs", () => {
  const server = new FakeServer();
  registerTools(server);

  const keywordSchema = z.object(server.tools.get("x_keyword_search").config.inputSchema);
  assert.equal(
    keywordSchema.safeParse({
      query: "Claude Code",
      from_date: "2026-01-01",
      to_date: "2026-01-31",
    }).success,
    true
  );
  assert.equal(
    keywordSchema.safeParse({
      query: "Claude Code",
      from_date: "01-01-2026",
    }).success,
    false
  );

  const threadSchema = z.object(server.tools.get("x_thread_fetch").config.inputSchema);
  assert.equal(
    threadSchema.safeParse({
      post_url: "https://x.com/xai/status/123",
      mode: "deep",
      max_posts: 120,
      timeout_seconds: 300,
    }).success,
    true
  );
  assert.equal(threadSchema.safeParse({ post_url: "not-a-url" }).success, false);
  assert.equal(
    threadSchema.safeParse({
      post_url: "https://x.com/xai/status/123",
      mode: "everything",
    }).success,
    false
  );

  const userPostsSchema = z.object(server.tools.get("x_user_posts_search").config.inputSchema);
  assert.equal(
    userPostsSchema.safeParse({
      username: "@elonmusk",
      from_date: "2026-06-01",
      to_date: "2026-06-02",
      max_results: 20,
    }).success,
    true
  );
  assert.equal(userPostsSchema.safeParse({ username: "not a handle" }).success, false);
});
