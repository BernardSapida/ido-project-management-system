/**
 * Configure GitHub Packages auth for @bernardsapida/web-ui so `pnpm i` works.
 *
 * Reads NPM_TOKEN from the environment, falling back to a NPM_TOKEN= line in
 * .env.local, then writes it machine-level:
 *   pnpm config set "//npm.pkg.github.com/:_authToken" <token>
 *
 * Run this BEFORE `pnpm i`, so it deliberately uses no dependencies.
 *
 *   node scripts/setup-npm-auth.mjs
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_KEY = "//npm.pkg.github.com/:_authToken";

function fromEnvFile() {
  for (const rel of [".env.local", "environments/local.env"]) {
    try {
      const body = readFileSync(resolve(root, rel), "utf8");
      const line = body
        .split(/\r?\n/)
        .find((l) => /^\s*NPM_TOKEN\s*=/.test(l) && !/^\s*#/.test(l));
      if (line) {
        return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
      }
    } catch {
      // file not present in this repo - try the next candidate
    }
  }
  return undefined;
}

const raw = process.env.NPM_TOKEN?.trim() || fromEnvFile();

if (!raw) {
  console.error(
    "✗ No token found. Set NPM_TOKEN in your shell or add NPM_TOKEN=<pat> to .env.local.",
  );
  process.exit(1);
}

// Strip anything outside a valid PAT charset (trailing paste junk, BOM, etc.)
const token = raw.replace(/[^A-Za-z0-9_]/g, "");

if (!/^(ghp_|github_pat_)/.test(token)) {
  console.error(
    `✗ "${token.slice(0, 8)}…" does not look like a GitHub PAT (needs ghp_ or github_pat_ prefix).`,
  );
  process.exit(1);
}

execFileSync("pnpm", ["config", "set", REGISTRY_KEY, token], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

console.log(`✓ Set ${REGISTRY_KEY} (token ${token.slice(0, 8)}…${token.slice(-4)})`);
console.log("  Run `pnpm i` now. If it still 401s, the PAT is invalid or lacks read:packages.");
