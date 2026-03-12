import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { logger } from "./logger.js";
import chalk from "chalk";

export type UIPlatform = "web" | "native" | "both";

export interface UIPackageOptions {
  platform: UIPlatform;
  packageManager: string;
  install: boolean;
}

export function scaffoldUIPackage(
  projectDirectory: string,
  options: UIPackageOptions
): void {
  const uiDir = join(projectDirectory, "packages", "ui");
  const alreadyExists = existsSync(uiDir);

  mkdirSync(join(uiDir, "src", "components"), { recursive: true });

  // package.json
  const pkg: Record<string, any> = {
    name: "@app/ui",
    version: "0.0.1",
    private: true,
    type: "module",
    main: "./src/index.ts",
    types: "./src/index.ts",
    exports: buildExports(options.platform),
    scripts: {
      "type-check": "tsc --noEmit",
    },
    dependencies: {
      "@byldpartners/ui": "latest",
    },
    peerDependencies: buildPeerDeps(options.platform),
  };

  if (options.platform === "native" || options.platform === "both") {
    pkg["react-native"] = "./src/index.native.ts";
  }

  writeFileSync(join(uiDir, "package.json"), JSON.stringify(pkg, null, 2) + "\n");

  // tsconfig.json
  writeFileSync(
    join(uiDir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          lib: ["ES2022", ...(options.platform !== "native" ? ["DOM", "DOM.Iterable"] : [])],
          jsx: "react-jsx",
          strict: true,
          skipLibCheck: true,
          esModuleInterop: true,
          isolatedModules: true,
          declaration: true,
          outDir: "./dist",
          rootDir: "./src",
        },
        include: ["src/**/*"],
        exclude: ["node_modules", "dist"],
      },
      null,
      2
    ) + "\n"
  );

  // Web entry
  if (options.platform === "web" || options.platform === "both") {
    writeFileSync(
      join(uiDir, "src", "index.ts"),
      `// Re-export everything from @byldpartners/ui
export * from "@byldpartners/ui";

// Export local components
export * from "./components/index.js";
`
    );
  }

  // Native entry
  if (options.platform === "native" || options.platform === "both") {
    writeFileSync(
      join(uiDir, "src", "index.native.ts"),
      `// Re-export everything from @byldpartners/ui
export * from "@byldpartners/ui";

// Export local components
export * from "./components/index.native.js";
`
    );
  }

  // If web-only, still need the main index
  if (options.platform === "web") {
    // Already created above
  }

  // If native-only, create index.ts pointing to native
  if (options.platform === "native") {
    writeFileSync(
      join(uiDir, "src", "index.ts"),
      `export * from "./index.native.js";
`
    );
  }

  // Component barrel exports
  writeFileSync(
    join(uiDir, "src", "components", "index.ts"),
    `// Add your custom web component exports here
// Example: export { MyComponent } from "./MyComponent/index.js";
`
  );

  if (options.platform === "native" || options.platform === "both") {
    writeFileSync(
      join(uiDir, "src", "components", "index.native.ts"),
      `// Add your custom native component exports here
// Example: export { MyComponent } from "./MyComponent/index.native.js";
`
    );
  }

  // Scaffold an example component
  scaffoldExampleComponent(uiDir, options.platform);

  logger.success(alreadyExists ? "Configured packages/ui with @byldpartners/ui" : "Created packages/ui with @byldpartners/ui");

  // Run the @byldpartners/ui init CLI for platform setup
  runUIInit(uiDir, options);

  // Install dependencies
  if (options.install) {
    try {
      logger.info("Installing UI package dependencies...");
      execSync(`${options.packageManager} install`, {
        cwd: projectDirectory,
        stdio: "pipe",
      });
      logger.success("UI package dependencies installed");
    } catch {
      logger.warn("Failed to install dependencies. Run install manually.");
    }
  }
}

