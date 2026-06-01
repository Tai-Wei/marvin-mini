import { spawn } from "node:child_process";

const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_IDLE_TIMEOUT_MS = 120_000;
const MAX_STDOUT_BYTES = 1024 * 1024;
const MAX_STDERR_CHARS = 8192;
const MIN_TIMEOUT_MS = 10_000;
const MAX_TIMEOUT_MS = 600_000;

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

function normalizeDuration(value, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.trunc(value), MIN_TIMEOUT_MS), MAX_TIMEOUT_MS);
}

function formatSeconds(ms) {
  return Math.round(ms / 1000);
}

export async function runGrokWithTools(prompt, tools, options = {}) {
  return new Promise((resolve, reject) => {
    const grokBin = process.env.MARVIN_GROK_BIN ?? "grok";
    const timeoutMs = normalizeDuration(options.timeoutMs, DEFAULT_TIMEOUT_MS);
    const idleTimeoutMs = normalizeDuration(
      options.idleTimeoutMs,
      Math.min(DEFAULT_IDLE_TIMEOUT_MS, timeoutMs)
    );
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
    let totalTimeout;
    let idleTimeout;
    let lastActivityAt = Date.now();
    const cleanupTimers = () => {
      clearTimeout(totalTimeout);
      clearTimeout(idleTimeout);
    };
    const settle = (fn, value) => {
      if (settled) return;
      settled = true;
      cleanupTimers();
      fn(value);
    };
    const killAndReject = (message) => {
      if (!child.killed) {
        child.kill("SIGTERM");
      }
      settle(reject, new Error(message));
    };
    const resetIdleTimeout = () => {
      lastActivityAt = Date.now();
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        killAndReject(
          `grok produced no output for ${formatSeconds(idleTimeoutMs)} seconds ` +
            `(total timeout ${formatSeconds(timeoutMs)} seconds)`
        );
      }, idleTimeoutMs);
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

    totalTimeout = setTimeout(() => {
      killAndReject(
        `grok timed out after ${formatSeconds(timeoutMs)} seconds ` +
          `(last output ${formatSeconds(Date.now() - lastActivityAt)} seconds ago)`
      );
    }, timeoutMs);
    resetIdleTimeout();

    let stdout = "";
    let stdoutBytes = 0;
    let stderr = "";
    let killedForLimits = false;

    child.stdout.on("data", (chunk) => {
      resetIdleTimeout();
      const str = String(chunk);
      stdout += str;
      stdoutBytes += Buffer.byteLength(str);

      if (stdoutBytes > MAX_STDOUT_BYTES && !killedForLimits) {
        killedForLimits = true;
        child.kill("SIGTERM");
        settle(reject, new Error("grok output exceeded 1MB limit"));
      }
    });

    child.stderr.on("data", (chunk) => {
      resetIdleTimeout();
      stderr += String(chunk);
      if (stderr.length > MAX_STDERR_CHARS) {
        stderr = stderr.slice(-MAX_STDERR_CHARS);
      }
    });

    child.on("error", (err) => {
      if (err?.code === "ENOENT") {
        settle(reject, buildNotFoundError());
      } else {
        settle(reject, new Error(`Failed to run grok: ${err?.message ?? "unknown error"}`));
      }
    });

    child.on("close", (code) => {
      cleanupTimers();
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
