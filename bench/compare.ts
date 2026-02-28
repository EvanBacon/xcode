#!/usr/bin/env bun
/**
 * Cross-language pbxproj parser comparison benchmark
 *
 * Compares parsing at TWO levels:
 * 1. LOW-LEVEL: String → JSON/Dictionary (just parsing)
 * 2. HIGH-LEVEL: File → Full object model with resolved references
 *
 * Parsers:
 * - @bacons/xcode (TypeScript/Chevrotain)
 * - legacy xcode npm package (JavaScript/PEG.js)
 * - xcodeproj gem (Ruby/CocoaPods)
 * - XcodeProj (Swift/Tuist)
 *
 * Prerequisites:
 * - bun (for running this script)
 * - ruby with xcodeproj gem: `gem install xcodeproj`
 * - swift with XcodeProj built: `cd bench/swift-bench && swift build -c release`
 */

import { spawnSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// @bacons/xcode
import { parse } from "../src/json";
import { XcodeProject } from "../src/api/XcodeProject";
// Legacy xcode package
import legacyXcode from "xcode";

const FIXTURES_DIR = join(__dirname, "../src/json/__tests__/fixtures");
const SWIFT_BENCH_DIR = join(__dirname, "swift-bench");
const RUBY_SCRIPT = join(__dirname, "xcodeproj.rb");

// Test fixtures
const fixtures = [
  { name: "react-native-74", file: "project-rn74.pbxproj", bytes: 29812 },
  { name: "swift-protobuf", file: "swift-protobuf.pbxproj", bytes: 263169 },
];

interface BenchResult {
  parser: string;
  fixture: string;
  level: "low" | "high";
  avgMs: number;
  minMs: number;
  maxMs: number;
  iterations: number;
  error?: string;
  notes?: string;
}

function formatSize(bytes: number): string {
  return bytes < 1024 ? `${bytes}B` : `${(bytes / 1024).toFixed(0)}KB`;
}

// ============================================================================
// LOW-LEVEL BENCHMARKS (String → JSON/Dict, no file I/O, no object model)
// ============================================================================

function benchBaconsXcodeLowLevel(
  content: string,
  fixture: string,
  iterations: number
): BenchResult {
  const times: number[] = [];

  // Warm-up
  parse(content);

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    parse(content);
    times.push(performance.now() - start);
  }

  return {
    parser: "@bacons/xcode",
    fixture,
    level: "low",
    avgMs: times.reduce((a, b) => a + b, 0) / times.length,
    minMs: Math.min(...times),
    maxMs: Math.max(...times),
    iterations,
    notes: "parse() - string to JSON",
  };
}

function benchRubyLowLevel(
  filePath: string,
  fixture: string,
  iterations: number
): BenchResult {
  try {
    // Check if ruby and xcodeproj are available
    const checkResult = spawnSync(
      "ruby",
      ["-e", "require 'xcodeproj'; puts 'ok'"],
      { encoding: "utf8", timeout: 5000 }
    );

    if (checkResult.status !== 0) {
      return {
        parser: "xcodeproj (Ruby)",
        fixture,
        level: "low",
        avgMs: 0,
        minMs: 0,
        maxMs: 0,
        iterations: 0,
        error: "xcodeproj gem not installed",
      };
    }

    // Run the benchmark with --level=low
    const benchResult = spawnSync(
      "ruby",
      [RUBY_SCRIPT, "--level=low", filePath, String(iterations)],
      { encoding: "utf8", timeout: 120000 }
    );

    if (benchResult.status !== 0) {
      return {
        parser: "xcodeproj (Ruby)",
        fixture,
        level: "low",
        avgMs: 0,
        minMs: 0,
        maxMs: 0,
        iterations: 0,
        error: benchResult.stderr?.slice(0, 80) || "Benchmark failed",
      };
    }

    const output = benchResult.stdout;
    const avgMatch = output.match(/avg:\s*([\d.]+)ms/);
    const minMatch = output.match(/min:\s*([\d.]+)ms/);
    const maxMatch = output.match(/max:\s*([\d.]+)ms/);

    return {
      parser: "xcodeproj (Ruby)",
      fixture,
      level: "low",
      avgMs: avgMatch ? parseFloat(avgMatch[1]) : 0,
      minMs: minMatch ? parseFloat(minMatch[1]) : 0,
      maxMs: maxMatch ? parseFloat(maxMatch[1]) : 0,
      iterations,
      notes: "Nanaimo ASCII plist parse (no file I/O)",
    };
  } catch (e: any) {
    return {
      parser: "xcodeproj (Ruby)",
      fixture,
      level: "low",
      avgMs: 0,
      minMs: 0,
      maxMs: 0,
      iterations: 0,
      error: e.message?.slice(0, 50) || "Unknown error",
    };
  }
}