function scaffoldExampleComponent(uiDir: string, platform: UIPlatform): void {
  const compDir = join(uiDir, "src", "components", "AppHeader");
  mkdirSync(compDir, { recursive: true });

  // Shared types
  writeFileSync(
    join(compDir, "AppHeader.types.ts"),
    `export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}
`
  );

  // Web implementation
  if (platform === "web" || platform === "both") {
    writeFileSync(
      join(compDir, "AppHeader.web.tsx"),
      `import { cn } from "@byldpartners/ui/src/utils/cn";
import type { AppHeaderProps } from "./AppHeader.types.js";

export function AppHeader({ title, subtitle, className }: AppHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-1 px-6 py-4", className)}>
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      {subtitle && (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      )}
    </header>
  );
}
`
    );

    writeFileSync(
      join(compDir, "index.ts"),
      `export { AppHeader } from "./AppHeader.web.js";
export type { AppHeaderProps } from "./AppHeader.types.js";
`
    );
  }

  // Native implementation
  if (platform === "native" || platform === "both") {
    writeFileSync(
      join(compDir, "AppHeader.native.tsx"),
      `import { View, Text } from "react-native";
import type { AppHeaderProps } from "./AppHeader.types.js";

export function AppHeader({ title, subtitle, className }: AppHeaderProps) {
  return (
    <View className={\`flex flex-col gap-1 px-6 py-4 \${className ?? ""}\`}>
      <Text className="text-2xl font-bold text-foreground">{title}</Text>
      {subtitle && (
        <Text className="text-sm text-muted-foreground">{subtitle}</Text>
      )}
    </View>
  );
}
`
    );

    writeFileSync(
      join(compDir, "index.native.ts"),
      `export { AppHeader } from "./AppHeader.native.js";
export type { AppHeaderProps } from "./AppHeader.types.js";
`
    );
  }

  // If native-only, create index.ts pointing to native
  if (platform === "native") {
    writeFileSync(
      join(compDir, "index.ts"),
      `export { AppHeader } from "./AppHeader.native.js";
export type { AppHeaderProps } from "./AppHeader.types.js";
`
    );
  }

  // Update barrel exports
  const webBarrel = join(uiDir, "src", "components", "index.ts");
  writeFileSync(
    webBarrel,
    `export { AppHeader } from "./AppHeader/index.js";
export type { AppHeaderProps } from "./AppHeader/AppHeader.types.js";
`
  );

  if (platform === "native" || platform === "both") {
    const nativeBarrel = join(uiDir, "src", "components", "index.native.ts");
    writeFileSync(
      nativeBarrel,
      `export { AppHeader } from "./AppHeader/index.native.js";
export type { AppHeaderProps } from "./AppHeader/AppHeader.types.js";
`
    );
  }
}

function runUIInit(uiDir: string, options: UIPackageOptions): void {
  const platforms: string[] =
    options.platform === "both" ? ["web", "native"] : [options.platform];

  for (const p of platforms) {
    try {
      logger.info(`Running @byldpartners/ui init for ${p}...`);
      execSync(`npx @byldpartners/ui init --platform ${p}`, {
        cwd: uiDir,
        stdio: "pipe",
      });
      logger.success(`@byldpartners/ui ${p} init complete`);
    } catch {
      logger.warn(
        `@byldpartners/ui init for ${p} skipped (run manually: npx @byldpartners/ui init --platform ${p})`
      );
    }
  }
}

function buildExports(platform: UIPlatform): Record<string, any> {
  const exports: Record<string, any> = {};

  if (platform === "web") {
    exports["."] = {
      types: "./src/index.ts",
      import: "./src/index.ts",
    };
  } else if (platform === "native") {
    exports["."] = {
      "react-native": "./src/index.native.ts",
      types: "./src/index.ts",
      import: "./src/index.ts",
    };
  } else {
    exports["."] = {
      "react-native": "./src/index.native.ts",
      types: "./src/index.ts",
      import: "./src/index.ts",
    };
  }

  return exports;
}

function buildPeerDeps(platform: UIPlatform): Record<string, string> {
  const deps: Record<string, string> = {
    react: ">=18",
  };

  if (platform === "web" || platform === "both") {
    deps["react-dom"] = ">=18";
    deps["tailwindcss"] = ">=4.0";
  }

  if (platform === "native" || platform === "both") {
    deps["react-native"] = ">=0.81";
    deps["uniwind"] = ">=1.0";
  }

  return deps;
}
