import * as path from "node:path";
import * as xcconfig from "../index";

const fixturesDir = path.join(__dirname, "fixtures");

describe("xcconfig", () => {
  describe("parse", () => {
    it("parses simple settings", () => {
      const content = `
PRODUCT_NAME = MyApp
PRODUCT_BUNDLE_IDENTIFIER = com.example.myapp
      `;

      const config = xcconfig.parse(content);

      expect(config.buildSettings).toHaveLength(2);
      expect(config.buildSettings[0]).toEqual({
        key: "PRODUCT_NAME",
        value: "MyApp",
      });
      expect(config.buildSettings[1]).toEqual({
        key: "PRODUCT_BUNDLE_IDENTIFIER",
        value: "com.example.myapp",
      });
    });

    it("strips comments", () => {
      const content = `
// This is a comment
PRODUCT_NAME = MyApp // inline comment
// Another comment
SWIFT_VERSION = 5.0
      `;

      const config = xcconfig.parse(content);

      expect(config.buildSettings).toHaveLength(2);
      expect(config.buildSettings[0].value).toBe("MyApp");
      expect(config.buildSettings[1].value).toBe("5.0");
    });

    it("parses include directives", () => {
      const content = `
#include "Base.xcconfig"
#include? "Optional.xcconfig"
PRODUCT_NAME = MyApp
      `;

      const config = xcconfig.parse(content);

      expect(config.includes).toHaveLength(2);
      expect(config.includes[0].include).toEqual({
        path: "Base.xcconfig",
        optional: false,
      });
      expect(config.includes[1].include).toEqual({
        path: "Optional.xcconfig",
        optional: true,
      });
    });

    it("parses conditional settings", () => {
      const content = `
OTHER_LDFLAGS[sdk=iphoneos*] = -framework UIKit
ARCHS[arch=arm64] = arm64
DEBUG_FORMAT[config=Debug] = dwarf
      `;

      const config = xcconfig.parse(content);

      expect(config.buildSettings).toHaveLength(3);

      expect(config.buildSettings[0]).toEqual({
        key: "OTHER_LDFLAGS",
        value: "-framework UIKit",
        conditions: [{ sdk: "iphoneos*" }],
      });

      expect(config.buildSettings[1]).toEqual({
        key: "ARCHS",
        value: "arm64",
        conditions: [{ arch: "arm64" }],
      });

      expect(config.buildSettings[2]).toEqual({
        key: "DEBUG_FORMAT",
        value: "dwarf",
        conditions: [{ config: "Debug" }],
      });
    });

    it("parses multiple conditions on same setting", () => {
      const content = `
LIBRARY_SEARCH_PATHS[sdk=iphoneos*][arch=arm64] = /usr/lib/arm64
      `;

      const config = xcconfig.parse(content);

      expect(config.buildSettings[0]).toEqual({
        key: "LIBRARY_SEARCH_PATHS",
        value: "/usr/lib/arm64",
        conditions: [{ sdk: "iphoneos*" }, { arch: "arm64" }],
      });
    });

    it("handles empty values", () => {
      const content = `
EMPTY_SETTING =
ANOTHER_EMPTY =
      `;

      const config = xcconfig.parse(content);

      expect(config.buildSettings).toHaveLength(2);
      expect(config.buildSettings[0].value).toBe("");
      expect(config.buildSettings[1].value).toBe("");
    });

    it("preserves values with special characters", () => {
      const content = `
HEADER_SEARCH_PATHS = "\${PODS_ROOT}/Headers/Public" "\${SRCROOT}/include"
OTHER_LDFLAGS = $(inherited) -framework UIKit -lz
      `;

      const config = xcconfig.parse(content);

      expect(config.buildSettings[0].value).toBe(
        '"${PODS_ROOT}/Headers/Public" "${SRCROOT}/include"'
      );
      expect(config.buildSettings[1].value).toBe(
        "$(inherited) -framework UIKit -lz"
      );
    });
  });

  describe("parseFile", () => {
    it("parses simple xcconfig file", () => {
      const config = xcconfig.parseFile(path.join(fixturesDir, "simple.xcconfig"));

      expect(config.buildSettings.length).toBeGreaterThan(0);
      expect(config.buildSettings.find((s) => s.key === "PRODUCT_NAME")?.value).toBe(
        "MyApp"
      );
    });

    it("resolves includes", () => {
      const config = xcconfig.parseFile(path.join(fixturesDir, "Children.xcconfig"));

      // Should have resolved Parent.xcconfig
      expect(config.includes).toHaveLength(1);
      expect(config.includes[0].config).toBeDefined();

      // Parent should have resolved Base.xcconfig
      expect(config.includes[0].config!.includes).toHaveLength(1);
      expect(config.includes[0].config!.includes[0].config).toBeDefined();
    });

    it("handles optional includes for missing files", () => {
      const config = xcconfig.parseFile(
        path.join(fixturesDir, "optional-include.xcconfig")
      );

      expect(config.includes).toHaveLength(2);

      // First include is optional and missing
      expect(config.includes[0].include.optional).toBe(true);
      expect(config.includes[0].config).toBeUndefined();

      // Second include exists
      expect(config.includes[1].include.optional).toBe(false);
      expect(config.includes[1].config).toBeDefined();
    });

    it("throws on missing required include", () => {
      const content = `#include "NonExistent.xcconfig"`;
      const tempPath = path.join(fixturesDir, "_temp_test.xcconfig");

      require("fs").writeFileSync(tempPath, content);

      try {
        expect(() => xcconfig.parseFile(tempPath)).toThrow(/Include file not found/);
      } finally {
        require("fs").unlinkSync(tempPath);
      }
    });

    it("detects circular includes", () => {
      const tempDir = fixturesDir;
      const aPath = path.join(tempDir, "_circular_a.xcconfig");
      const bPath = path.join(tempDir, "_circular_b.xcconfig");

      require("fs").writeFileSync(aPath, '#include "_circular_b.xcconfig"\n');
      require("fs").writeFileSync(bPath, '#include "_circular_a.xcconfig"\n');

      try {
        expect(() => xcconfig.parseFile(aPath)).toThrow(/Circular include detected/);
      } finally {
        require("fs").unlinkSync(aPath);
        require("fs").unlinkSync(bPath);
      }
    });
  });

  describe("build", () => {
    it("serializes simple config", () => {
      const config: xcconfig.XCConfig = {
        includes: [],
        buildSettings: [
          { key: "PRODUCT_NAME", value: "MyApp" },
          { key: "SWIFT_VERSION", value: "5.0" },
        ],
      };

      const output = xcconfig.build(config);

      expect(output).toBe("PRODUCT_NAME = MyApp\nSWIFT_VERSION = 5.0\n");
    });

    it("serializes includes", () => {
      const config: xcconfig.XCConfig = {
        includes: [
          {
            include: { path: "Base.xcconfig", optional: false },
            resolvedPath: "Base.xcconfig",
          },
          {
            include: { path: "Optional.xcconfig", optional: true },
            resolvedPath: "Optional.xcconfig",
          },
        ],
        buildSettings: [{ key: "PRODUCT_NAME", value: "MyApp" }],
      };

      const output = xcconfig.build(config);

      expect(output).toContain('#include "Base.xcconfig"');
      expect(output).toContain('#include? "Optional.xcconfig"');
      expect(output).toContain("PRODUCT_NAME = MyApp");
    });

    it("serializes conditional settings", () => {
      const config: xcconfig.XCConfig = {
        includes: [],
        buildSettings: [
          {
            key: "OTHER_LDFLAGS",
            value: "-framework UIKit",
            conditions: [{ sdk: "iphoneos*" }],
          },
          {
            key: "LIBRARY_SEARCH_PATHS",
            value: "/usr/lib",
            conditions: [{ sdk: "iphoneos*" }, { arch: "arm64" }],
          },
        ],
      };

      const output = xcconfig.build(config);

      expect(output).toContain("OTHER_LDFLAGS[sdk=iphoneos*] = -framework UIKit");
      expect(output).toContain(
        "LIBRARY_SEARCH_PATHS[sdk=iphoneos*][arch=arm64] = /usr/lib"
      );
    });

    it("round-trips simple config", () => {
      const original = `PRODUCT_NAME = MyApp
SWIFT_VERSION = 5.0
`;

      const parsed = xcconfig.parse(original);
      const output = xcconfig.build(parsed);

      expect(output).toBe(original);
    });

    it("round-trips conditional config", () => {
      const original = `OTHER_LDFLAGS[sdk=iphoneos*] = -framework UIKit
ARCHS[arch=arm64] = arm64
`;

      const parsed = xcconfig.parse(original);
      const output = xcconfig.build(parsed);

      expect(output).toBe(original);
    });
  });

  describe("flattenBuildSettings", () => {
    it("merges includes in order", () => {
      const config = xcconfig.parseFile(path.join(fixturesDir, "Children.xcconfig"));
      const settings = xcconfig.flattenBuildSettings(config);

      // Base setting from Base.xcconfig
      expect(settings["BASE_SETTING"]).toBe("base_value");

      // Parent setting from Parent.xcconfig
      expect(settings["PARENT_SETTING"]).toBe("parent_value");

      // Child setting from Children.xcconfig
      expect(settings["CHILD_SETTING"]).toBe("child_value");

      // Overridden setting should be from child (last wins)
      expect(settings["OVERRIDDEN_SETTING"]).toBe("from_child");
    });

    it("handles $(inherited)", () => {
      const config = xcconfig.parseFile(path.join(fixturesDir, "Children.xcconfig"));
      const settings = xcconfig.flattenBuildSettings(config);

      // INHERITED_SETTING should combine parent and child values
      expect(settings["INHERITED_SETTING"]).toBe("parent_part child_part");
    });

    it("filters by SDK condition", () => {
      const config = xcconfig.parseFile(path.join(fixturesDir, "conditional.xcconfig"));

      const iosSettings = xcconfig.flattenBuildSettings(config, {
        sdk: "iphoneos",
      });
      expect(iosSettings["OTHER_LDFLAGS"]).toBe("-framework UIKit");

      const macSettings = xcconfig.flattenBuildSettings(config, {
        sdk: "macosx",
      });
      expect(macSettings["OTHER_LDFLAGS"]).toBe("-framework AppKit");
    });

    it("filters by arch condition", () => {
      const config = xcconfig.parseFile(path.join(fixturesDir, "conditional.xcconfig"));

      const arm64Settings = xcconfig.flattenBuildSettings(config, {
        arch: "arm64",
      });
      expect(arm64Settings["ARCHS"]).toBe("arm64");

      const x64Settings = xcconfig.flattenBuildSettings(config, {
        arch: "x86_64",
      });
      expect(x64Settings["ARCHS"]).toBe("x86_64");
    });

    it("filters by config condition", () => {
      const config = xcconfig.parseFile(path.join(fixturesDir, "conditional.xcconfig"));

      const debugSettings = xcconfig.flattenBuildSettings(config, {
        config: "Debug",
      });
      expect(debugSettings["DEBUG_INFORMATION_FORMAT"]).toBe("dwarf");

      const releaseSettings = xcconfig.flattenBuildSettings(config, {
        config: "Release",
      });
      expect(releaseSettings["DEBUG_INFORMATION_FORMAT"]).toBe("dwarf-with-dsym");
    });

    it("handles wildcard matching", () => {
      const config = xcconfig.parseFile(path.join(fixturesDir, "conditional.xcconfig"));

      // iphoneos should match iphoneos* pattern
      const settings = xcconfig.flattenBuildSettings(config, {
        sdk: "iphoneos17.0",
      });
      expect(settings["OTHER_LDFLAGS"]).toBe("-framework UIKit");
    });

    it("handles combined conditions", () => {
      const config = xcconfig.parseFile(path.join(fixturesDir, "conditional.xcconfig"));

      const settings = xcconfig.flattenBuildSettings(config, {
        sdk: "iphoneos",
        arch: "arm64",
      });

      // $(inherited) is replaced with empty string since there's no prior value
      expect(settings["LIBRARY_SEARCH_PATHS"]).toBe(" /usr/lib/arm64");
    });
  });
});
