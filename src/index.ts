#!/usr/bin/env node

import { Command } from "commander";
import { createCommand } from "./commands/create.js";
import { checkForUpdates } from "./utils/update-checker.js";
import { displayBranding, displayExitMessage, getBrandingText } from "./utils/branding.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJson = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf-8")
);

function setupExitHandlers(): void {
  const gracefulExit = () => {
    displayExitMessage();
    process.exit(0);
  };

  process.on("SIGINT", gracefulExit);
  process.on("SIGTERM", gracefulExit);
  
  process.on("exit", () => {});
}

setupExitHandlers();

const program = new Command();

program
  .name("byld")
  .description("Byld CLI - Build better. Build faster. Build with Byld.")
  .version(packageJson.version)
  .configureHelp({
    helpWidth: 120,
  })
  .addHelpText("beforeAll", () => {
    return getBrandingText() + "\n";
  });

program
  .command("create")
  .alias("c")
  .description("Create a new project")
  .argument("[project-name]", "Name of the project")
  .action(async (projectName?: string) => {
    displayBranding();
    await checkForUpdates();
    await createCommand(projectName);
  });

program
  .command("help")
  .description("Display help information")
  .action(() => {
    program.outputHelp();
  });

program.parse(process.argv);

if (process.argv.length === 2) {
  program.outputHelp();
}

