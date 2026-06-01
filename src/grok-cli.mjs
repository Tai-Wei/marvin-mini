import { spawn } from "node:child_process";

const TIMEOUT_MS = 120_000;
const MAX_STDOUT_BYTES = 512 * 1024;
const MAX_STDERR_CHARS = 8192;

function buildNotFoundError() {
  return new Error(
    "grok command not found. Is Grok Build CLI installed?\n" +
      "Install: curl -fsSL https://x.ai/cli/install.sh | bash\n" +
      "Login: grok login"
  );
}

function normalizeErrorFromStderr(stderr) {
  const cleaned = String(stderr ?? "")
    .replace(/^thread '.*$/gm, "")
    .trim();
  return cleaned || "grok command failed";
}

export async function runGrokWithTools(prompt, tools) {
  return new Promise((resolve, reject) => {
    const grokBin = process.env.MARVIN_GROK_BIN ?? "grok";
    const args = [
      "-p",
      String(prompt),
      "--tools",
      String(tools),
      "--output-format",
      "json",
      "--permission-mode",
      "plan",
      "--no-subagents",
      "--max-turns",
      "10",
    ];

    let child;
    let settled = false;
    const settle = (fn, value) => {
      if (settled) return;
      settled = true;
      fn(value);
    };

    try {
      child = spawn(grokBin, args, {
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (err) {
      if (err?.code === "ENOENT") {
        settle(reject, buildNotFoundError());
      } else {
        settle(reject, new Error(`Failed to run grok: ${err?.message ?? "unknown error"}`));
      }
      return;
    }

    const timeout = setTimeout(() => {
      if (!child.killed) {
        child.kill("SIGTERM");
      }
      settle(reject, new Error("grok timed out after 2 minutes"));
    }, TIMEOUT_MS);

    let stdout = "";
    let stdoutBytes = 0;
    let stderr = "";
    let killedForLimits = false;

    child.stdout.on("data", (chunk) => {
      const str = String(chunk);
      stdout += str;
      stdoutBytes += Buffer.byteLength(str);

      if (stdoutBytes > MAX_STDOUT_BYTES && !killedForLimits) {
        killedForLimits = true;
        child.kill("SIGTERM");
        settle(reject, new Error("grok output exceeded 512KB limit"));
      }
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
      if (stderr.length > MAX_STDERR_CHARS) {
        stderr = stderr.slice(-MAX_STDERR_CHARS);
      }
    });

    child.on("error", (err) => {
      clearTimeout(timeout);
      if (err?.code === "ENOENT") {
        settle(reject, buildNotFoundError());
      } else {
        settle(reject, new Error(`Failed to run grok: ${err?.message ?? "unknown error"}`));
      }
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      if (settled) return;

      if (code !== 0) {
        settle(
          reject,
          new Error(`grok exited with code ${code}: ${normalizeErrorFromStderr(stderr)}`)
        );
        return;
      }

      try {
        const parsed = JSON.parse(stdout);
        if (
          parsed === null ||
          typeof parsed !== "object" ||
          typeof parsed.text !== "string"
        ) {
          throw new Error('Parsed grok output must be an object with a string "text" field');
        }

        settle(resolve, parsed.text);
      } catch (error) {
        settle(
          reject,
          new Error(
            `Failed to parse grok JSON output: ${error?.message ?? "invalid output"}\n` +
              `stdout (first 500 chars): ${stdout.slice(0, 500)}`
          )
        );
      }
    });
  });
}
