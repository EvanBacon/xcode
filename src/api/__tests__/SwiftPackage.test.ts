import path from "path";

import {
  XcodeProject,
  XCLocalSwiftPackageReference,
  XCRemoteSwiftPackageReference,
  XCSwiftPackageProductDependency,
  PBXNativeTarget,
} from "..";
import { PBXBuildFile } from "../PBXBuildFile";
import { loadFixture, expectRoundTrip } from "./test-utils";

const SPM_FIXTURE = path.join(
  __dirname,
  "../../json/__tests__/fixtures/006-spm.pbxproj"
);

const originalConsoleWarn = console.warn;
beforeEach(() => {
  console.warn = jest.fn();
});
afterAll(() => {
  console.warn = originalConsoleWarn;
});

describe("XCLocalSwiftPackageReference", () => {
  describe("create", () => {
    it("creates with relativePath", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);

      const ref = XCLocalSwiftPackageReference.create(xcproj, {
        relativePath: "../MyLocalPackage",
      });

      expect(ref.props.relativePath).toBe("../MyLocalPackage");
      expect(ref.isa).toBe("XCLocalSwiftPackageReference");
    });

    it("creates with nested relativePath", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);

      const ref = XCLocalSwiftPackageReference.create(xcproj, {
        relativePath: "Packages/MyLocalPackage",
      });

      expect(ref.props.relativePath).toBe("Packages/MyLocalPackage");
    });
  });

  describe("getDisplayName", () => {
    it("returns relativePath as display name", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);

      const ref = XCLocalSwiftPackageReference.create(xcproj, {
        relativePath: "../MyLocalPackage",
      });

      expect(ref.getDisplayName()).toBe("../MyLocalPackage");
    });
  });

  describe("is", () => {
    it("returns true for XCLocalSwiftPackageReference", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);

      const ref = XCLocalSwiftPackageReference.create(xcproj, {
        relativePath: "../MyLocalPackage",
      });

      expect(XCLocalSwiftPackageReference.is(ref)).toBe(true);
      expect(XCRemoteSwiftPackageReference.is(ref)).toBe(false);
      expect(XCSwiftPackageProductDependency.is(ref)).toBe(false);
    });
  });
});