function benchSwiftLowLevel(
  filePath: string,
  fixture: string,
  iterations: number
): BenchResult {
  const swiftBinary = join(SWIFT_BENCH_DIR, ".build/release/XcodeProjBench");

  try {
    if (!existsSync(swiftBinary)) {
      return {
        parser: "XcodeProj (Swift)",
        fixture,
        level: "low",
        avgMs: 0,
        minMs: 0,
        maxMs: 0,
        iterations: 0,
        error: "Not built. Run: cd bench/swift-bench && swift build -c release",
      };
    }

    const benchResult = spawnSync(
      swiftBinary,
      ["--json", "--level=low", filePath, String(iterations)],
      { encoding: "utf8", timeout: 120000 }
    );

    if (benchResult.status !== 0) {
      return {
        parser: "XcodeProj (Swift)",
        fixture,
        level: "low",
        avgMs: 0,
        minMs: 0,
        maxMs: 0,
        iterations: 0,
        error: benchResult.stderr?.slice(0, 80) || "Benchmark failed",
      };
    }

    const result = JSON.parse(benchResult.stdout);
    return {
      parser: "XcodeProj (Swift)",
      fixture,
      level: "low",
      avgMs: result.avgMs,
      minMs: result.minMs,
      maxMs: result.maxMs,
      iterations: result.iterations,
      notes: "PropertyListSerialization (no object model)",
    };
  } catch (e: any) {
    return {
      parser: "XcodeProj (Swift)",
      fixture,
      level: "low",
      avgMs: 0,
      minMs: 0,
      maxMs: 0,
      iterations: 0,
      error: e.message?.slice(0, 50) || "Unknown error",
    };
  }
}

// ============================================================================
// HIGH-LEVEL BENCHMARKS (File → Full object model with resolved references)
// ============================================================================

function benchBaconsXcodeHighLevel(
  filePath: string,
  fixture: string,
  iterations: number
): BenchResult {
  const times: number[] = [];

  // Warm-up
  XcodeProject.open(filePath);

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    XcodeProject.open(filePath);
    times.push(performance.now() - start);
  }

  return {
    parser: "@bacons/xcode",
    fixture,
    level: "high",
    avgMs: times.reduce((a, b) => a + b, 0) / times.length,
    minMs: Math.min(...times),
    maxMs: Math.max(...times),
    iterations,
    notes: "XcodeProject.open() - full object graph",
  };
}

function benchLegacyXcodeHighLevel(
  filePath: string,
  fixture: string,
  iterations: number
): BenchResult {
  const times: number[] = [];

  try {
    // Warm-up
    legacyXcode.project(filePath).parseSync();

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      legacyXcode.project(filePath).parseSync();
      times.push(performance.now() - start);
    }

    return {
      parser: "xcode (legacy)",
      fixture,
      level: "high",
      avgMs: times.reduce((a, b) => a + b, 0) / times.length,
      minMs: Math.min(...times),
      maxMs: Math.max(...times),
      iterations,
      notes: "parseSync() - includes file I/O",
    };
  } catch (e: any) {
    return {
      parser: "xcode (legacy)",
      fixture,
      level: "high",
      avgMs: 0,
      minMs: 0,
      maxMs: 0,
      iterations: 0,
      error: e.message?.slice(0, 50) || "Parse error",
    };
  }
}

function benchRubyHighLevel(
  filePath: string,
  fixture: string,
  iterations: number
): BenchResult {
  try {
    const checkResult = spawnSync(
      "ruby",
      ["-e", "require 'xcodeproj'; puts 'ok'"],
      { encoding: "utf8", timeout: 5000 }
    );

    if (checkResult.status !== 0) {
      return {
        parser: "xcodeproj (Ruby)",
        fixture,
        level: "high",
        avgMs: 0,
        minMs: 0,
        maxMs: 0,
        iterations: 0,
        error: "xcodeproj gem not installed",
      };
    }

    // Run the benchmark with --level=high
    const benchResult = spawnSync(
      "ruby",
      [RUBY_SCRIPT, "--level=high", filePath, String(iterations)],
      { encoding: "utf8", timeout: 120000 }
    );

    if (benchResult.status !== 0) {
      return {
        parser: "xcodeproj (Ruby)",
        fixture,
        level: "high",
        avgMs: 0,
        minMs: 0,
        maxMs: 0,
        iterations: 0,
        error: benchResult.stderr?.slice(0, 80) || "Benchmark failed",
      };
    }

    const output = benchResult.stdout;
    const avgMatch = output.match(/avg:\s*([\d.]+)ms/);
    const minMatch = output.match(/min:\s*([\d.]+)ms/);
    const maxMatch = output.match(/max:\s*([\d.]+)ms/);

    return {
      parser: "xcodeproj (Ruby)",
      fixture,
      level: "high",
      avgMs: avgMatch ? parseFloat(avgMatch[1]) : 0,
      minMs: minMatch ? parseFloat(minMatch[1]) : 0,
      maxMs: maxMatch ? parseFloat(maxMatch[1]) : 0,
      iterations,
      notes: "Project.open() - full object model",
    };
  } catch (e: any) {
    return {
      parser: "xcodeproj (Ruby)",
      fixture,
      level: "high",
      avgMs: 0,
      minMs: 0,
      maxMs: 0,
      iterations: 0,
      error: e.message?.slice(0, 50) || "Unknown error",
    };
  }
}

