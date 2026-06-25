#!/usr/bin/env node
/**
 * Claude Code PostToolUse hook — runs Prettier then ESLint --fix on saved files.
 * Reads hook JSON from stdin: { tool_input: { file_path: string } }
 * Exits 0 always; errors are printed but never block the edit.
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const ALLOWED_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".json",
  ".css",
]);

const ESLINT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

const IGNORE_DIRS = [
  "node_modules",
  ".next",
  "out",
  "build",
  "references",
  ".claude",
  "scripts",
];

// Resolve actual JS entry points — avoids running bash .bin stubs on Windows
const PROJECT_DIR = process.cwd();
const PRETTIER_BIN = path.join(
  PROJECT_DIR,
  "node_modules",
  "prettier",
  "bin",
  "prettier.cjs"
);
const ESLINT_BIN = path.join(
  PROJECT_DIR,
  "node_modules",
  "eslint",
  "bin",
  "eslint.js"
);
const NODE = process.execPath;

async function main() {
  // Read stdin
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;

  let hookData;
  try {
    hookData = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const filePath = hookData?.tool_input?.file_path;
  if (!filePath) process.exit(0);

  const absFile = path.resolve(filePath);

  // Must be inside project
  if (!absFile.startsWith(PROJECT_DIR + path.sep) && absFile !== PROJECT_DIR) {
    process.exit(0);
  }

  // Must exist
  if (!existsSync(absFile)) process.exit(0);

  // Must have allowed extension
  const ext = path.extname(absFile).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) process.exit(0);

  // Must not be in ignored dirs
  const rel = path.relative(PROJECT_DIR, absFile);
  const firstSegment = rel.split(path.sep)[0];
  if (IGNORE_DIRS.includes(firstSegment)) process.exit(0);

  // Run Prettier
  if (existsSync(PRETTIER_BIN)) {
    try {
      execFileSync(NODE, [PRETTIER_BIN, "--write", absFile], {
        cwd: PROJECT_DIR,
        stdio: "inherit",
      });
    } catch (err) {
      console.error("[format-hook] Prettier failed:", err.message);
    }
  }

  // Run ESLint --fix (only on JS/TS files)
  if (ESLINT_EXTENSIONS.has(ext) && existsSync(ESLINT_BIN)) {
    try {
      execFileSync(NODE, [ESLINT_BIN, "--fix", absFile], {
        cwd: PROJECT_DIR,
        stdio: "inherit",
      });
    } catch {
      // Non-zero exit = unfixable lint errors — that's OK
    }
  }

  process.exit(0);
}

main();
