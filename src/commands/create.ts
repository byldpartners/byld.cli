import inquirer from "inquirer";
import { presets, getPresetByName } from "../presets/index.js";
import { CreateInput } from "../types.js";
import { displayExitMessage } from "../utils/branding.js";
import { logger } from "../utils/logger.js";
import { applyCustomAdditions, CustomAdditions } from "../utils/custom-additions.js";
import { scaffoldUIPackage, UIPackageOptions, UIPlatform } from "../utils/ui-package.js";
import chalk from "chalk";

type CreateResult =
  | { ok: true; value: { projectDirectory: string; relativePath: string } }
  | { ok: false; error: string }
  | { success: true; projectDirectory: string; relativePath: string }
  | { success: false; error: string; projectDirectory: string; relativePath: string };

function getCreateResultData(result: CreateResult): {
  projectDirectory: string;
  relativePath: string;
  success: boolean;
  error?: string;
} {
  if ("ok" in result) {
    if (result.ok) return { ...result.value, success: true };
    return { projectDirectory: "", relativePath: "", success: false, error: result.error };
  }
  if (result.success)
    return {
      projectDirectory: result.projectDirectory,
      relativePath: result.relativePath,
      success: true,
    };
  return {
    projectDirectory: result.projectDirectory,
    relativePath: result.relativePath,
    success: false,
    error: result.error,
  };
}

async function safePrompt<T extends Record<string, any>>(prompt: any): Promise<T> {
  try {
    return await inquirer.prompt<T>(prompt) as T;
  } catch (error: any) {
    if (error.isTtyError || error.name === "ExitPromptError" || error.name === "CancelPromptError") {
      displayExitMessage();
      process.exit(0);
    }
    throw error;
  }
}

