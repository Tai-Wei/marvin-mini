import { z } from "zod";
import { runGrokWithTools } from "./grok-cli.mjs";
import {
  buildKeywordPrompt,
  buildSemanticPrompt,
  buildUserPrompt,
  buildThreadPrompt,
} from "./prompts.mjs";

async function callGrok(prompt, tool) {
  try {
    const result = await runGrokWithTools(prompt, tool);
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
      description: "Search X/Twitter posts by keyword.",
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
      description: "Search X/Twitter posts by meaning/intent using natural language.",
      inputSchema: {
        query: z.string().describe("Natural language search query"),
      },
    },
    async (params) => callGrok(buildSemanticPrompt(params), "x_semantic_search")
  );

  server.registerTool(
    "x_user_search",
    {
      description: "Search for an X/Twitter user's profile and recent posts.",
      inputSchema: {
        username: z.string().describe("X/Twitter username (without @)"),
      },
    },
    async (params) => callGrok(buildUserPrompt(params), "x_user_search")
  );

  server.registerTool(
    "x_thread_fetch",
    {
      description: "Fetch a full X/Twitter thread including all replies.",
      inputSchema: {
        post_url: z.string().url().describe("URL of the X/Twitter post"),
      },
    },
    async (params) => callGrok(buildThreadPrompt(params), "x_thread_fetch")
  );
}
