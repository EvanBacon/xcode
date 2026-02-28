#!/usr/bin/env bun
/**
 * Cross-language pbxproj parser comparison benchmark
 *
 * Compares:
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

import { execSync, spawnSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// @bacons/xcode
import { parse } from "../src/json";
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
  avgMs: number;
  minMs: number;
  maxMs: number;
  iterations: number;
  error?: string;
}

function formatSize(bytes: number): string {
  return bytes < 1024 ? `${bytes}B` : `${(bytes / 1024).toFixed(0)}KB`;
}

function benchBaconsXcode(
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

  const avgMs = times.reduce((a, b) => a + b, 0) / times.length;
  const minMs = Math.min(...times);
  const maxMs = Math.max(...times);

  return {
    parser: "@bacons/xcode",
    fixture,
    avgMs,
    minMs,
    maxMs,
    iterations,
  };
}

function benchLegacyXcode(
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

    const avgMs = times.reduce((a, b) => a + b, 0) / times.length;
    const minMs = Math.min(...times);
    const maxMs = Math.max(...times);

    return {
      parser: "xcode (legacy)",
      fixture,
      avgMs,
      minMs,
      maxMs,
      iterations,
    };
  } catch (e: any) {
    return {
      parser: "xcode (legacy)",
      fixture,
      avgMs: 0,
      minMs: 0,
      maxMs: 0,
      iterations: 0,
      error: e.message?.slice(0, 50) || "Parse error",
    };
  }
}

function benchRubyXcodeproj(
  filePath: string,
  fixture: string,
  iterations: number
): BenchResult {
  try {
    // Check if ruby and xcodeproj are available
    const result = spawnSync(
      "ruby",
      ["-e", "require 'xcodeproj'; puts 'ok'"],
      {
        encoding: "utf8",
        timeout: 5000,
      }
    );

    if (result.status !== 0) {
      return {
        parser: "xcodeproj (Ruby)",
        fixture,
        avgMs: 0,
        minMs: 0,
        maxMs: 0,
        iterations: 0,
        error: "xcodeproj gem not installed",
      };
    }

    // Run the benchmark
    const benchResult = spawnSync(
      "ruby",
      [RUBY_SCRIPT, filePath, String(iterations)],
      {
        encoding: "utf8",
        timeout: 60000,
      }
    );

    if (benchResult.status !== 0) {
      return {
        parser: "xcodeproj (Ruby)",
        fixture,
        avgMs: 0,
        minMs: 0,
        maxMs: 0,
        iterations: 0,
        error: benchResult.stderr?.slice(0, 50) || "Benchmark failed",
      };
    }

    // Parse output
    const output = benchResult.stdout;
    const avgMatch = output.match(/avg:\s*([\d.]+)ms/);
    const minMatch = output.match(/min:\s*([\d.]+)ms/);
    const maxMatch = output.match(/max:\s*([\d.]+)ms/);

    return {
      parser: "xcodeproj (Ruby)",
      fixture,
      avgMs: avgMatch ? parseFloat(avgMatch[1]) : 0,
      minMs: minMatch ? parseFloat(minMatch[1]) : 0,
      maxMs: maxMatch ? parseFloat(maxMatch[1]) : 0,
      iterations,
    };
  } catch (e: any) {
    return {
      parser: "xcodeproj (Ruby)",
      fixture,
      avgMs: 0,
      minMs: 0,
      maxMs: 0,
      iterations: 0,
      error: e.message?.slice(0, 50) || "Unknown error",
    };
  }
}

function benchSwiftXcodeProj(
  filePath: string,
  fixture: string,
  iterations: number
): BenchResult {
  const swiftBinary = join(
    SWIFT_BENCH_DIR,
    ".build/release/XcodeProjBench"
  );

  try {
    // Check if swift binary exists
    if (!existsSync(swiftBinary)) {
      return {
        parser: "XcodeProj (Swift)",
        fixture,
        avgMs: 0,
        minMs: 0,
        maxMs: 0,
        iterations: 0,
        error: "Not built. Run: cd bench/swift-bench && swift build -c release",
      };
    }

    // Run the benchmark
    const benchResult = spawnSync(
      swiftBinary,
      ["--json", filePath, String(iterations)],
      {
        encoding: "utf8",
        timeout: 60000,
      }
    );

    if (benchResult.status !== 0) {
      return {
        parser: "XcodeProj (Swift)",
        fixture,
        avgMs: 0,
        minMs: 0,
        maxMs: 0,
        iterations: 0,
        error: benchResult.stderr?.slice(0, 50) || "Benchmark failed",
      };
    }

    // Parse JSON output
    const result = JSON.parse(benchResult.stdout);

    return {
      parser: "XcodeProj (Swift)",
      fixture,
      avgMs: result.avgMs,
      minMs: result.minMs,
      maxMs: result.maxMs,
      iterations: result.iterations,
    };
  } catch (e: any) {
    return {
      parser: "XcodeProj (Swift)",
      fixture,
      avgMs: 0,
      minMs: 0,
      maxMs: 0,
      iterations: 0,
      error: e.message?.slice(0, 50) || "Unknown error",
    };
  }
}

function printTable(results: BenchResult[]) {
  // Group by fixture
  const byFixture = new Map<string, BenchResult[]>();
  for (const r of results) {
    const existing = byFixture.get(r.fixture) || [];
    existing.push(r);
    byFixture.set(r.fixture, existing);
  }

  for (const [fixture, fixtureResults] of byFixture) {
    console.log(`\n### ${fixture}`);
    console.log("| Parser | Avg | Min | Max | Status |");
    console.log("|--------|-----|-----|-----|--------|");

    // Sort by avgMs (fastest first)
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
            ? ` (${(r.avgMs / fastest).toFixed(1)}x slower)`
            : fastest > 0 && r.avgMs === fastest
              ? " 🏆"
              : "";
        console.log(
          `| ${r.parser} | ${r.avgMs.toFixed(2)}ms | ${r.minMs.toFixed(2)}ms | ${r.maxMs.toFixed(2)}ms | ✅${speedup} |`
        );
      }
    }
  }
}

async function main() {
  const iterations = 100;

  console.log("========================================");
  console.log("Cross-Language pbxproj Parser Benchmark");
  console.log("========================================");
  console.log(`Iterations per test: ${iterations}`);
  console.log("");

  console.log("Parsers being compared:");
  console.log("  - @bacons/xcode (TypeScript, Chevrotain)");
  console.log("  - xcode (JavaScript, PEG.js) - legacy npm package");
  console.log("  - xcodeproj (Ruby) - CocoaPods gem");
  console.log("  - XcodeProj (Swift) - Tuist library");

  const allResults: BenchResult[] = [];

  for (const fixture of fixtures) {
    const filePath = join(FIXTURES_DIR, fixture.file);
    const content = readFileSync(filePath, "utf8");

    console.log(`\nBenchmarking: ${fixture.name} (${formatSize(fixture.bytes)})...`);

    // @bacons/xcode
    process.stdout.write("  @bacons/xcode... ");
    const baconsResult = benchBaconsXcode(content, fixture.name, iterations);
    console.log(`${baconsResult.avgMs.toFixed(2)}ms`);
    allResults.push(baconsResult);

    // Legacy xcode
    process.stdout.write("  xcode (legacy)... ");
    const legacyResult = benchLegacyXcode(filePath, fixture.name, iterations);
    if (legacyResult.error) {
      console.log(`❌ ${legacyResult.error}`);
    } else {
      console.log(`${legacyResult.avgMs.toFixed(2)}ms`);
    }
    allResults.push(legacyResult);

    // Ruby xcodeproj
    process.stdout.write("  xcodeproj (Ruby)... ");
    const rubyResult = benchRubyXcodeproj(filePath, fixture.name, iterations);
    if (rubyResult.error) {
      console.log(`❌ ${rubyResult.error}`);
    } else {
      console.log(`${rubyResult.avgMs.toFixed(2)}ms`);
    }
    allResults.push(rubyResult);

    // Swift XcodeProj
    process.stdout.write("  XcodeProj (Swift)... ");
    const swiftResult = benchSwiftXcodeProj(filePath, fixture.name, iterations);
    if (swiftResult.error) {
      console.log(`❌ ${swiftResult.error}`);
    } else {
      console.log(`${swiftResult.avgMs.toFixed(2)}ms`);
    }
    allResults.push(swiftResult);
  }

  console.log("\n========================================");
  console.log("Results Summary");
  console.log("========================================");

  printTable(allResults);

  console.log("\n========================================");
  console.log("Notes");
  console.log("========================================");
  console.log("- Times include only parsing, not file I/O");
  console.log("- Ruby/Swift times include some process overhead");
  console.log("- Legacy xcode crashes on complex files (swift-protobuf)");
  console.log("- Lower times are better");
  console.log("");
}

main().catch(console.error);
