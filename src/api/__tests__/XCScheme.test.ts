import path from "path";
import { mkdtempSync, writeFileSync, mkdirSync, existsSync, readFileSync, rmSync } from "fs";
import os from "os";

import { XcodeProject } from "../XcodeProject";
import { XCScheme, createBuildableReference } from "../XCScheme";
import * as scheme from "../../scheme";

// Use the existing pbxproj fixture
const pbxprojFixturePath = path.join(
  __dirname,
  "../../json/__tests__/fixtures/project-rni.pbxproj"
);

describe("XCScheme", () => {
  describe("static methods", () => {
    it("creates an empty scheme", () => {
      const xcscheme = XCScheme.create("MyScheme");

      expect(xcscheme.name).toBe("MyScheme");
      expect(xcscheme.props.version).toBe("1.7");
      expect(xcscheme.props.buildAction).toBeDefined();
      expect(xcscheme.props.testAction).toBeDefined();
      expect(xcscheme.props.launchAction).toBeDefined();
      expect(xcscheme.props.profileAction).toBeDefined();
      expect(xcscheme.props.analyzeAction).toBeDefined();
      expect(xcscheme.props.archiveAction).toBeDefined();
    });

    it("creates a scheme with custom props", () => {
      const xcscheme = XCScheme.create("CustomScheme", {
        version: "2.0",
        buildAction: {
          parallelizeBuildables: false,
        },
      });

      expect(xcscheme.props.version).toBe("2.0");
      expect(xcscheme.props.buildAction?.parallelizeBuildables).toBe(false);
    });

    it("opens a scheme file", () => {
      const fixturePath = path.join(
        __dirname,
        "../../scheme/__tests__/fixtures/iOS.xcscheme"
      );
      const xcscheme = XCScheme.open(fixturePath);

      expect(xcscheme.name).toBe("iOS");
      expect(xcscheme.props.version).toBe("2.0");
      expect(xcscheme.filePath).toBe(fixturePath);
    });
  });

  describe("instance methods", () => {
    it("adds a build target", () => {
      const xcscheme = XCScheme.create("TestScheme");
      const ref = {
        buildableIdentifier: "primary",
        blueprintIdentifier: "ABC123",
        buildableName: "App.app",
        blueprintName: "App",
        referencedContainer: "container:Project.xcodeproj",
      };

      xcscheme.addBuildTarget(ref);

      expect(xcscheme.props.buildAction?.entries).toHaveLength(1);
      expect(xcscheme.props.buildAction?.entries![0].buildableReference).toEqual(
        ref
      );
      expect(xcscheme.props.buildAction?.entries![0].buildForRunning).toBe(true);
      expect(xcscheme.props.buildAction?.entries![0].buildForTesting).toBe(true);
    });

    it("adds a build target with custom build for settings", () => {
      const xcscheme = XCScheme.create("TestScheme");
      const ref = {
        buildableIdentifier: "primary",
        blueprintIdentifier: "ABC123",
        buildableName: "Tests.xctest",
        blueprintName: "Tests",
        referencedContainer: "container:Project.xcodeproj",
      };

      xcscheme.addBuildTarget(ref, {
        running: false,
        testing: true,
        profiling: false,
        archiving: false,
        analyzing: false,
      });

      expect(xcscheme.props.buildAction?.entries![0].buildForRunning).toBe(
        false
      );
      expect(xcscheme.props.buildAction?.entries![0].buildForTesting).toBe(true);
    });

    it("does not duplicate build targets", () => {
      const xcscheme = XCScheme.create("TestScheme");
      const ref = {
        buildableIdentifier: "primary",
        blueprintIdentifier: "ABC123",
        buildableName: "App.app",
        blueprintName: "App",
        referencedContainer: "container:Project.xcodeproj",
      };

      xcscheme.addBuildTarget(ref);
      xcscheme.addBuildTarget(ref);

      expect(xcscheme.props.buildAction?.entries).toHaveLength(1);
    });

    it("adds a test target", () => {
      const xcscheme = XCScheme.create("TestScheme");
      const ref = {
        buildableIdentifier: "primary",
        blueprintIdentifier: "DEF456",
        buildableName: "Tests.xctest",
        blueprintName: "Tests",
        referencedContainer: "container:Project.xcodeproj",
      };

      xcscheme.addTestTarget(ref);

      expect(xcscheme.props.testAction?.testables).toHaveLength(1);
      expect(
        xcscheme.props.testAction?.testables![0].buildableReference
      ).toEqual(ref);
      expect(xcscheme.props.testAction?.testables![0].skipped).toBe(false);
    });

    it("sets the launch target", () => {
      const xcscheme = XCScheme.create("TestScheme");
      const ref = {
        buildableIdentifier: "primary",
        blueprintIdentifier: "ABC123",
        buildableName: "App.app",
        blueprintName: "App",
        referencedContainer: "container:Project.xcodeproj",
      };

      xcscheme.setLaunchTarget(ref);

      expect(
        xcscheme.props.launchAction?.buildableProductRunnable?.buildableReference
      ).toEqual(ref);
      expect(
        xcscheme.props.profileAction?.buildableProductRunnable?.buildableReference
      ).toEqual(ref);
    });

    it("sets environment variables", () => {
      const xcscheme = XCScheme.create("TestScheme");

      xcscheme.setLaunchEnvironmentVariable("API_URL", "https://api.example.com");
      xcscheme.setLaunchEnvironmentVariable("DEBUG", "1", false);

      expect(xcscheme.props.launchAction?.environmentVariables).toHaveLength(2);
      expect(xcscheme.props.launchAction?.environmentVariables![0]).toEqual({
        key: "API_URL",
        value: "https://api.example.com",
        isEnabled: true,
      });
      expect(xcscheme.props.launchAction?.environmentVariables![1]).toEqual({
        key: "DEBUG",
        value: "1",
        isEnabled: false,
      });
    });

    it("updates existing environment variables", () => {
      const xcscheme = XCScheme.create("TestScheme");

      xcscheme.setLaunchEnvironmentVariable("API_URL", "https://old.com");
      xcscheme.setLaunchEnvironmentVariable("API_URL", "https://new.com");

      expect(xcscheme.props.launchAction?.environmentVariables).toHaveLength(1);
      expect(xcscheme.props.launchAction?.environmentVariables![0].value).toBe(
        "https://new.com"
      );
    });

    it("adds launch arguments", () => {
      const xcscheme = XCScheme.create("TestScheme");

      xcscheme.addLaunchArgument("-verbose");
      xcscheme.addLaunchArgument("-debug", false);

      expect(xcscheme.props.launchAction?.commandLineArguments).toHaveLength(2);
      expect(xcscheme.props.launchAction?.commandLineArguments![0]).toEqual({
        argument: "-verbose",
        isEnabled: true,
      });
    });

    it("gets buildable reference by UUID", () => {
      const xcscheme = XCScheme.create("TestScheme");
      const ref = {
        buildableIdentifier: "primary",
        blueprintIdentifier: "ABC123",
        buildableName: "App.app",
        blueprintName: "App",
        referencedContainer: "container:Project.xcodeproj",
      };

      xcscheme.addBuildTarget(ref);

      expect(xcscheme.getBuildableReference("ABC123")).toEqual(ref);
      expect(xcscheme.getBuildableReference("nonexistent")).toBeNull();
    });

    it("converts to XML", () => {
      const xcscheme = XCScheme.create("TestScheme");
      const xml = xcscheme.toXML();

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain("<Scheme");
      expect(xml).toContain('version = "1.7"');
    });
  });

  describe("file operations", () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = mkdtempSync(path.join(os.tmpdir(), "xcscheme-test-"));
    });

    afterEach(() => {
      if (existsSync(tmpDir)) {
        rmSync(tmpDir, { recursive: true });
      }
    });

    it("saves a scheme to disk", () => {
      const xcscheme = XCScheme.create("SaveTest");
      const savePath = path.join(tmpDir, "SaveTest.xcscheme");

      xcscheme.save(savePath);

      expect(existsSync(savePath)).toBe(true);
      expect(xcscheme.filePath).toBe(savePath);

      const content = readFileSync(savePath, "utf-8");
      expect(content).toContain("<Scheme");
    });

    it("creates directories when saving", () => {
      const xcscheme = XCScheme.create("DeepSave");
      const savePath = path.join(
        tmpDir,
        "deeply",
        "nested",
        "dir",
        "DeepSave.xcscheme"
      );

      xcscheme.save(savePath);

      expect(existsSync(savePath)).toBe(true);
    });
  });
});

