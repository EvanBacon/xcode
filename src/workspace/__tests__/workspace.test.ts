import { readFileSync } from "fs";
import path from "path";

import { parse, build } from "../index";
import type { XCWorkspace } from "../types";

const fixturesDir = path.join(__dirname, "fixtures");

function readFixture(name: string): string {
  return readFileSync(path.join(fixturesDir, name), "utf-8");
}

describe("workspace parser", () => {
  describe("parse", () => {
    it("parses simple.xcworkspacedata", () => {
      const xml = readFixture("simple.xcworkspacedata");
      const workspace = parse(xml);

      expect(workspace.version).toBe("1.0");
      expect(workspace.fileRefs).toHaveLength(1);
      expect(workspace.fileRefs![0].location).toBe("group:App.xcodeproj");
    });

    it("parses cocoapods.xcworkspacedata with multiple projects", () => {
      const xml = readFixture("cocoapods.xcworkspacedata");
      const workspace = parse(xml);

      expect(workspace.version).toBe("1.0");
      expect(workspace.fileRefs).toHaveLength(2);
      expect(workspace.fileRefs![0].location).toBe("group:App.xcodeproj");
      expect(workspace.fileRefs![1].location).toBe("group:Pods/Pods.xcodeproj");
    });

    it("parses self-reference.xcworkspacedata", () => {
      const xml = readFixture("self-reference.xcworkspacedata");
      const workspace = parse(xml);

      expect(workspace.version).toBe("1.0");
      expect(workspace.fileRefs).toHaveLength(1);
      expect(workspace.fileRefs![0].location).toBe("self:");
    });

    it("parses with-groups.xcworkspacedata", () => {
      const xml = readFixture("with-groups.xcworkspacedata");
      const workspace = parse(xml);

      expect(workspace.version).toBe("1.0");
      expect(workspace.fileRefs).toHaveLength(1);
      expect(workspace.fileRefs![0].location).toBe("group:MainApp.xcodeproj");

      expect(workspace.groups).toHaveLength(2);

      // First group - Libraries
      const librariesGroup = workspace.groups![0];
      expect(librariesGroup.location).toBe("group:Libraries");
      expect(librariesGroup.name).toBe("Libraries");
      expect(librariesGroup.fileRefs).toHaveLength(2);
      expect(librariesGroup.fileRefs![0].location).toBe(
        "group:Libraries/LibraryA.xcodeproj"
      );
      expect(librariesGroup.fileRefs![1].location).toBe(
        "group:Libraries/LibraryB.xcodeproj"
      );

      // Second group - Pods
      const podsGroup = workspace.groups![1];
      expect(podsGroup.location).toBe("group:Pods");
      expect(podsGroup.name).toBe("Pods");
      expect(podsGroup.fileRefs).toHaveLength(1);
      expect(podsGroup.fileRefs![0].location).toBe(
        "group:Pods/Pods.xcodeproj"
      );
    });

    it("parses special-characters.xcworkspacedata with escaped XML", () => {
      const xml = readFixture("special-characters.xcworkspacedata");
      const workspace = parse(xml);

      expect(workspace.version).toBe("1.0");
      expect(workspace.fileRefs).toHaveLength(1);
      // The parser should decode the XML entities
      expect(workspace.fileRefs![0].location).toBe(
        "group:My App & Project.xcodeproj"
      );
    });

    it("throws on invalid root element", () => {
      const xml = '<?xml version="1.0"?><NotAWorkspace></NotAWorkspace>';
      expect(() => parse(xml)).toThrow(
        "Invalid xcworkspacedata file: root element must be <Workspace>"
      );
    });
  });

  describe("parsing stability", () => {
    it("produces identical results on multiple parses", () => {
      const xml = readFixture("cocoapods.xcworkspacedata");
      const parses = Array.from({ length: 5 }, () => parse(xml));

      // All parses should be identical
      for (let i = 1; i < parses.length; i++) {
        expect(parses[i]).toEqual(parses[0]);
      }
    });
  });

  describe("build", () => {
    it("builds a basic workspace", () => {
      const workspace: XCWorkspace = {
        version: "1.0",
        fileRefs: [{ location: "group:App.xcodeproj" }],
      };

      const xml = build(workspace);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain("<Workspace");
      expect(xml).toContain('version = "1.0"');
      expect(xml).toContain("<FileRef");
      expect(xml).toContain('location = "group:App.xcodeproj"');
      expect(xml).toContain("</FileRef>");
      expect(xml).toContain("</Workspace>");
    });

    it("builds workspace with multiple file references", () => {
      const workspace: XCWorkspace = {
        version: "1.0",
        fileRefs: [
          { location: "group:App.xcodeproj" },
          { location: "group:Pods/Pods.xcodeproj" },
        ],
      };

      const xml = build(workspace);

      expect(xml).toContain('location = "group:App.xcodeproj"');
      expect(xml).toContain('location = "group:Pods/Pods.xcodeproj"');
    });

    it("builds workspace with groups", () => {
      const workspace: XCWorkspace = {
        version: "1.0",
        fileRefs: [{ location: "group:MainApp.xcodeproj" }],
        groups: [
          {
            location: "group:Libraries",
            name: "Libraries",
            fileRefs: [
              { location: "group:Libraries/LibraryA.xcodeproj" },
            ],
          },
        ],
      };

      const xml = build(workspace);

      expect(xml).toContain("<Group");
      expect(xml).toContain('location = "group:Libraries"');
      expect(xml).toContain('name = "Libraries"');
      expect(xml).toContain('location = "group:Libraries/LibraryA.xcodeproj"');
      expect(xml).toContain("</Group>");
    });

    it("escapes XML special characters", () => {
      const workspace: XCWorkspace = {
        version: "1.0",
        fileRefs: [{ location: "group:My App & Project.xcodeproj" }],
      };

      const xml = build(workspace);

      expect(xml).toContain('location = "group:My App &amp; Project.xcodeproj"');
    });

    it("builds empty workspace", () => {
      const workspace: XCWorkspace = {
        version: "1.0",
      };

      const xml = build(workspace);

      expect(xml).toContain("<Workspace");
      expect(xml).toContain('version = "1.0"');
      expect(xml).toContain("</Workspace>");
    });
  });

  describe("all location types", () => {
    it("parses all-location-types.xcworkspacedata with all location types", () => {
      const xml = readFixture("all-location-types.xcworkspacedata");
      const workspace = parse(xml);

      expect(workspace.version).toBe("1.0");

      // Check groups
      expect(workspace.groups).toHaveLength(2);

      // First group - iOS with group and container refs
      const iosGroup = workspace.groups![0];
      expect(iosGroup.location).toBe("group:iOS");
      expect(iosGroup.name).toBe("iOS");
      expect(iosGroup.fileRefs).toHaveLength(2);
      expect(iosGroup.fileRefs![0].location).toBe(
        "group:../WithoutWorkspace/WithoutWorkspace.xcodeproj"
      );
      expect(iosGroup.fileRefs![1].location).toBe(
        "container:iOS/BuildSettings.xcodeproj"
      );

      // Second group - Schemes (empty)
      const schemesGroup = workspace.groups![1];
      expect(schemesGroup.location).toBe("container:Schemes");
      expect(schemesGroup.name).toBe("Schemes");
      expect(schemesGroup.fileRefs).toBeUndefined();

      // Check file refs with absolute and developer locations
      expect(workspace.fileRefs).toHaveLength(2);
      expect(workspace.fileRefs![0].location).toBe(
        "absolute:/Applications/Xcode.app/Contents/Developer/Applications/Simulator.app"
      );
      expect(workspace.fileRefs![1].location).toBe(
        "developer:Applications/Simulator.app"
      );
    });

    it("builds workspace with all location types", () => {
      const workspace: XCWorkspace = {
        version: "1.0",
        fileRefs: [
          { location: "group:Project.xcodeproj" },
          { location: "container:Other.xcodeproj" },
          { location: "absolute:/path/to/file" },
          { location: "developer:Applications/Simulator.app" },
          { location: "self:" },
        ],
      };

      const xml = build(workspace);

      expect(xml).toContain('location = "group:Project.xcodeproj"');
      expect(xml).toContain('location = "container:Other.xcodeproj"');
      expect(xml).toContain('location = "absolute:/path/to/file"');
      expect(xml).toContain('location = "developer:Applications/Simulator.app"');
      expect(xml).toContain('location = "self:"');
    });
  });

  describe("round-trip", () => {
    const fixtures = [
      "simple.xcworkspacedata",
      "cocoapods.xcworkspacedata",
      "self-reference.xcworkspacedata",
      "with-groups.xcworkspacedata",
      "all-location-types.xcworkspacedata",
    ];

    for (const fixture of fixtures) {
      it(`round-trips ${fixture}`, () => {
        const xml = readFixture(fixture);
        const workspace = parse(xml);
        const rebuilt = build(workspace);
        const reparsed = parse(rebuilt);

        // Deep equality check on the parsed structures
        expect(reparsed).toEqual(workspace);
      });
    }
  });

  describe("equality", () => {
    it("equal workspaces are equal", () => {
      const ws1: XCWorkspace = {
        version: "1.0",
        fileRefs: [{ location: "group:App.xcodeproj" }],
      };
      const ws2: XCWorkspace = {
        version: "1.0",
        fileRefs: [{ location: "group:App.xcodeproj" }],
      };

      expect(ws1).toEqual(ws2);
    });

    it("unequal workspaces are not equal", () => {
      const ws1: XCWorkspace = {
        version: "1.0",
        fileRefs: [{ location: "group:App.xcodeproj" }],
      };
      const ws2: XCWorkspace = {
        version: "1.0",
        fileRefs: [{ location: "group:Other.xcodeproj" }],
      };

      expect(ws1).not.toEqual(ws2);
    });

    it("empty workspaces are equal", () => {
      const ws1: XCWorkspace = { version: "1.0" };
      const ws2: XCWorkspace = { version: "1.0" };

      expect(ws1).toEqual(ws2);
    });

    it("workspaces with different children counts are not equal", () => {
      const ws1: XCWorkspace = {
        version: "1.0",
        fileRefs: [{ location: "group:App.xcodeproj" }],
      };
      const ws2: XCWorkspace = {
        version: "1.0",
        fileRefs: [],
      };

      expect(ws1).not.toEqual(ws2);
    });
  });

  describe("edge cases", () => {
    it("handles workspace without version", () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Workspace>
   <FileRef
      location = "group:App.xcodeproj">
   </FileRef>
</Workspace>`;

      const workspace = parse(xml);
      expect(workspace.version).toBeUndefined();
      expect(workspace.fileRefs).toHaveLength(1);
    });

    it("handles empty workspace", () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Workspace
   version = "1.0">
</Workspace>`;

      const workspace = parse(xml);
      expect(workspace.version).toBe("1.0");
      expect(workspace.fileRefs).toBeUndefined();
      expect(workspace.groups).toBeUndefined();
    });

    it("handles nested groups", () => {
      const workspace: XCWorkspace = {
        version: "1.0",
        groups: [
          {
            location: "group:Outer",
            name: "Outer",
            groups: [
              {
                location: "group:Inner",
                name: "Inner",
                fileRefs: [{ location: "group:Inner/Project.xcodeproj" }],
              },
            ],
          },
        ],
      };

      const xml = build(workspace);
      const reparsed = parse(xml);

      expect(reparsed.groups).toHaveLength(1);
      expect(reparsed.groups![0].groups).toHaveLength(1);
      expect(reparsed.groups![0].groups![0].fileRefs).toHaveLength(1);
    });
  });
});
