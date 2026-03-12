import { Preset } from "../types.js";

export const presets: Preset[] = [
  {
    name: "Full-Stack React",
    description: "React + Hono + Drizzle + SQLite + Better Auth - Perfect for full-stack React applications",
    config: {

      frontend: ["tanstack-router"],
      backend: "hono",
      database: "sqlite",
      orm: "drizzle",
      auth: "better-auth",
      packageManager: "pnpm",
      install: true,
      git: false,
      disableAnalytics: true,
      renderTitle: false,
    },
  },
  {
    name: "Next.js Stack",
    description: "Next.js + Hono + Prisma + PostgreSQL + Clerk - Enterprise-ready Next.js applications",
    config: {

      frontend: ["next"],
      backend: "hono",
      database: "postgres",
      orm: "prisma",
      auth: "clerk",
      packageManager: "pnpm",
      install: true,
      git: false,
      disableAnalytics: true,
      renderTitle: false,
    },
  },
  {
    name: "T3 Stack",
    description: "Next.js + tRPC + Prisma + NextAuth - The popular T3 stack configuration",
    config: {

      frontend: ["next"],
      backend: "hono",
      database: "postgres",
      orm: "prisma",
      auth: "better-auth",
      packageManager: "pnpm",
      install: true,
      git: false,
      disableAnalytics: true,
      renderTitle: false,
    },
  },
  {
    name: "Minimal Stack",
    description: "TanStack Router + Hono + SQLite - Lightweight and fast, perfect for small projects",
    config: {

      frontend: ["tanstack-router"],
      backend: "hono",
      database: "sqlite",
      orm: "drizzle",
      auth: "none",
      packageManager: "pnpm",
      install: true,
      git: false,
      disableAnalytics: true,
      renderTitle: false,
    },
  },
];

export function getPresetByName(name: string): Preset | undefined {
  return presets.find((p) => p.name === name);
}

export function getPresetNames(): string[] {
  return presets.map((p) => p.name);
}

