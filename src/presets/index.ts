import { Preset } from "../types.js";

export const presets: Preset[] = [
  {
    name: "Full-Stack React",
    description: "React + Hono + Drizzle + SQLite + Better Auth - Perfect for full-stack React applications",
    config: {
      yes: true,
      frontend: ["react"],
      backend: "hono",
      database: "sqlite",
      orm: "drizzle",
      auth: "better-auth",
      packageManager: "bun",
      install: true,
      git: true,
      disableAnalytics: true,
      renderTitle: false,
    },
  },
  {
    name: "Next.js Stack",
    description: "Next.js + Hono + Prisma + PostgreSQL + Clerk - Enterprise-ready Next.js applications",
    config: {
      yes: true,
      frontend: ["next"],
      backend: "hono",
      database: "postgres",
      orm: "prisma",
      auth: "clerk",
      packageManager: "bun",
      install: true,
      git: true,
      disableAnalytics: true,
      renderTitle: false,
    },
  },
  {
    name: "T3 Stack",
    description: "Next.js + tRPC + Prisma + NextAuth - The popular T3 stack configuration",
    config: {
      yes: true,
      frontend: ["next"],
      backend: "hono",
      database: "postgres",
      orm: "prisma",
      auth: "better-auth",
      packageManager: "bun",
      install: true,
      git: true,
      disableAnalytics: true,
      renderTitle: false,
    },
  },
  {
    name: "Minimal Stack",
    description: "TanStack Router + Hono + SQLite - Lightweight and fast, perfect for small projects",
    config: {
      yes: true,
      frontend: ["tanstack-router"],
      backend: "hono",
      database: "sqlite",
      orm: "drizzle",
      auth: "none",
      packageManager: "bun",
      install: true,
      git: true,
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

