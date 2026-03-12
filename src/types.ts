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
  database?: string;
  orm?: string;
  auth?: string;
  payments?: string;
  frontend?: string[];
  addons?: string[];
  examples?: string[];
  git?: boolean;
  packageManager?: string;
  install?: boolean;
  dbSetup?: string;
  backend?: string;
  runtime?: string;
  api?: string;
  webDeploy?: string;
  serverDeploy?: string;
  directoryConflict?: string;
  renderTitle?: boolean;
  disableAnalytics?: boolean;
  manualDb?: boolean;
}
