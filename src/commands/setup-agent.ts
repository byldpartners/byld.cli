import inquirer from "inquirer";
import chalk from "chalk";
import { execSync } from "child_process";
import { mkdirSync, existsSync, rmSync, readdirSync, readFileSync, copyFileSync, statSync } from "fs";
import { join, basename } from "path";
import { displayExitMessage } from "../utils/branding.js";
import { logger } from "../utils/logger.js";

const REPO_URL = "https://github.com/affaan-m/everything-claude-code.git";
const REPO_NAME = "everything-claude-code";

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
  logger.info("Fetching latest rules, skills, and agents from everything-claude-code...");
  execSync(`git clone --depth 1 ${REPO_URL} "${tmpDir}"`, {
    stdio: "pipe",
  });
}

function formatDisplayName(dirName: string): string {
  return dirName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function discoverRuleCategories(tmpDir: string): { name: string; value: string }[] {
  const rulesDir = join(tmpDir, "rules");
  if (!existsSync(rulesDir)) return [];
  return readdirSync(rulesDir)
    .filter((entry) => {
      const full = join(rulesDir, entry);
      return statSync(full).isDirectory();
    })
    .map((dir) => ({ name: formatDisplayName(dir), value: dir }));
}

function discoverRuleFiles(tmpDir: string, category: string): { name: string; value: string }[] {
  const categoryDir = join(tmpDir, "rules", category);
  if (!existsSync(categoryDir)) return [];
  return readdirSync(categoryDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const displayName = formatDisplayName(f.replace(/\.md$/, ""));
      return { name: displayName, value: f };
    });
}

function parseSkillDescription(skillDir: string): string | null {
  const skillMd = join(skillDir, "SKILL.md");
  if (!existsSync(skillMd)) return null;
  const content = readFileSync(skillMd, "utf-8");
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;
  const descMatch = match[1].match(/description:\s*(.+)/);
  return descMatch ? descMatch[1].trim() : null;
}

function discoverSkills(tmpDir: string): { name: string; value: string }[] {
  const skillsDir = join(tmpDir, "skills");
  if (!existsSync(skillsDir)) return [];
  return readdirSync(skillsDir)
    .filter((entry) => {
      const full = join(skillsDir, entry);
      return statSync(full).isDirectory() && existsSync(join(full, "SKILL.md"));
    })
    .map((dir) => {
      const desc = parseSkillDescription(join(skillsDir, dir));
      const displayName = formatDisplayName(dir);
      return {
        name: desc ? `${displayName} - ${chalk.gray(desc)}` : displayName,
        value: dir,
      };
    });
}

function parseAgentDescription(agentFile: string): string | null {
  const content = readFileSync(agentFile, "utf-8");
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;
  const descMatch = match[1].match(/description:\s*(.+)/);
  return descMatch ? descMatch[1].trim() : null;
}

function discoverAgents(tmpDir: string): { name: string; value: string }[] {
  const agentsDir = join(tmpDir, "agents");
  if (!existsSync(agentsDir)) return [];
  return readdirSync(agentsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const desc = parseAgentDescription(join(agentsDir, f));
      const displayName = formatDisplayName(f.replace(/\.md$/, ""));
      return {
        name: desc ? `${displayName} - ${chalk.gray(desc)}` : displayName,
        value: f,
      };
    });
}

function copyDir(src: string, dest: string): void {
  execSync(`cp -r "${src}/." "${dest}/"`, { stdio: "pipe" });
}

