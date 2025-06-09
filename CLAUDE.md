# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Prisma generator that creates database comments from Prisma schema documentation. It generates SQL `COMMENT ON` statements for PostgreSQL databases based on triple-slash comments (`///`) in the Prisma schema.

## Essential Commands

### Development
- `pnpm run build` - Build the project (removes dist/ and rebuilds)
- `pnpm run format` - Format code with Prettier
- `pnpm run lint` - Run ESLint on TypeScript files
- `pnpm run test` - Run all tests with Vitest
- `pnpm run test:cov` - Run tests with coverage report

### Code Formatting
Always run `pnpm run format` after editing code to ensure consistent formatting with Prettier.

### Database (for testing)
- `pnpm run db:migrate` - Run Prisma migrate dev, generate, and deploy
- `pnpm run db:reset` - Reset Prisma migrations
- `pnpm run db:deploy` - Deploy Prisma migrations

## Architecture

The codebase follows a clear separation of concerns with four main modules:

### Core Flow
1. **parser.ts** - Parses Prisma DMMF (Data Model Meta Format) into internal types
2. **comment.ts** - Creates comment structures and handles diff logic
3. **statement.ts** - Generates SQL `COMMENT ON` statements
4. **generator.ts** - Main generator that orchestrates the process and handles file I/O

### Key Components

**parser.ts** (`src/parser.ts`):
- Converts Prisma DMMF models, fields, and enums into simplified internal types
- Filters only scalar and enum fields (ignores relations)
- Maps Prisma names to database names using `@@map` directives

**comment.ts** (`src/comment.ts`):
- Creates comment structures for tables and columns based on targets
- Implements diffing logic to generate only changed comments
- Handles filtering via `ignorePattern` and `ignoreCommentPattern`
- Supports enum information injection into field comments

**statement.ts** (`src/statement.ts`):
- Generates PostgreSQL `COMMENT ON TABLE` and `COMMENT ON COLUMN` statements
- Handles comment escaping and multi-line comments with E-strings
- Supports schema-qualified table names

**generator.ts** (`src/generator.ts`):
- Entry point that implements Prisma's generator interface
- Manages state persistence via `comments-latest.json`
- Creates migration files with timestamped directories
- Orchestrates the entire generation process

### State Management
The generator maintains state between runs by storing the current comments in `prisma/migrations/comments-latest.json`. This enables differential generation - only creating migration files for changed comments.

### Configuration Options
- `targets` - Select "table", "column", or both for comment generation
- `ignorePattern` - Regex to exclude models by database name
- `ignoreCommentPattern` - Regex to exclude comments by content
- `includeEnumInFieldComment` - Add enum values to field comments

## Testing

Tests use Vitest and are organized as:
- Unit tests for each module (e.g., `comment.test.ts`)
- Integration tests for the generator (`generator.test.ts`)
- Snapshot testing for generated SQL output
- Test fixtures in `src/__fixtures__/` with various schema scenarios

When running tests, use `pnpm run test` for quick feedback or `pnpm run test:cov` for coverage analysis.