function benchSwiftHighLevel(
  filePath: string,
  fixture: string,
  iterations: number
): BenchResult {
  const swiftBinary = join(SWIFT_BENCH_DIR, ".build/release/XcodeProjBench");

  try {
    if (!existsSync(swiftBinary)) {
      return {
        parser: "XcodeProj (Swift)",
        fixture,
        level: "high",
        avgMs: 0,
        minMs: 0,
        maxMs: 0,
        iterations: 0,
        error: "Not built. Run: cd bench/swift-bench && swift build -c release",
      };
    }

    const benchResult = spawnSync(
      swiftBinary,
      ["--json", "--level=high", filePath, String(iterations)],
      { encoding: "utf8", timeout: 120000 }
    );

    if (benchResult.status !== 0) {
      return {
        parser: "XcodeProj (Swift)",
        fixture,
        level: "high",
        avgMs: 0,
        minMs: 0,
        maxMs: 0,
        iterations: 0,
        error: benchResult.stderr?.slice(0, 80) || "Benchmark failed",
      };
    }

    const result = JSON.parse(benchResult.stdout);
    return {
      parser: "XcodeProj (Swift)",
      fixture,
      level: "high",
      avgMs: result.avgMs,
      minMs: result.minMs,
      maxMs: result.maxMs,
      iterations: result.iterations,
      notes: "PBXProj(data:) - full object model",
    };
  } catch (e: any) {
    return {
      parser: "XcodeProj (Swift)",
      fixture,
      level: "high",
      avgMs: 0,
      minMs: 0,
      maxMs: 0,
      iterations: 0,
      error: e.message?.slice(0, 50) || "Unknown error",
    };
  }
}

// ============================================================================
// Output
// ============================================================================

function printTable(results: BenchResult[], level: "low" | "high") {
  const filtered = results.filter((r) => r.level === level);
  const byFixture = new Map<string, BenchResult[]>();

  for (const r of filtered) {
    const existing = byFixture.get(r.fixture) || [];
    existing.push(r);
    byFixture.set(r.fixture, existing);
  }

  for (const [fixture, fixtureResults] of byFixture) {
    console.log(`\n### ${fixture}`);
    console.log("| Parser | Avg | Min | Max | Notes |");
    console.log("|--------|-----|-----|-----|-------|");

    const sorted = [...fixtureResults].sort((a, b) => {
      if (a.error && !b.error) return 1;
      if (!a.error && b.error) return -1;
      return a.avgMs - b.avgMs;
    });

    const fastest = sorted.find((r) => !r.error)?.avgMs || 0;

    for (const r of sorted) {
      if (r.error) {
        console.log(`| ${r.parser} | - | - | - | ❌ ${r.error} |`);
      } else {
        const speedup =
          fastest > 0 && r.avgMs > fastest
            ? ` (${(r.avgMs / fastest).toFixed(1)}x)`
            : "";
        const trophy = r.avgMs === fastest ? " 🏆" : "";
        console.log(
          `| ${r.parser} | ${r.avgMs.toFixed(2)}ms${trophy}${speedup} | ${r.minMs.toFixed(2)}ms | ${r.maxMs.toFixed(2)}ms | ${r.notes || ""} |`
        );
      }
    }
  }
}

