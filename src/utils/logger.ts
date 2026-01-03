import chalk from "chalk";
import {
  getSuccessMessage,
  getErrorMessage,
  getInfoMessage,
  getWarningMessage,
} from "./branding.js";

export const logger = {
  success: (message: string) => console.log(getSuccessMessage(message)),
  error: (message: string) => console.error(getErrorMessage(message)),
  info: (message: string) => console.log(getInfoMessage(message)),
  warn: (message: string) => console.warn(getWarningMessage(message)),
  log: (message: string) => console.log(message),
  cyan: (message: string) => console.log(chalk.cyan(message)),
  gray: (message: string) => console.log(chalk.gray(message)),
};

