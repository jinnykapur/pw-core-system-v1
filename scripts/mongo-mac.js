#!/usr/bin/env node

const { spawnSync } = require("node:child_process");

const command = process.argv[2] || "status";
const supportedCommands = new Set(["start", "stop", "status"]);

if (!supportedCommands.has(command)) {
  console.error(`[db] Unknown command "${command}". Use start, stop, or status.`);
  process.exit(1);
}

if (process.platform !== "darwin") {
  console.error("[db] This helper is intended for macOS. Use your local MongoDB setup on this platform.");
  process.exit(1);
}

const brewCheck = spawnSync("brew", ["--version"], { encoding: "utf8" });
if (brewCheck.status !== 0) {
  console.error("[db] Homebrew is not available. Install Homebrew first, then install MongoDB Community Edition.");
  process.exit(1);
}

function runBrew(args) {
  return spawnSync("brew", args, { encoding: "utf8" });
}

const installedFormulae = runBrew(["list", "--formula"]);
if (installedFormulae.status !== 0) {
  console.error(installedFormulae.stderr || installedFormulae.stdout || "[db] Could not inspect Homebrew formulae.");
  process.exit(installedFormulae.status || 1);
}

const formula = installedFormulae.stdout
  .split("\n")
  .map((entry) => entry.trim())
  .find((entry) => entry === "mongodb-community");

if (!formula) {
  console.error("[db] MongoDB Community Edition is not installed with Homebrew.");
  console.error("[db] Run these commands once:");
  console.error("  brew tap mongodb/brew");
  console.error("  brew install mongodb-community");
  process.exit(1);
}

if (command === "status") {
  const result = runBrew(["services", "list"]);
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout || "[db] Could not inspect Homebrew services.");
    process.exit(result.status || 1);
  }

  const line =
    result.stdout
      .split("\n")
      .find((entry) => entry.trim().startsWith("mongodb-community ")) ||
    result.stdout
      .split("\n")
      .find((entry) => entry.trim().startsWith("mongodb/brew/mongodb-community "));

  if (line) {
    console.log(`[db] ${line.trim()}`);
    process.exit(0);
  }

  console.log("[db] MongoDB is installed, but no Homebrew service status was found.");
  process.exit(0);
}

const action = command === "start" ? "start" : "stop";
const result = runBrew(["services", action, formula]);

if (result.stdout.trim()) process.stdout.write(result.stdout);
if (result.stderr.trim()) process.stderr.write(result.stderr);

if (result.status !== 0) {
  process.exit(result.status);
}

console.log(`[db] MongoDB ${action} command completed for ${formula}.`);
