import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { logger } from "./logger.js";
import chalk from "chalk";

export interface CustomAdditions {
  githubActions?: string[];
  packages?: string[];
  installPackages?: boolean;
}

export async function applyCustomAdditions(
  projectDirectory: string,
  additions: CustomAdditions
): Promise<void> {
  if (!additions.githubActions && !additions.packages) {
    return;
  }

  logger.info("Applying custom additions...");

  if (additions.githubActions && additions.githubActions.length > 0) {
    await addGitHubActions(projectDirectory, additions.githubActions);
  }

  if (additions.packages && additions.packages.length > 0) {
    await addPackages(projectDirectory, additions.packages, additions.installPackages);
  }

  logger.success("Custom additions applied successfully!");
}

async function addGitHubActions(
  projectDirectory: string,
  actions: string[]
): Promise<void> {
  const workflowsDir = join(projectDirectory, ".github", "workflows");

  if (!existsSync(workflowsDir)) {
    mkdirSync(workflowsDir, { recursive: true });
  }

  for (const action of actions) {
    try {
      let sourcePath: string;

      if (action.startsWith("http://") || action.startsWith("https://")) {
        logger.warn(`URL-based GitHub Actions not yet implemented: ${action}`);
        continue;
      }

      if (existsSync(action)) {
        sourcePath = action;
      } else {
        logger.warn(`GitHub Action file not found: ${action}`);
        continue;
      }

      const fileName = action.split("/").pop() || "workflow.yml";
      const destPath = join(workflowsDir, fileName);

      copyFileSync(sourcePath, destPath);
      logger.success(`Added GitHub Action: ${fileName}`);
    } catch (error) {
      logger.error(`Failed to add GitHub Action ${action}: ${error}`);
    }
  }
}

async function addPackages(
  projectDirectory: string,
  packages: string[],
  install?: boolean
): Promise<void> {
  const packageJsonPath = join(projectDirectory, "package.json");

  if (!existsSync(packageJsonPath)) {
    logger.warn("package.json not found, skipping package additions");
    return;
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

    if (!packageJson.dependencies) {
      packageJson.dependencies = {};
    }

    for (const pkg of packages) {
      let name: string;
      let version: string = "latest";

      if (pkg.startsWith("@")) {
        const parts = pkg.split("@");
        if (parts.length === 3) {
          name = `@${parts[1]}`;
          version = parts[2] || "latest";
        } else {
          name = pkg;
        }
      } else {
        const parts = pkg.split("@");
        name = parts[0];
        version = parts[1] || "latest";
      }

      packageJson.dependencies[name] = version;
      logger.success(`Added package: ${chalk.cyan(name)}@${chalk.gray(version)}`);
    }

    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");

    if (install) {
      logger.info("Installing additional packages...");
      const packageManager = packageJson.packageManager?.split("@")[0] || "npm";
      execSync(`${packageManager} install`, {
        cwd: projectDirectory,
        stdio: "inherit",
      });
      logger.success("Packages installed successfully!");
    }
  } catch (error) {
    logger.error(`Failed to add packages: ${error}`);
  }
}