export async function createCommand(projectName?: string): Promise<void> {
  const { usePreset } = await safePrompt<{ usePreset: boolean }>([
    {
      type: "rawlist",
      name: "usePreset",
      message: "How would you like to set up your project?",
      choices: [
        { name: "Use a Byld preset", value: true },
        { name: "Custom stack (use better-t-stack directly)", value: false },
      ],
    },
  ]);

  let config: CreateInput;
  let customAdditions: CustomAdditions = {};

  if (usePreset) {
    const presetResult = await selectPreset();
    if (!presetResult) {
      logger.error("No preset selected");
      return;
    }
    config = { ...presetResult.config, projectName: projectName || presetResult.config.projectName };
  } else {
    config = await getCustomConfig(projectName);
  }

  const additionsResult = await promptCustomAdditions();
  if (additionsResult) {
    customAdditions = additionsResult;
  }

  logger.info("Creating your project...");

  try {
    const { create } = await import("create-better-t-stack");
    const raw = await create(config.projectName || "my-app", {
      ...config,
      disableAnalytics: true,
      renderTitle: false,
    });
    const result = getCreateResultData(raw as CreateResult);

    if (result.success) {
      logger.success(`Project created at: ${chalk.cyan(result.projectDirectory)}`);

      if (customAdditions.githubActions || customAdditions.packages) {
        await applyCustomAdditions(result.projectDirectory, customAdditions);
      }

      // Prompt for UI package
      const uiOptions = await promptUIPackage();
      if (uiOptions) {
        scaffoldUIPackage(result.projectDirectory, {
          ...uiOptions,
          packageManager: "pnpm",
          install: config.install ?? true,
        });
      }

      console.log();
      logger.info("Next steps:");
      logger.cyan(`  cd ${result.relativePath}`);
      if (!config.install) {
        logger.cyan(`  pnpm install`);
      }
      logger.cyan(`  pnpm run dev`);
      console.log();
    } else {
      logger.error(`Failed to create project: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    logger.error(`Error creating project: ${error}`);
    process.exit(1);
  }
}

async function selectPreset(): Promise<{ name: string; config: CreateInput } | null> {
  const choices = presets.map((preset: { name: string; description: string }) => ({
    name: `${preset.name} - ${preset.description}`,
    value: preset.name,
  }));

  const { presetName } = await safePrompt<{ presetName: string }>([
    {
      type: "rawlist",
      name: "presetName",
      message: "Select a preset:",
      choices,
    },
  ]);

  const preset = getPresetByName(presetName);
  return preset ? { name: preset.name, config: preset.config } : null;
}

async function getCustomConfig(projectName?: string): Promise<CreateInput> {
  interface CustomConfigAnswers {
    projectName: string;
    frontend: string[];
    backend: string;
    database: "none" | "sqlite" | "postgres" | "mysql" | "mongodb";
    orm?: "none" | "drizzle" | "prisma" | "mongoose";
    auth: "none" | "better-auth" | "clerk";
    install: boolean;
    git: boolean;
  }

  const answers = await safePrompt<CustomConfigAnswers>([
    {
      type: "input",
      name: "projectName",
      message: "Project name:",
      default: projectName || "my-app",
    },
    {
      type: "checkbox",
      name: "frontend",
      message: "Select frontend framework(s):",
      choices: [
        { name: "Next.js", value: "next" },
        { name: "React", value: "react" },
        { name: "TanStack Router", value: "tanstack-router" },
      ],
    },
    {
      type: "rawlist",
      name: "backend",
      message: "Select backend framework:",
      choices: [
        { name: "Hono", value: "hono" },
        { name: "None", value: "none" },
      ],
    },
    {
      type: "rawlist",
      name: "database",
      message: "Select database:",
      choices: [
        { name: "None", value: "none" },
        { name: "SQLite", value: "sqlite" },
        { name: "PostgreSQL", value: "postgres" },
        { name: "MySQL", value: "mysql" },
        { name: "MongoDB", value: "mongodb" },
      ],
    },
    {
      type: "rawlist",
      name: "orm",
      message: "Select ORM:",
      choices: [
        { name: "None", value: "none" },
        { name: "Drizzle", value: "drizzle" },
        { name: "Prisma", value: "prisma" },
        { name: "Mongoose", value: "mongoose" },
      ],
      when: (answers: Partial<CustomConfigAnswers>) => answers.database !== "none",
    },
    {
      type: "rawlist",
      name: "auth",
      message: "Select authentication:",
      choices: [
        { name: "None", value: "none" },
        { name: "Better Auth", value: "better-auth" },
        { name: "Clerk", value: "clerk" },
      ],
    },
    {
      type: "confirm",
      name: "install",
      message: "Install dependencies?",
      default: true,
    },
    {
      type: "confirm",
      name: "git",
      message: "Initialize git repository?",
      default: true,
    },
  ]);

  return {
    projectName: answers.projectName,
    frontend: answers.frontend,
    backend: answers.backend,
    database: answers.database,
    orm: answers.orm || "none",
    auth: answers.auth,
    packageManager: "pnpm",
    install: answers.install,
    git: answers.git,
    yes: true,
    disableAnalytics: true,
    renderTitle: false,
  };
}

async function promptCustomAdditions(): Promise<CustomAdditions | null> {
  const { wantCustom } = await safePrompt<{ wantCustom: boolean }>([
    {
      type: "confirm",
      name: "wantCustom",
      message: "Would you like to add custom GitHub Actions or packages?",
      default: false,
    },
  ]);

  if (!wantCustom) {
    return null;
  }

  const additions: CustomAdditions = {};

  const { addMobileActions } = await safePrompt<{ addMobileActions: boolean }>([
    {
      type: "confirm",
      name: "addMobileActions",
      message: "Add mobile CI/CD actions (EAS Build, OTA staging/production)?",
      default: false,
    },
  ]);
  additions.mobileActions = addMobileActions;

  const { addActions } = await safePrompt<{ addActions: boolean }>([
    {
      type: "confirm",
      name: "addActions",
      message: "Add custom GitHub Actions?",
      default: false,
    },
  ]);

  if (addActions) {
    const { actions } = await safePrompt<{ actions: string[] }>([
      {
        type: "input",
        name: "actions",
        message: "Enter GitHub Action file paths (comma-separated):",
        filter: (input: string) =>
          input.split(",").map((s) => s.trim()).filter(Boolean),
      },
    ]);
    additions.githubActions = actions;
  }

  const { addPackages } = await safePrompt<{ addPackages: boolean }>([
    {
      type: "confirm",
      name: "addPackages",
      message: "Add custom packages?",
      default: false,
    },
  ]);

  if (addPackages) {
    const { packages } = await safePrompt<{ packages: string[] }>([
      {
        type: "input",
        name: "packages",
        message: "Enter package names (comma-separated, e.g., lodash, axios@1.0.0):",
        filter: (input: string) =>
          input.split(",").map((s) => s.trim()).filter(Boolean),
      },
    ]);
    additions.packages = packages;

    const { installPackages } = await safePrompt<{ installPackages: boolean }>([
      {
        type: "confirm",
        name: "installPackages",
        message: "Install packages immediately?",
        default: true,
      },
    ]);
    additions.installPackages = installPackages;
  }

  return additions;
}

async function promptUIPackage(): Promise<{ platform: UIPlatform } | null> {
  const { addUI } = await safePrompt<{ addUI: boolean }>([
    {
      type: "confirm",
      name: "addUI",
      message: "Add a UI package (@byldpartners/ui) for building shared components?",
      default: false,
    },
  ]);

  if (!addUI) return null;

  const { platform } = await safePrompt<{ platform: UIPlatform }>([
    {
      type: "rawlist",
      name: "platform",
      message: "Which platforms will this UI package target?",
      choices: [
        { name: "Web only (React + Tailwind)", value: "web" },
        { name: "Native only (React Native + Expo)", value: "native" },
        { name: "Both web and native", value: "both" },
      ],
    },
  ]);

  return { platform };
}

