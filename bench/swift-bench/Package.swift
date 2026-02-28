// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "XcodeProjBench",
    platforms: [.macOS(.v12)],
    dependencies: [
        .package(url: "https://github.com/tuist/XcodeProj.git", from: "8.0.0"),
    ],
    targets: [
        .executableTarget(
            name: "XcodeProjBench",
            dependencies: ["XcodeProj"],
            path: "Sources"
        ),
    ]
)