async function main() {
  const iterations = 100;

  console.log("=".repeat(60));
  console.log("Cross-Language pbxproj Parser Benchmark");
  console.log("=".repeat(60));
  console.log(`Iterations per test: ${iterations}\n`);

  console.log("Parsers being compared:");
  console.log("  - @bacons/xcode (TypeScript, Chevrotain)");
  console.log("  - xcode (JavaScript, PEG.js) - legacy npm package");
  console.log("  - xcodeproj (Ruby) - CocoaPods gem");
  console.log("  - XcodeProj (Swift) - Tuist library");

  const allResults: BenchResult[] = [];

  // =========================================================================
  // LOW-LEVEL BENCHMARKS
  // =========================================================================
  console.log("\n" + "=".repeat(60));
  console.log("LOW-LEVEL: String → JSON/Dictionary (pure parsing)");
  console.log("=".repeat(60));
  console.log("No file I/O, no object model construction.\n");

  for (const fixture of fixtures) {
    const filePath = join(FIXTURES_DIR, fixture.file);
    const content = readFileSync(filePath, "utf8");

    console.log(`Benchmarking: ${fixture.name} (${formatSize(fixture.bytes)})...`);

    // @bacons/xcode - low level
    process.stdout.write("  @bacons/xcode parse()... ");
    const baconsLow = benchBaconsXcodeLowLevel(content, fixture.name, iterations);
    console.log(`${baconsLow.avgMs.toFixed(2)}ms`);
    allResults.push(baconsLow);

    // Ruby - low level
    process.stdout.write("  xcodeproj (Ruby) low-level... ");
    const rubyLow = benchRubyLowLevel(filePath, fixture.name, iterations);
    if (rubyLow.error) {
      console.log(`❌ ${rubyLow.error}`);
    } else {
      console.log(`${rubyLow.avgMs.toFixed(2)}ms`);
    }
    allResults.push(rubyLow);

    // Swift - low level
    process.stdout.write("  XcodeProj (Swift) low-level... ");
    const swiftLow = benchSwiftLowLevel(filePath, fixture.name, iterations);
    if (swiftLow.error) {
      console.log(`❌ ${swiftLow.error}`);
    } else {
      console.log(`${swiftLow.avgMs.toFixed(2)}ms`);
    }
    allResults.push(swiftLow);
  }

  // =========================================================================
  // HIGH-LEVEL BENCHMARKS
  // =========================================================================
  console.log("\n" + "=".repeat(60));
  console.log("HIGH-LEVEL: File → Full Object Model");
  console.log("=".repeat(60));
  console.log("Includes file I/O and object graph construction.\n");

  for (const fixture of fixtures) {
    const filePath = join(FIXTURES_DIR, fixture.file);

    console.log(`Benchmarking: ${fixture.name} (${formatSize(fixture.bytes)})...`);

    // @bacons/xcode - high level
    process.stdout.write("  @bacons/xcode XcodeProject.open()... ");
    const baconsHigh = benchBaconsXcodeHighLevel(filePath, fixture.name, iterations);
    console.log(`${baconsHigh.avgMs.toFixed(2)}ms`);
    allResults.push(baconsHigh);

    // Legacy xcode - only high level (API requires file path)
    process.stdout.write("  xcode (legacy) parseSync()... ");
    const legacyHigh = benchLegacyXcodeHighLevel(filePath, fixture.name, iterations);
    if (legacyHigh.error) {
      console.log(`❌ ${legacyHigh.error}`);
    } else {
      console.log(`${legacyHigh.avgMs.toFixed(2)}ms`);
    }
    allResults.push(legacyHigh);

    // Ruby - high level
    process.stdout.write("  xcodeproj (Ruby) Project.open()... ");
    const rubyHigh = benchRubyHighLevel(filePath, fixture.name, iterations);
    if (rubyHigh.error) {
      console.log(`❌ ${rubyHigh.error}`);
    } else {
      console.log(`${rubyHigh.avgMs.toFixed(2)}ms`);
    }
    allResults.push(rubyHigh);

    // Swift - high level
    process.stdout.write("  XcodeProj (Swift) PBXProj()... ");
    const swiftHigh = benchSwiftHighLevel(filePath, fixture.name, iterations);
    if (swiftHigh.error) {
      console.log(`❌ ${swiftHigh.error}`);
    } else {
      console.log(`${swiftHigh.avgMs.toFixed(2)}ms`);
    }
    allResults.push(swiftHigh);
  }

  // =========================================================================
  // Results Summary
  // =========================================================================
  console.log("\n" + "=".repeat(60));
  console.log("Results Summary");
  console.log("=".repeat(60));

  console.log("\n## Low-Level (String → JSON/Dict)");
  console.log("Fair comparison: all parse from pre-loaded string, no I/O.");
  printTable(allResults, "low");

  console.log("\n## High-Level (File → Object Model)");
  console.log("Real-world usage: file I/O + parsing + object construction.");
  printTable(allResults, "high");

  console.log("\n" + "=".repeat(60));
  console.log("Notes");
  console.log("=".repeat(60));
  console.log("- Low-level: Pure parsing, content pre-loaded, no object model");
  console.log("- High-level: Real-world API including file I/O and object graph");
  console.log("- Legacy xcode only supports high-level API (requires file path)");
  console.log("- Lower times are better");
  console.log("");
}

main().catch(console.error);
