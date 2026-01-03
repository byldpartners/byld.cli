export interface Preset {
  name: string;
  description: string;
  config: CreateInput;
}

export interface CreateInput {
  projectName?: string;
  template?: string;
  yes?: boolean;
  yolo?: boolean;
  verbose?: boolean;
  database?: "none" | "sqlite" | "postgres" | "mysql" | "mongodb";
  orm?: "none" | "drizzle" | "prisma" | "mongoose";
  auth?: "better-auth" | "clerk" | "none";
  payments?: "polar" | "none";
  frontend?: string[];
  addons?: string[];
  examples?: string[];
  git?: boolean;
  packageManager?: "npm" | "pnpm" | "bun";
  install?: boolean;
  dbSetup?: string;
  backend?: string;
  runtime?: string;
  api?: string;
  webDeploy?: string;
  serverDeploy?: string;
  directoryConflict?: "merge" | "overwrite" | "increment" | "error";
  renderTitle?: boolean;
  disableAnalytics?: boolean;
  manualDb?: boolean;
}

