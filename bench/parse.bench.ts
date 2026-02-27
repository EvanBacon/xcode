import { bench, run, group, summary } from "mitata";
import { readFileSync } from "fs";
import { join } from "path";

// JSON parser
import { parse } from "../src/json";
// High-level API
import { XcodeProject } from "../src/api/XcodeProject";
// Legacy xcode package for comparison
import legacyXcode from "xcode";

const FIXTURES_DIR = join(__dirname, "../src/json/__tests__/fixtures");

// Test fixtures ordered by size (small to large)
const fixtures = [
  { name: "small (float)", file: "01-float.pbxproj", bytes: 264 },
  { name: "swift", file: "project-swift.pbxproj", bytes: 18593 },
  { name: "react-native-74", file: "project-rn74.pbxproj", bytes: 29812 },
  { name: "expo-app-clip", file: "009-expo-app-clip.pbxproj", bytes: 39922 },
  { name: "shopify-tophat", file: "shopify-tophat.pbxproj", bytes: 49021 },
  { name: "AFNetworking", file: "AFNetworking.pbxproj", bytes: 101506 },
  { name: "Cocoa-Application", file: "Cocoa-Application.pbxproj", bytes: 169497 },
  { name: "swift-protobuf", file: "swift-protobuf.pbxproj", bytes: 263169 },
];

// Pre-load all fixture contents to measure pure parse time
const fixtureContents = new Map<string, string>();
const fixturePaths = new Map<string, string>();

for (const fixture of fixtures) {
  const filePath = join(FIXTURES_DIR, fixture.file);
  fixtureContents.set(fixture.name, readFileSync(filePath, "utf8"));
  fixturePaths.set(fixture.name, filePath);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(0)}KB`;
}

// Calculate total size for summary
const totalBytes = fixtures.reduce((sum, f) => sum + f.bytes, 0);

console.log(`\n========================================`);
console.log(`@bacons/xcode Parser Benchmark`);
console.log(`========================================`);
console.log(`Total fixture data: ${(totalBytes / 1024).toFixed(1)}KB`);
console.log(`Fixtures: ${fixtures.length} files\n`);

// Group 1: parse() across all fixtures
group("parse() - all fixtures", () => {
  for (const fixture of fixtures) {
    const content = fixtureContents.get(fixture.name)!;
    bench(`${fixture.name} (${formatSize(fixture.bytes)})`, () => {
      parse(content);
    });
  }
});

// Group 2: Full XcodeProject load (parse + object graph inflation)
group("XcodeProject.open() - Full load", () => {
  for (const fixture of fixtures) {
    const filePath = fixturePaths.get(fixture.name)!;
    bench(`${fixture.name} (${formatSize(fixture.bytes)})`, () => {
      XcodeProject.open(filePath);
    });
  }
});

// Group 3: Parse + build round-trip
group("Round-trip (parse + build)", () => {
  const { build } = require("../src/json") as typeof import("../src/json");

  for (const fixture of fixtures.slice(0, 5)) {
    const content = fixtureContents.get(fixture.name)!;
    bench(`${fixture.name} (${formatSize(fixture.bytes)})`, () => {
      const json = parse(content);
      build(json);
    });
  }
});

// Group 4: Throughput test - largest file
group("Throughput (swift-protobuf 263KB)", () => {
  const largestContent = fixtureContents.get("swift-protobuf")!;
  const largestPath = fixturePaths.get("swift-protobuf")!;

  bench("parse() only", () => {
    parse(largestContent);
  });

  bench("XcodeProject.open()", () => {
    XcodeProject.open(largestPath);
  });
});

// Group 5: Comparison with legacy xcode package
summary(() => {
  group("vs legacy xcode (react-native 29KB)", () => {
    const content = fixtureContents.get("react-native-74")!;
    const filePath = fixturePaths.get("react-native-74")!;

    bench("@bacons/xcode parse()", () => {
      parse(content);
    });

    bench("legacy xcode parseSync()", () => {
      legacyXcode.project(filePath).parseSync();
    });
  });
});

// Note: Legacy xcode crashes on swift-protobuf with:
// "Expected "/*", "=", or [A-Za-z0-9_.] but "/" found"
// This demonstrates the spec-compliance advantage of @bacons/xcode

await run({
  avg: true,
  json: false,
  colors: true,
  min_max: true,
  percentiles: true,
});

// Print throughput summary
console.log(`\n========================================`);
console.log(`Throughput Summary`);
console.log(`========================================`);

const iterations = 20;
const largestContent = fixtureContents.get("swift-protobuf")!;
const largestBytes = fixtures.find(f => f.name === "swift-protobuf")!.bytes;

const start = performance.now();
for (let i = 0; i < iterations; i++) {
  parse(largestContent);
}
const elapsed = performance.now() - start;
const throughput = (largestBytes * iterations / 1024 / 1024) / (elapsed / 1000);

console.log(`parse() throughput: ${throughput.toFixed(2)} MB/s`);
console.log(`\nNote: Legacy xcode package crashes on swift-protobuf fixture`);
console.log(`      demonstrating @bacons/xcode's spec-compliance advantage.\n`);