export async function setupAgentCommand(targetDir?: string): Promise<void> {
  const projectDir = targetDir || process.cwd();

  // Check if we're in a project directory (skip when called with explicit targetDir)
  if (!targetDir && !existsSync(join(projectDir, "package.json")) && !existsSync(join(projectDir, ".git"))) {
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

  // Clone to temp directory first so we can discover what's available
  const tmpDir = join(projectDir, `.tmp-${REPO_NAME}-${Date.now()}`);
  try {
    cloneRepo(tmpDir);

    // --- Rules selection ---
    const ruleCategories = discoverRuleCategories(tmpDir);
    let selectedRuleFiles: { category: string; file: string }[] = [];

    if (ruleCategories.length > 0) {
      const { categories } = await safePrompt<{ categories: string[] }>([
        {
          type: "checkbox",
          name: "categories",
          message: "Select rule categories to browse:",
          choices: ruleCategories,
        },
      ]);

      // For each selected category, let user pick individual rule files
      for (const category of categories) {
        const ruleFiles = discoverRuleFiles(tmpDir, category);
        if (ruleFiles.length === 0) continue;

        const { files } = await safePrompt<{ files: string[] }>([
          {
            type: "checkbox",
            name: "files",
            message: `Select ${formatDisplayName(category)} rules to include:`,
            choices: ruleFiles,
            default: ruleFiles.map((f) => f.value), // all selected by default
          },
        ]);

        for (const file of files) {
          selectedRuleFiles.push({ category, file });
        }
      }
    }

    // --- Skills selection ---
    const availableSkills = discoverSkills(tmpDir);
    let selectedSkills: string[] = [];

    if (availableSkills.length > 0) {
      const { skills } = await safePrompt<{ skills: string[] }>([
        {
          type: "checkbox",
          name: "skills",
          message: `Select skills to install (${availableSkills.length} available):`,
          choices: availableSkills,
        },
      ]);
      selectedSkills = skills;
    }

    // --- Agents selection ---
    const availableAgents = discoverAgents(tmpDir);
    let selectedAgents: string[] = [];

    if (availableAgents.length > 0) {
      const { agents } = await safePrompt<{ agents: string[] }>([
        {
          type: "checkbox",
          name: "agents",
          message: `Select agents to install (${availableAgents.length} available):`,
          choices: availableAgents,
        },
      ]);
      selectedAgents = agents;
    }

    // --- Hooks ---
    const { includeHooks } = await safePrompt<{ includeHooks: boolean }>([
      {
        type: "confirm",
        name: "includeHooks",
        message: "Include hooks (session lifecycle, strategic compaction)?",
        default: false,
      },
    ]);

    // --- MCP configs ---
    const { includeMcp } = await safePrompt<{ includeMcp: boolean }>([
      {
        type: "confirm",
        name: "includeMcp",
        message: "Include MCP server configs?",
        default: false,
      },
    ]);

    // Summary
    console.log();
    logger.info("Setup summary:");
    if (selectedRuleFiles.length > 0) {
      logger.cyan(`  Rules:  ${selectedRuleFiles.length} file(s) from ${[...new Set(selectedRuleFiles.map((r) => r.category))].join(", ")}`);
    } else {
      logger.cyan("  Rules:  none");
    }
    if (selectedSkills.length > 0) {
      logger.cyan(`  Skills:  ${selectedSkills.join(", ")}`);
    } else {
      logger.cyan("  Skills:  none");
    }
    if (selectedAgents.length > 0) {
      logger.cyan(`  Agents:  ${selectedAgents.map((f) => f.replace(/\.md$/, "")).join(", ")}`);
    } else {
      logger.cyan("  Agents:  none");
    }
    logger.cyan(`  Hooks:   ${includeHooks ? "yes" : "no"}`);
    logger.cyan(`  MCP:     ${includeMcp ? "yes" : "no"}`);
    console.log();

    if (selectedRuleFiles.length === 0 && selectedSkills.length === 0 && selectedAgents.length === 0 && !includeHooks && !includeMcp) {
      logger.info("Nothing selected. Setup cancelled.");
      return;
    }

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

    // --- Install rules ---
    if (selectedRuleFiles.length > 0) {
      const rulesDir = join(projectDir, ".claude", "rules");
      mkdirSync(rulesDir, { recursive: true });

      for (const { category, file } of selectedRuleFiles) {
        const src = join(tmpDir, "rules", category, file);
        copyFileSync(src, join(rulesDir, file));
      }
      logger.success(`Added ${selectedRuleFiles.length} rule file(s)`);
    }

    // --- Install skills ---
    if (selectedSkills.length > 0) {
      const skillsDir = join(projectDir, ".claude", "skills");
      mkdirSync(skillsDir, { recursive: true });

      for (const skill of selectedSkills) {
        const src = join(tmpDir, "skills", skill);
        const dest = join(skillsDir, skill);
        mkdirSync(dest, { recursive: true });
        copyDir(src, dest);
      }
      logger.success(`Added ${selectedSkills.length} skill(s)`);
    }

    // --- Install agents ---
    if (selectedAgents.length > 0) {
      const agentsDir = join(projectDir, ".claude", "agents");
      mkdirSync(agentsDir, { recursive: true });

      for (const agent of selectedAgents) {
        const src = join(tmpDir, "agents", agent);
        copyFileSync(src, join(agentsDir, agent));
      }
      logger.success(`Added ${selectedAgents.length} agent(s)`);
    }

    // --- Install hooks ---
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

    // --- Install MCP configs ---
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
    if (selectedRuleFiles.length > 0) logger.info(`Rules installed to ${chalk.cyan(".claude/rules/")}`);
    if (selectedSkills.length > 0) logger.info(`Skills installed to ${chalk.cyan(".claude/skills/")}`);
    if (selectedAgents.length > 0) logger.info(`Agents installed to ${chalk.cyan(".claude/agents/")}`);
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
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  }
}
