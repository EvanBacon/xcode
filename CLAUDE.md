# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is `@bacons/xcode`, a TypeScript package that provides a spec-compliant parser for Xcode's `.pbxproj` files (project files). It's designed as a faster, more accurate alternative to the legacy `xcode` npm package, using Chevrotain parser instead of PEG.js.

The package offers two main APIs:
1. **Low-level JSON API** (`src/json/`) - Direct parsing and building of pbxproj files
2. **High-level Object API** (`src/api/`) - Mutable graph-based API for easier manipulation

## Development Commands

- **Build**: `bun build` (compiles TypeScript to `build/` directory)
- **Test**: `bun test` (runs Jest tests)
- **Clean**: `bun clean` (removes build directory)
- **Test single file**: `bun test <filename>` (e.g., `bun test PBXProject.test.ts`)
- **Watch tests**: `bun test --watch`

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

### The `getObjectProps()` Pattern

Each object class defines `getObjectProps()` to declare which properties contain UUID references:

```typescript
protected getObjectProps() {
  return {
    buildConfigurationList: String,  // Single object reference
    dependencies: [String],          // Array of object references
    buildPhases: [String],
  };
}
```

This powers several automatic behaviors in `AbstractObject`:
- **Inflation**: UUIDs are automatically resolved to object instances
- **Serialization**: Objects are deflated back to UUIDs in `toJSON()`
- **Reference tracking**: `isReferencing(uuid)` and `removeReference(uuid)` work automatically

When adding new object types or properties, define them in `getObjectProps()` to get this behavior for free. Only override `isReferencing`/`removeReference` if you need custom logic (e.g., `PBXProject` removes from `TargetAttributes`).

### Implementing `removeFromProject()`

When implementing cascade deletion (removing an object and its children):

1. **Check exclusive ownership**: Before removing a child, verify no other object uses it
2. **Beware of display groups**: Objects like `productReference` or `fileSystemSynchronizedGroups` may be in a PBXGroup for display but still belong to one target
3. **For target-owned objects**: Check if any OTHER target references the object, not just if it has any referrers

```typescript
// Good: Check if another target uses this product reference
const usedByOtherTarget = [...project.values()].some(
  (obj) => PBXNativeTarget.is(obj) && obj.uuid !== this.uuid &&
    obj.props.productReference?.uuid === this.props.productReference?.uuid
);
if (!usedByOtherTarget) {
  this.props.productReference.removeFromProject();
}
```

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

### Fixture Naming

New fixtures should follow the pattern `NNN-description.pbxproj` (e.g., `009-expo-app-clip.pbxproj`). Add new fixtures to the `fixtures` array in `src/json/__tests__/json.test.ts` for parsing validation against `plutil`.

### JSON Tests

In `json.test.ts`, fixtures are added to two arrays:
- `fixtures` - Tests parsing correctness by comparing against macOS `plutil` output
- `inOutFixtures` - Tests round-trip (parse → build → should equal original). Only add here if the fixture round-trips perfectly; some fixtures have known formatting differences.