describe("XCRemoteSwiftPackageReference", () => {
  describe("parsing from fixture", () => {
    it("parses existing remote package reference", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);

      const ref = xcproj.getObject(
        "AC9C55BC2BD9246500041977"
      ) as XCRemoteSwiftPackageReference;

      expect(ref.isa).toBe("XCRemoteSwiftPackageReference");
      expect(ref.props.repositoryURL).toBe(
        "https://github.com/supabase/supabase-swift"
      );
      expect(ref.props.requirement).toEqual({
        kind: "upToNextMajorVersion",
        minimumVersion: "2.5.1",
      });
    });

    it("should be referenced by PBXProject.packageReferences", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);
      const project = xcproj.rootObject;

      const packageReferences = project.props.packageReferences;
      expect(packageReferences).toBeDefined();
      expect(packageReferences!.length).toBeGreaterThan(0);

      const supabaseRef = packageReferences!.find(
        (ref) => ref.uuid === "AC9C55BC2BD9246500041977"
      );
      expect(supabaseRef).toBeDefined();
    });
  });

  describe("create", () => {
    it("creates with upToNextMajorVersion requirement", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);

      const ref = XCRemoteSwiftPackageReference.create(xcproj, {
        repositoryURL: "https://github.com/example/package",
        requirement: {
          kind: "upToNextMajorVersion",
          minimumVersion: "1.0.0",
        },
      });

      expect(ref.props.repositoryURL).toBe("https://github.com/example/package");
      expect(ref.props.requirement).toEqual({
        kind: "upToNextMajorVersion",
        minimumVersion: "1.0.0",
      });
    });

    it("creates with upToNextMinorVersion requirement", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);

      const ref = XCRemoteSwiftPackageReference.create(xcproj, {
        repositoryURL: "https://github.com/example/package",
        requirement: {
          kind: "upToNextMinorVersion",
          minimumVersion: "1.2.0",
        },
      });

      expect(ref.props.requirement).toEqual({
        kind: "upToNextMinorVersion",
        minimumVersion: "1.2.0",
      });
    });

    it("creates with exactVersion requirement", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);

      const ref = XCRemoteSwiftPackageReference.create(xcproj, {
        repositoryURL: "https://github.com/example/package",
        requirement: {
          kind: "exactVersion",
          version: "2.3.4",
        },
      });

      expect(ref.props.requirement).toEqual({
        kind: "exactVersion",
        version: "2.3.4",
      });
    });

    it("creates with versionRange requirement", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);

      const ref = XCRemoteSwiftPackageReference.create(xcproj, {
        repositoryURL: "https://github.com/example/package",
        requirement: {
          kind: "versionRange",
          minimumVersion: "1.0.0",
          maximumVersion: "2.0.0",
        },
      });

      expect(ref.props.requirement).toEqual({
        kind: "versionRange",
        minimumVersion: "1.0.0",
        maximumVersion: "2.0.0",
      });
    });

    it("creates with branch requirement", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);

      const ref = XCRemoteSwiftPackageReference.create(xcproj, {
        repositoryURL: "https://github.com/example/package",
        requirement: {
          kind: "branch",
          branch: "main",
        },
      });

      expect(ref.props.requirement).toEqual({
        kind: "branch",
        branch: "main",
      });
    });

    it("creates with revision requirement", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);

      const ref = XCRemoteSwiftPackageReference.create(xcproj, {
        repositoryURL: "https://github.com/example/package",
        requirement: {
          kind: "revision",
          revision: "abc123def456",
        },
      });

      expect(ref.props.requirement).toEqual({
        kind: "revision",
        revision: "abc123def456",
      });
    });

    it("creates without requirement", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);

      const ref = XCRemoteSwiftPackageReference.create(xcproj, {
        repositoryURL: "https://github.com/example/package",
      });

      expect(ref.props.repositoryURL).toBe("https://github.com/example/package");
      expect(ref.props.requirement).toBeUndefined();
    });
  });

  describe("getDisplayName", () => {
    it("returns repositoryURL as display name", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);

      const ref = XCRemoteSwiftPackageReference.create(xcproj, {
        repositoryURL: "https://github.com/example/package",
      });

      expect(ref.getDisplayName()).toBe("https://github.com/example/package");
    });
  });

  describe("is", () => {
    it("returns true for XCRemoteSwiftPackageReference", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);

      const ref = XCRemoteSwiftPackageReference.create(xcproj, {
        repositoryURL: "https://github.com/example/package",
      });

      expect(XCRemoteSwiftPackageReference.is(ref)).toBe(true);
      expect(XCLocalSwiftPackageReference.is(ref)).toBe(false);
      expect(XCSwiftPackageProductDependency.is(ref)).toBe(false);
    });
  });
});

