<div align="center">
  <img src="assets/images/byld-header.png" alt="Byld" width="100%">
</div>

# Byld CLI

**Build better. Build faster. Build with Byld.**

Visit [https://byld.dev](https://byld.dev) to learn more about our software agency.

## Installation

Install the Byld CLI globally using npm:

```bash
npm install -g @byld/cli
```

Or using pnpm:

```bash
pnpm add -g @byld/cli
```

Or using bun:

```bash
bun add -g @byld/cli
```

## Usage

### Create a New Project

The main command is `create` (or `c` for short):

```bash
byld create my-project
```

Or without specifying a project name (you'll be prompted):

```bash
byld create
```

### Project Setup Options

When you run `byld create`, you'll be presented with two options:

1. **Use a Byld preset** - Choose from our curated preset configurations
2. **Custom stack** - Build your own stack using better-t-stack's interactive prompts

### Byld Presets

We offer several preset configurations optimized for different use cases:

#### Full-Stack React
- **Stack**: React + Hono + Drizzle + SQLite + Better Auth
- **Best for**: Full-stack React applications
- **Description**: Perfect for building modern React applications with a robust backend

#### Next.js Stack
- **Stack**: Next.js + Hono + Prisma + PostgreSQL + Clerk
- **Best for**: Enterprise-ready Next.js applications
- **Description**: Production-ready stack with enterprise-grade authentication

#### T3 Stack
- **Stack**: Next.js + tRPC + Prisma + NextAuth
- **Best for**: Type-safe full-stack applications
- **Description**: The popular T3 stack configuration with end-to-end type safety

#### Minimal Stack
- **Stack**: TanStack Router + Hono + SQLite
- **Best for**: Small projects and prototypes
- **Description**: Lightweight and fast, perfect for small projects

### Custom Additions

After selecting your stack, you can optionally add:

- **Custom GitHub Actions**: Add your own workflow files to `.github/workflows/`
- **Additional npm packages**: Add extra dependencies to your project

The CLI will prompt you interactively for these additions.

### Example Workflow

```bash
# Install the CLI
npm install -g @byld/cli

# Create a new project
byld create my-awesome-app

# Follow the interactive prompts:
# 1. Choose "Use a Byld preset" or "Custom stack"
# 2. If preset, select from available presets
# 3. Optionally add custom GitHub Actions or packages
# 4. Wait for project creation to complete

# Navigate to your project
cd my-awesome-app

# Start development
npm run dev
```

## Commands

### `byld create [project-name]`

Create a new project with the specified name (or be prompted for it).

**Aliases**: `byld c`

**Options**: None (all configuration is done interactively)

### `byld help`

Display help information and branding.

### `byld --version`

Display the current version of the CLI.

## Update Notifications

The CLI automatically checks for updates when you run commands. If a newer version is available, you'll see a notification like:

```
⚠  Update available: @byld/cli@1.2.0 (you have 1.1.0)
Run: npm install -g @byld/cli@latest
```

Update checks are cached for 24 hours to avoid rate limiting.

## Custom Additions Guide

### Adding Custom GitHub Actions

When prompted, you can provide file paths to GitHub Actions workflow files. These will be copied to your project's `.github/workflows/` directory.

**Example:**
```
Enter GitHub Action file paths (comma-separated): ./my-workflow.yml, ./another-workflow.yml
```

### Adding Custom npm Packages

You can add additional npm packages during project creation. Specify packages with optional versions:

**Examples:**
```
Enter package names (comma-separated): lodash, axios@1.0.0, @types/node
```

The CLI will:
1. Add packages to `package.json`
2. Optionally install them immediately (if you choose to)

## What's Under the Hood?

Byld CLI is a branded wrapper around [create-better-t-stack](https://www.better-t-stack.dev), providing:

- Curated preset configurations
- Byld branding and marketing
- Custom additions support
- Automatic update notifications
- Seamless integration with better-t-stack

## Contributing

We welcome contributions! Please feel free to submit issues or pull requests.

## License

MIT

## Support

For support, visit [https://byld.dev](https://byld.dev) or open an issue on GitHub.

---

**Built with ❤️ by [Byld](https://byld.dev)**

