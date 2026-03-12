import inquirer from "inquirer";
import chalk from "chalk";
import { execSync } from "child_process";
import { mkdirSync, writeFileSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { displayExitMessage } from "../utils/branding.js";
import { logger } from "../utils/logger.js";

const REPO_URL = "https://github.com/affaan-m/everything-claude-code.git";
const REPO_NAME = "everything-claude-code";

const LANGUAGE_STACKS = [
  { name: "TypeScript / JavaScript", value: "typescript" },
  { name: "Python", value: "python" },
  { name: "Go", value: "golang" },
  { name: "Swift", value: "swift" },
  { name: "Kotlin", value: "kotlin" },
  { name: "PHP", value: "php" },
  { name: "Perl", value: "perl" },
];

async function safePrompt<T extends Record<string, any>>(prompt: any): Promise<T> {
  try {
    return (await inquirer.prompt<T>(prompt)) as T;
  } catch (error: any) {
    if (
      error.isTtyError ||
      error.name === "ExitPromptError" ||
      error.name === "CancelPromptError"
    ) {
      displayExitMessage();
      process.exit(0);
    }
    throw error;
  }
}

function cloneRepo(tmpDir: string): void {
  logger.info("Fetching latest rules from everything-claude-code...");
  execSync(`git clone --depth 1 ${REPO_URL} "${tmpDir}"`, {
    stdio: "pipe",
  });
}

function copyDir(src: string, dest: string): void {
  execSync(`cp -r "${src}/." "${dest}/"`, { stdio: "pipe" });
}

export async function setupAgentCommand(): Promise<void> {
  const projectDir = process.cwd();

  // Check if we're in a project directory
  if (!existsSync(join(projectDir, "package.json")) && !existsSync(join(projectDir, ".git"))) {
    logger.warn("No package.json or .git found. Are you in a project directory?");
    const { proceed } = await safePrompt<{ proceed: boolean }>([
      {
        type: "confirm",
        name: "proceed",
        message: "Continue anyway?",
        default: false,
      },
    ]);
    if (!proceed) return;
  }

  // Select language stacks
  const { stacks } = await safePrompt<{ stacks: string[] }>([
    {
      type: "checkbox",
      name: "stacks",
      message: "Select language stacks to include (common rules are always added):",
      choices: LANGUAGE_STACKS,
    },
  ]);

  // Ask about hooks
  const { includeHooks } = await safePrompt<{ includeHooks: boolean }>([
    {
      type: "confirm",
      name: "includeHooks",
      message: "Include hooks (session lifecycle, strategic compaction)?",
      default: false,
    },
  ]);

  // Ask about MCP configs
  const { includeMcp } = await safePrompt<{ includeMcp: boolean }>([
    {
      type: "confirm",
      name: "includeMcp",
      message: "Include MCP server configs (GitHub, Supabase, Vercel, Railway)?",
      default: false,
    },
  ]);

  // Summary
  console.log();
  logger.info("Setup summary:");
  logger.cyan("  Rules:  common" + (stacks.length > 0 ? `, ${stacks.join(", ")}` : ""));
  logger.cyan(`  Hooks:  ${includeHooks ? "yes" : "no"}`);
  logger.cyan(`  MCP:    ${includeMcp ? "yes" : "no"}`);
  console.log();

  const { confirm } = await safePrompt<{ confirm: boolean }>([
    {
      type: "confirm",
      name: "confirm",
      message: "Proceed with setup?",
      default: true,
    },
  ]);

  if (!confirm) {
    logger.info("Setup cancelled.");
    return;
  }

  // Clone to temp directory
  const tmpDir = join(projectDir, `.tmp-${REPO_NAME}-${Date.now()}`);
  try {
    cloneRepo(tmpDir);

    // Always copy common rules
    const rulesDir = join(projectDir, ".claude", "rules");
    mkdirSync(rulesDir, { recursive: true });

    const commonSrc = join(tmpDir, "rules", "common");
    if (existsSync(commonSrc)) {
      copyDir(commonSrc, rulesDir);
      logger.success("Added common rules");
    } else {
      logger.warn("Common rules not found in repo");
    }

    // Copy selected language stacks
    for (const stack of stacks) {
      const stackSrc = join(tmpDir, "rules", stack);
      if (existsSync(stackSrc)) {
        copyDir(stackSrc, rulesDir);
        logger.success(`Added ${stack} rules`);
      } else {
        logger.warn(`${stack} rules not found in repo (may have been renamed)`);
      }
    }

    // Copy hooks
    if (includeHooks) {
      const hooksSrc = join(tmpDir, "hooks");
      if (existsSync(hooksSrc)) {
        const hooksDest = join(projectDir, ".claude", "hooks");
        mkdirSync(hooksDest, { recursive: true });
        copyDir(hooksSrc, hooksDest);
        logger.success("Added hooks");
      } else {
        logger.warn("Hooks not found in repo");
      }
    }

    // Copy MCP configs
    if (includeMcp) {
      const mcpSrc = join(tmpDir, "mcp-configs");
      if (existsSync(mcpSrc)) {
        const mcpDest = join(projectDir, ".claude", "mcp-configs");
        mkdirSync(mcpDest, { recursive: true });
        copyDir(mcpSrc, mcpDest);
        logger.success("Added MCP configs");
      } else {
        logger.warn("MCP configs not found in repo");
      }
    }

    console.log();
    logger.success("Agent harness setup complete!");
    logger.info(`Rules installed to ${chalk.cyan(".claude/rules/")}`);
    if (includeHooks) logger.info(`Hooks installed to ${chalk.cyan(".claude/hooks/")}`);
    if (includeMcp) logger.info(`MCP configs installed to ${chalk.cyan(".claude/mcp-configs/")}`);
    console.log();
    logger.gray("Tip: commit the .claude/ directory so your team shares the same agent config.");
  } catch (error: any) {
    if (error.message?.includes("git")) {
      logger.error("Failed to fetch repo. Make sure git is installed and you have internet access.");
    } else {
      logger.error(`Setup failed: ${error.message || error}`);
    }
    process.exit(1);
  } finally {
    // Clean up temp directory
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  }
}
