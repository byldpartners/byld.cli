import chalk from "chalk";

export function getAsciiLogo(): string {
  return chalk.hex("#0000FF")(`
 ███████████████████████████████████████████████████████████████████████████████████████████        
████████████████████████████████████████████████████████████████████████████████████████████████    
████                               █████████              ███████████                     ████████  
████                                 ██████               ███████████                         █████ 
████        ██████████                ███                 ███████████         ██████           █████
████        ██████████                                    ███████████       ███████████         ████
████                         ███                          ███████████       ████████████        ████
████                         █████            ████        ███████████       ████████████        ████
████        ███████████        ████         ██████        ███████████       ███████████         ████
████        ███████████        █████        ██████          ███████           █████            █████
████                           █████        ██████                                            █████ 
████                        ████████        ██████                                        ████████  
███████████████████████████████████████████████████████████████████████████████████████████████     
 ██████████████████████████████████████████████████████████████████████████████████████████         
`);
}

export function getBrandingMessage(): string {
  return chalk.gray(
    `\nBuild better. Build faster. Build with Byld.\n` +
    `Visit ${chalk.cyan("https://byld.dev")} to learn more.\n`
  );
}

export function getBrandingText(): string {
  return getAsciiLogo() + getBrandingMessage();
}

export function displayBranding(): void {
  console.log(getAsciiLogo());
  console.log(getBrandingMessage());
}

export function getSuccessMessage(message: string): string {
  return chalk.green(`✓ ${message}`);
}

export function getErrorMessage(message: string): string {
  return chalk.red(`✗ ${message}`);
}

export function getInfoMessage(message: string): string {
  return chalk.blue(`ℹ ${message}`);
}

export function getWarningMessage(message: string): string {
  return chalk.yellow(`⚠ ${message}`);
}

let exitMessageShown = false;

export function displayExitMessage(): void {
  if (exitMessageShown) {
    return;
  }
  exitMessageShown = true;
  console.log();
  console.log(chalk.gray("Thanks for using Byld CLI!"));
  console.log(chalk.gray(`Visit ${chalk.cyan("https://byld.dev")} to learn more.`));
  console.log();
}

