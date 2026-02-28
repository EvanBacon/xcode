import Foundation
import XcodeProj
import PathKit

struct BenchmarkResult: Codable {
    let parser: String
    let level: String
    let fixture: String
    let avgMs: Double
    let minMs: Double
    let maxMs: Double
    let iterations: Int
    let notes: String?
}

/// Low-level benchmark: Just plist parsing, no object model construction
/// Content is pre-loaded and converted to Data before timing
func benchmarkLowLevel(filePath: String, iterations: Int) -> BenchmarkResult? {
    let path = Path(filePath)

    guard path.exists else {
        fputs("Error: File not found: \(filePath)\n", stderr)
        return nil
    }

    // Pre-read and convert to Data (not timed)
    guard let content = try? path.read(.utf8),
          let data = content.data(using: .utf8) else {
        fputs("Error: Could not read file\n", stderr)
        return nil
    }

    var times: [Double] = []

    // Warm-up run - just plist parsing
    _ = try? PropertyListSerialization.propertyList(from: data, options: [], format: nil)

    for _ in 0..<iterations {
        let start = CFAbsoluteTimeGetCurrent()

        // Only measure the plist parsing, not string-to-data conversion
        _ = try? PropertyListSerialization.propertyList(from: data, options: [], format: nil)

        let elapsed = CFAbsoluteTimeGetCurrent() - start
        times.append(elapsed)
    }

    let avgMs = (times.reduce(0, +) / Double(times.count)) * 1000
    let minMs = (times.min() ?? 0) * 1000
    let maxMs = (times.max() ?? 0) * 1000

    return BenchmarkResult(
        parser: "XcodeProj (Swift)",
        level: "low",
        fixture: path.lastComponent,
        avgMs: avgMs,
        minMs: minMs,
        maxMs: maxMs,
        iterations: iterations,
        notes: "PropertyListSerialization (no object model)"
    )
}

/// High-level benchmark: Full PBXProj parsing with object model construction
/// This is what real users do with XcodeProj
func benchmarkHighLevel(filePath: String, iterations: Int) -> BenchmarkResult? {
    let path = Path(filePath)

    guard path.exists else {
        fputs("Error: File not found: \(filePath)\n", stderr)
        return nil
    }

    // Pre-read content (but Data conversion will happen in timing for fair comparison
    // since that's what PBXProj(data:) requires)
    guard let content = try? path.read(.utf8) else {
        fputs("Error: Could not read file\n", stderr)
        return nil
    }

    // Pre-convert to data since PBXProj requires Data
    // This is fair because we're measuring the pbxproj parsing + object model construction
    guard let data = content.data(using: .utf8) else {
        fputs("Error: Could not convert to data\n", stderr)
        return nil
    }

    var times: [Double] = []

    // Warm-up run
    _ = try? PBXProj(data: data)

    for _ in 0..<iterations {
        let start = CFAbsoluteTimeGetCurrent()

        // Parse pbxproj and build full object model
        _ = try? PBXProj(data: data)

        let elapsed = CFAbsoluteTimeGetCurrent() - start
        times.append(elapsed)
    }

    let avgMs = (times.reduce(0, +) / Double(times.count)) * 1000
    let minMs = (times.min() ?? 0) * 1000
    let maxMs = (times.max() ?? 0) * 1000

    return BenchmarkResult(
        parser: "XcodeProj (Swift)",
        level: "high",
        fixture: path.lastComponent,
        avgMs: avgMs,
        minMs: minMs,
        maxMs: maxMs,
        iterations: iterations,
        notes: "PBXProj(data:) - full object model"
    )
}

func main() {
    let args = CommandLine.arguments

    guard args.count >= 2 else {
        print("Usage: XcodeProjBench [--json] [--level=low|high] <path-to-pbxproj> [iterations]")
        return
    }

    var jsonOutput = false
    var level = "high"  // default
    var remainingArgs: [String] = []

    // Parse flags
    for arg in args.dropFirst() {
        if arg == "--json" {
            jsonOutput = true
        } else if arg.hasPrefix("--level=") {
            level = String(arg.dropFirst("--level=".count))
        } else {
            remainingArgs.append(arg)
        }
    }

    guard !remainingArgs.isEmpty else {
        print("Error: Missing file path")
        return
    }

    let filePath = remainingArgs[0]
    let iterations = remainingArgs.count > 1 ? Int(remainingArgs[1]) ?? 100 : 100

    let result: BenchmarkResult?
    if level == "low" {
        result = benchmarkLowLevel(filePath: filePath, iterations: iterations)
    } else {
        result = benchmarkHighLevel(filePath: filePath, iterations: iterations)
    }

    guard let result = result else {
        return
    }

    if jsonOutput {
        let encoder = JSONEncoder()
        encoder.outputFormatting = .prettyPrinted
        if let data = try? encoder.encode(result),
           let json = String(data: data, encoding: .utf8) {
            print(json)
        }
    } else {
        print("XcodeProj (Swift) - \(level)-level")
        print("  file: \(result.fixture)")
        print("  avg: \(String(format: "%.3f", result.avgMs))ms")
        print("  min: \(String(format: "%.3f", result.minMs))ms")
        print("  max: \(String(format: "%.3f", result.maxMs))ms")
        print("  iterations: \(result.iterations)")
    }
}

main()
