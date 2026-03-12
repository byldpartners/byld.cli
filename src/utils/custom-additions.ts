import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync, readdirSync, chmodSync } from "fs";
import { join, dirname } from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { logger } from "./logger.js";
import chalk from "chalk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface CustomAdditions {
  githubActions?: string[];
  mobileActions?: boolean;
  packages?: string[];
  installPackages?: boolean;
}

export async function applyCustomAdditions(
  projectDirectory: string,
  additions: CustomAdditions
): Promise<void> {
  if (!additions.githubActions && !additions.mobileActions && !additions.packages) {
    return;
  }

  logger.info("Applying custom additions...");

  if (additions.mobileActions) {
    await addMobileActions(projectDirectory);
  }

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
      execSync(`pnpm install`, {
        cwd: projectDirectory,
        stdio: "inherit",
      });
      logger.success("Packages installed successfully!");
    }
  } catch (error) {
    logger.error(`Failed to add packages: ${error}`);
  }
}

async function addMobileActions(projectDirectory: string): Promise<void> {
  // Templates are in src/templates relative to the compiled dist/ output
  const templatesDir = join(__dirname, "..", "src", "templates", "mobile-actions");

  // Fallback: when running from source (dev mode)
  const fallbackDir = join(__dirname, "..", "templates", "mobile-actions");
  const sourceDir = existsSync(templatesDir) ? templatesDir : fallbackDir;

  if (!existsSync(sourceDir)) {
    logger.error("Mobile actions templates not found");
    return;
  }

  try {
    // Copy workflow files
    const workflowsDir = join(projectDirectory, ".github", "workflows");
    mkdirSync(workflowsDir, { recursive: true });

    const workflowFiles = readdirSync(sourceDir).filter((f) => f.endsWith(".yml"));
    for (const file of workflowFiles) {
      copyFileSync(join(sourceDir, file), join(workflowsDir, file));
      logger.success(`Added workflow: ${chalk.cyan(file)}`);
    }

    // Copy helper scripts
    const scriptsSource = join(sourceDir, "scripts");
    if (existsSync(scriptsSource)) {
      const scriptsDir = join(projectDirectory, ".github", "scripts");
      mkdirSync(scriptsDir, { recursive: true });

      const scriptFiles = readdirSync(scriptsSource);
      for (const file of scriptFiles) {
        const dest = join(scriptsDir, file);
        copyFileSync(join(scriptsSource, file), dest);
        if (file.endsWith(".sh")) {
          chmodSync(dest, 0o755);
        }
        logger.success(`Added script: ${chalk.cyan(file)}`);
      }
    }

    logger.info("Mobile actions require these GitHub secrets:");
    logger.cyan("  EXPO_TOKEN          - Expo access token");
    logger.cyan("  API_URL_DEV         - Development API URL");
    logger.cyan("  API_URL_STAGE       - Staging API URL");
    logger.cyan("  API_URL_PROD        - Production API URL");
    logger.gray("  Add any additional EXPO_PUBLIC_* vars to the environ JSON in each workflow");
  } catch (error) {
    logger.error(`Failed to add mobile actions: ${error}`);
  }
}

