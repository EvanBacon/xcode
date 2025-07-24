# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is `@bacons/xcode`, a TypeScript package that provides a spec-compliant parser for Xcode's `.pbxproj` files (project files). It's designed as a faster, more accurate alternative to the legacy `xcode` npm package, using Chevrotain parser instead of PEG.js.

The package offers two main APIs:
1. **Low-level JSON API** (`src/json/`) - Direct parsing and building of pbxproj files
2. **High-level Object API** (`src/api/`) - Mutable graph-based API for easier manipulation

## Development Commands

- **Build**: `yarn build` (compiles TypeScript to `build/` directory)
- **Test**: `yarn test` (runs Jest tests)
- **Clean**: `yarn clean` (removes build directory)
- **Test single file**: `yarn test <filename>` (e.g., `yarn test PBXProject.test.ts`)
- **Watch tests**: `yarn test --watch`

## Architecture

### Core Components

**JSON Layer** (`src/json/`):
- `parser/` - Chevrotain-based parser for pbxproj format (old-style plist)
- `writer.ts` - Serializes JSON back to pbxproj format
- `types.ts` - TypeScript definitions for all pbxproj object types
- `unicode/` - Handles string parsing using port of CFOldStylePlist parser
- `visitor/JsonVisitor.ts` - Converts CST to JSON representation

**API Layer** (`src/api/`):
- `XcodeProject.ts` - Main entry point, manages the object graph
- Individual object classes (PBXProject, PBXNativeTarget, PBXFileReference, etc.)
- `AbstractObject.ts` - Base class for all pbxproj objects
- `utils/` - Shared utilities including build settings resolution

### Key Patterns

1. **Lazy Loading**: Objects are inflated on-demand to avoid loading entire project graphs
2. **UUID Management**: Deterministic UUID generation based on content hashing
3. **Reference Resolution**: Objects maintain references to each other via UUIDs
4. **Type Safety**: Full TypeScript coverage with strict compiler options

### Entry Points

- `src/index.ts` - Exports the high-level API
- `json.js` / `json.d.ts` - Low-level JSON API entry point
- Main exports: `XcodeProject.open()`, `parse()`, `build()`

## Testing

Tests are located in `__tests__/` directories throughout the codebase:
- `src/api/__tests__/` - API layer tests with real project fixtures
- `src/json/__tests__/` - JSON parser tests with various pbxproj formats
- Fixtures in `src/json/__tests__/fixtures/` contain real-world project files

The test suite uses Jest with TypeScript support and includes extensive fixtures from various Xcode project types (React Native, Swift, CocoaPods, etc.).