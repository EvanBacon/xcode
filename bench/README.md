# Benchmarks

This directory contains benchmarks comparing `@bacons/xcode` against other pbxproj parsers.

## Parsers Compared

| Parser | Language | Library |
|--------|----------|---------|
| @bacons/xcode | TypeScript | Chevrotain |
| xcode (legacy) | JavaScript | PEG.js |
| xcodeproj | Ruby | CocoaPods gem (Nanaimo) |
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

## Benchmark Methodology

The benchmark compares parsers at two levels to ensure fair comparison:

### Low-Level (String → JSON/Dict)

- Content is pre-loaded into memory before timing
- Only measures parsing, no file I/O
- No object model construction
- **This is the fairest comparison of raw parsing speed**

### High-Level (File → Object Model)

- Includes file I/O (reading from disk)
- Includes full object model construction with resolved references
- **This reflects real-world API usage**

## Commands

### `bun run bench`

Runs detailed benchmarks of `@bacons/xcode` using [mitata](https://github.com/evanwashere/mitata):
- Parse time across different fixture sizes
- XcodeProject.open() (full object graph)
- Round-trip (parse + build)
- Comparison with legacy xcode package

### `bun run bench:compare`

Runs cross-language comparison across all parsers:
- Tests at both low-level and high-level
- Shows avg/min/max times
- Handles parser errors gracefully

## Results

Typical results on Apple Silicon (M1/M2):

### Low-Level (Pure Parsing)

| Parser | 29KB (RN) | 263KB (Protobuf) | Relative |
|--------|-----------|------------------|----------|
| @bacons/xcode | 0.15ms | 0.82ms | 1x |
| XcodeProj (Swift) | 0.38ms | 2.29ms | 2.5-2.8x |
| xcodeproj (Ruby) | 3.27ms | 20.65ms | 22-25x |

### High-Level (Full Object Model)

| Parser | 29KB (RN) | 263KB (Protobuf) | Relative |
|--------|-----------|------------------|----------|
| @bacons/xcode | 0.37ms | 2.69ms | 1x |
| xcode (legacy) | 1.48ms | crashes | 4x |
| XcodeProj (Swift) | 2.03ms | 10.79ms | 4-5x |
| xcodeproj (Ruby) | 3.57ms | 22.30ms | 8-10x |

## Adding Fixtures

Fixtures are located in `src/json/__tests__/fixtures/`. To add a new fixture:

1. Add the `.pbxproj` file to the fixtures directory
2. Update the `fixtures` array in `bench/parse.bench.ts` and/or `bench/compare.ts`
