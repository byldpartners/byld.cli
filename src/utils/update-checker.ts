import latestVersion from "latest-version";
import semver from "semver";
import { readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { existsSync, writeFileSync, readFileSync as readFile } from "fs";
import { logger } from "./logger.js";
import chalk from "chalk";

interface UpdateCache {
  lastChecked: number;
  latestVersion: string;
}

const CACHE_FILE = join(homedir(), ".byld-cli-update-cache.json");
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const PACKAGE_NAME = "@byldpartners/cli";

function getCurrentVersion(): string {
  try {
    const packagePath = join(__dirname, "../package.json");
    const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));
    return packageJson.version;
  } catch {
    return "0.0.0";
  }
}

function getCachedVersion(): UpdateCache | null {
  try {
    if (existsSync(CACHE_FILE)) {
      const cache = JSON.parse(readFile(CACHE_FILE, "utf-8")) as UpdateCache;
      const now = Date.now();
      if (now - cache.lastChecked < CACHE_DURATION) {
        return cache;
      }
    }
  } catch {
    // Ignore cache errors
  }
  return null;
}

function setCachedVersion(version: string): void {
  try {
    const cache: UpdateCache = {
      lastChecked: Date.now(),
      latestVersion: version,
    };
    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch {
    // Ignore cache write errors
  }
}

async function fetchLatestVersion(): Promise<string | null> {
  try {
    const version = await latestVersion(PACKAGE_NAME);
    return version;
  } catch {
    return null;
  }
}

export async function checkForUpdates(): Promise<void> {
  const cached = getCachedVersion();
  const currentVersion = getCurrentVersion();

  let latest: string | null = null;

  if (cached) {
    latest = cached.latestVersion;
  } else {
    latest = await fetchLatestVersion();
    if (latest) {
      setCachedVersion(latest);
    }
  }

  if (!latest) {
    return;
  }

  if (semver.gt(latest, currentVersion)) {
    console.log();
    logger.warn(
      `Update available: ${chalk.cyan(PACKAGE_NAME)}@${chalk.cyan(latest)} (you have ${chalk.gray(currentVersion)})`
    );
    logger.info(
      `Run: ${chalk.cyan(`npm install -g ${PACKAGE_NAME}@latest`)}`
    );
    console.log();
  }
}

