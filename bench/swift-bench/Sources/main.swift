import Foundation
import XcodeProj
import PathKit

struct BenchmarkResult: Codable {
    let parser: String
    let fixture: String
    let avgMs: Double
    let minMs: Double
    let maxMs: Double
    let iterations: Int
}

func benchmark(filePath: String, iterations: Int) -> BenchmarkResult? {
    let path = Path(filePath)

    guard path.exists else {
        fputs("Error: File not found: \(filePath)\n", stderr)
        return nil
    }

    // Read the pbxproj content
    guard let content = try? path.read(.utf8) else {
        fputs("Error: Could not read file\n", stderr)
        return nil
    }

    var times: [Double] = []

    // Warm-up run
    if let data = content.data(using: .utf8) {
        _ = try? PBXProj(data: data)
    }

    for _ in 0..<iterations {
        let start = CFAbsoluteTimeGetCurrent()

        // Parse the pbxproj file using XcodeProj's PBXProj parser
        if let data = content.data(using: .utf8) {
            _ = try? PBXProj(data: data)
        }

        let elapsed = CFAbsoluteTimeGetCurrent() - start
        times.append(elapsed)
    }

    let avgMs = (times.reduce(0, +) / Double(times.count)) * 1000
    let minMs = (times.min() ?? 0) * 1000
    let maxMs = (times.max() ?? 0) * 1000

    return BenchmarkResult(
        parser: "XcodeProj (Swift)",
        fixture: path.lastComponent,
        avgMs: avgMs,
        minMs: minMs,
        maxMs: maxMs,
        iterations: iterations
    )
}

func main() {
    let args = CommandLine.arguments

    guard args.count >= 2 else {
        print("Usage: XcodeProjBench <path-to-pbxproj> [iterations]")
        print("       XcodeProjBench --json <path-to-pbxproj> [iterations]")
        return
    }

    var jsonOutput = false
    var pathIndex = 1

    if args[1] == "--json" {
        jsonOutput = true
        pathIndex = 2
    }

    guard args.count > pathIndex else {
        print("Error: Missing file path")
        return
    }

    let filePath = args[pathIndex]
    let iterations = args.count > pathIndex + 1 ? Int(args[pathIndex + 1]) ?? 100 : 100

    guard let result = benchmark(filePath: filePath, iterations: iterations) else {
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
        print("XcodeProj (Swift/Tuist)")
        print("  file: \(result.fixture)")
        print("  avg: \(String(format: "%.3f", result.avgMs))ms")
        print("  min: \(String(format: "%.3f", result.minMs))ms")
        print("  max: \(String(format: "%.3f", result.maxMs))ms")
        print("  iterations: \(result.iterations)")
    }
}

main()