describe("XcodeProject scheme methods", () => {
  let tmpDir: string;
  let projectDir: string;
  let project: XcodeProject;

  beforeEach(() => {
    // Create a temporary directory structure mimicking an .xcodeproj
    tmpDir = mkdtempSync(path.join(os.tmpdir(), "xcode-project-test-"));
    projectDir = path.join(tmpDir, "Test.xcodeproj");
    mkdirSync(projectDir, { recursive: true });

    // Copy the pbxproj fixture
    const pbxprojContent = readFileSync(pbxprojFixturePath, "utf-8");
    writeFileSync(path.join(projectDir, "project.pbxproj"), pbxprojContent);

    // Create shared schemes directory with a test scheme
    const sharedSchemesDir = path.join(
      projectDir,
      "xcshareddata",
      "xcschemes"
    );
    mkdirSync(sharedSchemesDir, { recursive: true });

    const testScheme = XCScheme.create("TestScheme");
    testScheme.save(path.join(sharedSchemesDir, "TestScheme.xcscheme"));

    // Open the project
    project = XcodeProject.open(path.join(projectDir, "project.pbxproj"));
  });

  afterEach(() => {
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true });
    }
  });

  it("gets shared schemes directory", () => {
    const dir = project.getSharedSchemesDir();
    expect(dir).toContain("xcshareddata");
    expect(dir).toContain("xcschemes");
  });

  it("gets user schemes directory", () => {
    const dir = project.getUserSchemesDir("testuser");
    expect(dir).toContain("xcuserdata");
    expect(dir).toContain("testuser.xcuserdatad");
    expect(dir).toContain("xcschemes");
  });

  it("gets all schemes", () => {
    const schemes = project.getSchemes();
    expect(schemes.length).toBeGreaterThanOrEqual(1);
    expect(schemes.some((s) => s.name === "TestScheme")).toBe(true);
  });

  it("gets a scheme by name", () => {
    const s = project.getScheme("TestScheme");
    expect(s).not.toBeNull();
    expect(s!.name).toBe("TestScheme");
  });

  it("returns null for non-existent scheme", () => {
    const s = project.getScheme("NonExistent");
    expect(s).toBeNull();
  });

  it("saves a scheme", () => {
    const newScheme = XCScheme.create("NewScheme");
    project.saveScheme(newScheme);

    const savedPath = path.join(
      project.getSharedSchemesDir(),
      "NewScheme.xcscheme"
    );
    expect(existsSync(savedPath)).toBe(true);

    // Verify we can get it back
    const retrieved = project.getScheme("NewScheme");
    expect(retrieved).not.toBeNull();
    expect(retrieved!.name).toBe("NewScheme");
  });

  it("saves a user scheme", () => {
    const userScheme = XCScheme.create("UserScheme");
    project.saveScheme(userScheme, { shared: false, username: "developer" });

    const savedPath = path.join(
      project.getUserSchemesDir("developer"),
      "UserScheme.xcscheme"
    );
    expect(existsSync(savedPath)).toBe(true);
  });

  it("deletes a scheme", () => {
    // First verify it exists
    expect(project.getScheme("TestScheme")).not.toBeNull();

    project.deleteScheme("TestScheme");

    expect(project.getScheme("TestScheme")).toBeNull();
  });

  it("creates a scheme for a target", () => {
    const targets = project.rootObject.props.targets;
    const mainTarget = targets.find((t) => "productType" in t.props && t.props.productType === "com.apple.product-type.application") as import("../PBXNativeTarget").PBXNativeTarget | undefined;
    expect(mainTarget).toBeDefined();

    const targetScheme = project.createSchemeForTarget(mainTarget!);

    expect(targetScheme.name).toBe(mainTarget!.props.name);
    expect(targetScheme.props.buildAction?.entries).toHaveLength(1);
    expect(
      targetScheme.props.buildAction?.entries![0].buildableReference
        ?.blueprintIdentifier
    ).toBe(mainTarget!.uuid);
    expect(
      targetScheme.props.launchAction?.buildableProductRunnable?.buildableReference
    ).toBeDefined();
  });
});

describe("createBuildableReference", () => {
  it("creates a buildable reference from a target", () => {
    const projectPath = path.join(
      __dirname,
      "../../json/__tests__/fixtures/project-rni.pbxproj"
    );
    const project = XcodeProject.open(projectPath);
    const targets = project.rootObject.props.targets;
    const mainTarget = targets.find(
      (t) => "productType" in t.props && t.props.productType === "com.apple.product-type.application"
    ) as import("../PBXNativeTarget").PBXNativeTarget | undefined;
    expect(mainTarget).toBeDefined();

    const ref = createBuildableReference(mainTarget!, "container:Test.xcodeproj");

    expect(ref.buildableIdentifier).toBe("primary");
    expect(ref.blueprintIdentifier).toBe(mainTarget!.uuid);
    expect(ref.blueprintName).toBe(mainTarget!.props.name);
    expect(ref.referencedContainer).toBe("container:Test.xcodeproj");
  });
});