describe("XCSwiftPackageProductDependency", () => {
  describe("parsing from fixture", () => {
    it("parses existing product dependency", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);

      const dep = xcproj.getObject(
        "AC9C55BD2BD9246500041977"
      ) as XCSwiftPackageProductDependency;

      expect(dep.isa).toBe("XCSwiftPackageProductDependency");
      expect(dep.props.productName).toBe("Supabase");
      // Package reference should be inflated
      expect(dep.props.package).toBeDefined();
    });

    it("has package reference linked to remote package", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);

      const dep = xcproj.getObject(
        "AC9C55BD2BD9246500041977"
      ) as XCSwiftPackageProductDependency;

      const packageRef = dep.props.package as XCRemoteSwiftPackageReference;
      expect(packageRef.props.repositoryURL).toBe(
        "https://github.com/supabase/supabase-swift"
      );
    });

    it("should be referenced by PBXBuildFile via productRef", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);

      const buildFile = xcproj.getObject(
        "AC9C55BE2BD9246500041977"
      ) as PBXBuildFile;

      expect(buildFile).toBeDefined();
      expect(buildFile.isa).toBe("PBXBuildFile");
      expect(buildFile.props.productRef).toBeDefined();
      expect(buildFile.props.productRef!.uuid).toBe("AC9C55BD2BD9246500041977");
    });

    it("should be in target packageProductDependencies", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);

      const watchTarget = xcproj.getObject(
        "DCA0157385AE428CB5B4F71F"
      ) as PBXNativeTarget;

      expect(watchTarget).toBeDefined();
      expect(watchTarget.props.packageProductDependencies).toBeDefined();
      expect(watchTarget.props.packageProductDependencies!.length).toBeGreaterThan(0);

      const supabaseDep = watchTarget.props.packageProductDependencies!.find(
        (dep) => dep.uuid === "AC9C55BD2BD9246500041977"
      );
      expect(supabaseDep).toBeDefined();
    });
  });

  describe("create", () => {
    it("creates with remote package reference", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);

      const packageRef = XCRemoteSwiftPackageReference.create(xcproj, {
        repositoryURL: "https://github.com/example/package",
        requirement: {
          kind: "upToNextMajorVersion",
          minimumVersion: "1.0.0",
        },
      });

      const dep = XCSwiftPackageProductDependency.create(xcproj, {
        productName: "ExamplePackage",
        package: packageRef,
      });

      expect(dep.props.productName).toBe("ExamplePackage");
      expect(dep.props.package).toBe(packageRef);
    });

    it("creates with local package reference", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);

      const packageRef = XCLocalSwiftPackageReference.create(xcproj, {
        relativePath: "../MyLocalPackage",
      });

      const dep = XCSwiftPackageProductDependency.create(xcproj, {
        productName: "MyLocalPackage",
        package: packageRef,
      });

      expect(dep.props.productName).toBe("MyLocalPackage");
      expect(dep.props.package).toBe(packageRef);
    });

    it("creates without package reference (for local packages in some cases)", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);

      const dep = XCSwiftPackageProductDependency.create(xcproj, {
        productName: "SomeProduct",
      });

      expect(dep.props.productName).toBe("SomeProduct");
      expect(dep.props.package).toBeUndefined();
    });
  });

  describe("getDisplayName", () => {
    it("returns productName as display name", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);

      const dep = XCSwiftPackageProductDependency.create(xcproj, {
        productName: "MyPackage",
      });

      expect(dep.getDisplayName()).toBe("MyPackage");
    });
  });

  describe("is", () => {
    it("returns true for XCSwiftPackageProductDependency", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);

      const dep = XCSwiftPackageProductDependency.create(xcproj, {
        productName: "MyPackage",
      });

      expect(XCSwiftPackageProductDependency.is(dep)).toBe(true);
      expect(XCRemoteSwiftPackageReference.is(dep)).toBe(false);
      expect(XCLocalSwiftPackageReference.is(dep)).toBe(false);
    });
  });
});

