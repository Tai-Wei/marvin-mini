import { z } from "zod";
import { runGrokWithTools } from "./grok-cli.mjs";
import {
  buildKeywordPrompt,
  buildSemanticPrompt,
  buildUserPrompt,
  buildUserPostsPrompt,
  buildThreadPrompt,
} from "./prompts.mjs";

const THREAD_MODE_DEFAULTS = {
  summary: { maxPosts: 20, timeoutSeconds: 120 },
  balanced: { maxPosts: 50, timeoutSeconds: 180 },
  deep: { maxPosts: 120, timeoutSeconds: 300 },
};

function buildTimeoutOptions(timeoutSeconds) {
  const timeoutMs = timeoutSeconds * 1000;
  return {
    timeoutMs,
    idleTimeoutMs: Math.min(timeoutMs, 120_000),
  };
}

async function callGrok(prompt, tool, options) {
  try {
    const result = await runGrokWithTools(prompt, tool, options);
    return {
      content: [{ type: "text", text: result }],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      isError: true,
      content: [{ type: "text", text: `marvin-mini error: ${message}` }],
    };
  }
}

export function registerTools(server) {
  server.registerTool(
    "x_keyword_search",
    {
      description: "Search X/Twitter posts by keyword and return post text, dates, authors, and links. For multi-day searches, split the date range into daily shards and run parallel calls when your CLI supports agents.",
      inputSchema: {
        query: z.string().describe("Keyword search query"),
        from_date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .describe("Start date (YYYY-MM-DD), best-effort"),
        to_date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .describe("End date (YYYY-MM-DD), best-effort"),
      },
    },
    async (params) => callGrok(buildKeywordPrompt(params), "x_keyword_search")
  );

  server.registerTool(
    "x_semantic_search",
    {
      description: "Search X/Twitter posts by meaning/intent and return post text, dates, authors, and links.",
      inputSchema: {
        query: z.string().describe("Natural language search query"),
      },
    },
    async (params) => callGrok(buildSemanticPrompt(params), "x_semantic_search")
  );

  server.registerTool(
    "x_user_search",
    {
      description: "Search for an X/Twitter user's profile and recent posts with visible post text and links.",
      inputSchema: {
        username: z.string().describe("X/Twitter username (without @)"),
      },
    },
    async (params) => callGrok(buildUserPrompt(params), "x_user_search")
  );

  server.registerTool(
    "x_user_posts_search",
    {
      description: "Search posts from one X/Twitter user over a date range. For multi-day ranges, prefer one parallel agent per day, then merge and dedupe results.",
      inputSchema: {
        username: z
          .string()
          .regex(/^@?[A-Za-z0-9_]{1,20}$/)
          .describe("X/Twitter username, with or without @"),
        from_date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .describe("Start date (YYYY-MM-DD), best-effort"),
        to_date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .describe("End date (YYYY-MM-DD), best-effort"),
        max_results: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe("Maximum posts to return, best-effort"),
      },
    },
    async (params) => callGrok(buildUserPostsPrompt(params), "x_keyword_search")
  );

  server.registerTool(
    "x_thread_fetch",
    {
      description: "Fetch X/Twitter thread context with visible post text, dates, authors, links, and replies. For long or high-engagement threads, use summary/balanced first, then run parallel x_thread_fetch calls on selected reply or quote URLs.",
      inputSchema: {
        post_url: z.string().url().describe("URL of the X/Twitter post"),
        mode: z
          .enum(["summary", "balanced", "deep"])
          .optional()
          .describe("Depth preset. summary is fastest, balanced is default, deep may need a longer tool timeout."),
        max_posts: z
          .number()
          .int()
          .min(5)
          .max(200)
          .optional()
          .describe("Maximum visible posts to return, best-effort"),
        timeout_seconds: z
          .number()
          .int()
          .min(30)
          .max(600)
          .optional()
          .describe("Grok subprocess total timeout in seconds. The MCP client may also need a matching tool timeout."),
      },
    },
    async (params) => {
      const mode = params.mode ?? "balanced";
      const defaults = THREAD_MODE_DEFAULTS[mode];
      const normalized = {
        ...params,
        mode,
        max_posts: params.max_posts ?? defaults.maxPosts,
        timeout_seconds: params.timeout_seconds ?? defaults.timeoutSeconds,
      };
      return callGrok(
        buildThreadPrompt(normalized),
        "x_thread_fetch",
        buildTimeoutOptions(normalized.timeout_seconds)
      );
    }
  );
}
