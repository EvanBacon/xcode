# Benchmarks

This directory contains benchmarks comparing `@bacons/xcode` against other pbxproj parsers.

## Parsers Compared

| Parser | Language | Library |
|--------|----------|---------|
| @bacons/xcode | TypeScript | Chevrotain |
| xcode (legacy) | JavaScript | PEG.js |
| xcodeproj | Ruby | CocoaPods gem |
| XcodeProj | Swift | Tuist |

## Quick Start

```bash
# Run TypeScript-only benchmarks
bun run bench

# Run cross-language comparison (requires setup below)
bun run bench:compare
```

## Setup

### Ruby (xcodeproj gem)

```bash
# Option 1: Install globally
gem install xcodeproj

# Option 2: Use bundler
cd bench
bundle install
```

### Swift (XcodeProj)

```bash
# Build the Swift benchmark tool
bun run bench:setup

# Or manually:
cd bench/swift-bench
swift build -c release
```

## Benchmarks

### `bun run bench`

Runs detailed benchmarks of `@bacons/xcode` using [mitata](https://github.com/evanwashere/mitata):
- Parse time across different fixture sizes
- XcodeProject.open() (full object graph)
- Round-trip (parse + build)
- Comparison with legacy xcode package

### `bun run bench:compare`

Runs cross-language comparison across all parsers:
- Tests multiple fixtures (small to large)
- Shows avg/min/max times
- Handles parser errors gracefully

## Results

Typical results on Apple Silicon (M1/M2):

| Parser | 29KB (RN) | 263KB (Protobuf) |
|--------|-----------|------------------|
| @bacons/xcode | ~0.1ms | ~1ms |
| xcode (legacy) | ~1.4ms | ❌ crashes |
| xcodeproj (Ruby) | ~2-3ms | ~15-20ms |
| XcodeProj (Swift) | ~0.5ms | ~3-4ms |

Note: Ruby and Swift times include some process/runtime overhead when called from the benchmark script.

## Adding Fixtures

Fixtures are located in `src/json/__tests__/fixtures/`. To add a new fixture:

1. Add the `.pbxproj` file to the fixtures directory
2. Update the `fixtures` array in `bench/parse.bench.ts` and/or `bench/compare.ts`