describe("round-trip serialization", () => {
  it("preserves XCRemoteSwiftPackageReference through toJSON", () => {
    const xcproj = XcodeProject.open(SPM_FIXTURE);

    const ref = XCRemoteSwiftPackageReference.create(xcproj, {
      repositoryURL: "https://github.com/example/package",
      requirement: {
        kind: "upToNextMajorVersion",
        minimumVersion: "1.0.0",
      },
    });

    const json = ref.toJSON();

    expect(json.isa).toBe("XCRemoteSwiftPackageReference");
    expect(json.repositoryURL).toBe("https://github.com/example/package");
    expect(json.requirement).toEqual({
      kind: "upToNextMajorVersion",
      minimumVersion: "1.0.0",
    });
  });

  it("preserves XCLocalSwiftPackageReference through toJSON", () => {
    const xcproj = XcodeProject.open(SPM_FIXTURE);

    const ref = XCLocalSwiftPackageReference.create(xcproj, {
      relativePath: "../MyLocalPackage",
    });

    const json = ref.toJSON();

    expect(json.isa).toBe("XCLocalSwiftPackageReference");
    expect(json.relativePath).toBe("../MyLocalPackage");
  });

  it("preserves XCSwiftPackageProductDependency through toJSON", () => {
    const xcproj = XcodeProject.open(SPM_FIXTURE);

    const packageRef = XCRemoteSwiftPackageReference.create(xcproj, {
      repositoryURL: "https://github.com/example/package",
    });

    const dep = XCSwiftPackageProductDependency.create(xcproj, {
      productName: "ExamplePackage",
      package: packageRef,
    });

    const json = dep.toJSON();

    expect(json.isa).toBe("XCSwiftPackageProductDependency");
    expect(json.productName).toBe("ExamplePackage");
    // Package should be deflated to UUID
    expect(typeof json.package).toBe("string");
    expect(json.package).toBe(packageRef.uuid);
  });

  it("should round-trip full project correctly", () => {
    const xcproj = loadFixture("006-spm.pbxproj");
    expectRoundTrip(xcproj);
  });
});

describe("SPM integration", () => {
  it("should maintain SPM references through round-trip", () => {
    const xcproj = loadFixture("006-spm.pbxproj");

    const originalPackageRef = xcproj.getObject(
      "AC9C55BC2BD9246500041977"
    ) as XCRemoteSwiftPackageReference;
    const originalUrl = originalPackageRef.props.repositoryURL;

    expectRoundTrip(xcproj);

    const packageRefAfter = xcproj.getObject(
      "AC9C55BC2BD9246500041977"
    ) as XCRemoteSwiftPackageReference;
    expect(packageRefAfter.props.repositoryURL).toBe(originalUrl);
  });

  it("should find all SPM-related objects", () => {
    const xcproj = XcodeProject.open(SPM_FIXTURE);

    const remotePackages: XCRemoteSwiftPackageReference[] = [];
    const productDeps: XCSwiftPackageProductDependency[] = [];
    const buildFilesWithProductRef: PBXBuildFile[] = [];

    for (const obj of xcproj.values()) {
      if (XCRemoteSwiftPackageReference.is(obj)) {
        remotePackages.push(obj);
      } else if (XCSwiftPackageProductDependency.is(obj)) {
        productDeps.push(obj);
      } else if (obj.isa === "PBXBuildFile") {
        const buildFile = obj as PBXBuildFile;
        if (buildFile.props.productRef) {
          buildFilesWithProductRef.push(buildFile);
        }
      }
    }

    expect(remotePackages.length).toBeGreaterThan(0);
    expect(productDeps.length).toBeGreaterThan(0);
    expect(buildFilesWithProductRef.length).toBeGreaterThan(0);
  });

  it("should have valid package reference chain", () => {
    const xcproj = XcodeProject.open(SPM_FIXTURE);
    const project = xcproj.rootObject;

    expect(project.props.packageReferences).toBeDefined();

    for (const packageRef of project.props.packageReferences!) {
      expect(
        XCRemoteSwiftPackageReference.is(packageRef) ||
          XCLocalSwiftPackageReference.is(packageRef)
      ).toBe(true);
    }
  });

  it("should serialize SPM objects correctly in full project", () => {
    const xcproj = XcodeProject.open(SPM_FIXTURE);
    const json = xcproj.toJSON();

    expect(json.objects["AC9C55BC2BD9246500041977"]).toBeDefined();
    expect(json.objects["AC9C55BC2BD9246500041977"].isa).toBe(
      "XCRemoteSwiftPackageReference"
    );

    expect(json.objects["AC9C55BD2BD9246500041977"]).toBeDefined();
    expect(json.objects["AC9C55BD2BD9246500041977"].isa).toBe(
      "XCSwiftPackageProductDependency"
    );
  });
});
