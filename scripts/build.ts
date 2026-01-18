#!/usr/bin/env bun

import { join } from "node:path";
import { spawn } from "bun";

const PACKAGES = [
  "packages/frame",
  "packages/frame-angular",
  "packages/frame-react",
  "packages/frame-vue",
];

const APPS = ["apps/shell-angular", "apps/app-angular", "apps/app-react", "apps/app-vue"];

interface BuildOptions {
  watch: boolean;
  packagesOnly: boolean;
  appsOnly: boolean;
}

function parseArgs(): BuildOptions {
  const args = process.argv.slice(2);
  return {
    watch: args.includes("--watch"),
    packagesOnly: args.includes("--packages-only"),
    appsOnly: args.includes("--apps-only"),
  };
}

async function runCommand(
  cwd: string,
  command: string,
  args: string[],
  label: string,
  isWatch: boolean,
): Promise<void> {
  const fullPath = join(process.cwd(), cwd);

  console.log(`[${label}] Starting ${isWatch ? "watch mode" : "build"}...`);

  const proc = spawn([command, ...args], {
    cwd: fullPath,
    stdout: "pipe",
    stderr: "pipe",
  });

  // Stream output with label
  const decoder = new TextDecoder();

  if (proc.stdout) {
    for await (const chunk of proc.stdout) {
      const text = decoder.decode(chunk).trim();
      if (text) {
        console.log(`[${label}] ${text}`);
      }
    }
  }

  if (proc.stderr) {
    for await (const chunk of proc.stderr) {
      const text = decoder.decode(chunk).trim();
      if (text) {
        console.error(`[${label}] ${text}`);
      }
    }
  }

  const exitCode = await proc.exited;

  if (exitCode !== 0 && !isWatch) {
    throw new Error(`[${label}] Build failed with exit code ${exitCode}`);
  }
}

async function buildPackages(watch: boolean): Promise<void> {
  console.log(`\n🔨 ${watch ? "Watch mode" : "Building"} packages...\n`);

  const promises = PACKAGES.map((pkg) => {
    const name = pkg.split("/")[1];
    const command = watch ? "dev" : "build";

    return runCommand(pkg, "bun", ["run", command], name, watch);
  });

  if (watch) {
    // In watch mode, keep all processes running
    await Promise.race(promises);
  } else {
    // In build mode, wait for all to complete
    await Promise.all(promises);
    console.log("\n✅ All packages built successfully!\n");
  }
}

async function buildApps(watch: boolean): Promise<void> {
  console.log(`\n🚀 ${watch ? "Starting" : "Building"} apps...\n`);

  const promises = APPS.map((app) => {
    const name = app.split("/")[1];
    const command = watch ? "dev" : "build";

    return runCommand(app, "bun", ["run", command], name, watch);
  });

  if (watch) {
    // In watch mode, keep all processes running
    await Promise.race(promises);
  } else {
    // In build mode, wait for all to complete
    await Promise.all(promises);
    console.log("\n✅ All apps built successfully!\n");
  }
}

async function main() {
  const options = parseArgs();

  try {
    if (options.appsOnly) {
      await buildApps(options.watch);
    } else if (options.packagesOnly) {
      await buildPackages(options.watch);
    } else if (!options.watch) {
      // Build packages first (sequential)
      await buildPackages(false);
      await buildApps(false);
    } else {
      // In watch mode, run both in parallel
      await Promise.race([buildPackages(true), buildApps(true)]);
    }
  } catch (error) {
    console.error("\n❌ Build failed:", error);
    process.exit(1);
  }
}

main();
