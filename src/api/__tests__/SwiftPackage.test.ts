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

describe("PBXProject Swift Package helpers", () => {
  describe("addPackageReference", () => {
    it("adds a remote package reference to packageReferences", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);
      const project = xcproj.rootObject;

      const initialCount = project.props.packageReferences?.length ?? 0;

      const packageRef = XCRemoteSwiftPackageReference.create(xcproj, {
        repositoryURL: "https://github.com/example/new-package",
        requirement: {
          kind: "upToNextMajorVersion",
          minimumVersion: "1.0.0",
        },
      });

      project.addPackageReference(packageRef);

      expect(project.props.packageReferences?.length).toBe(initialCount + 1);
      expect(
        project.props.packageReferences?.find((r) => r.uuid === packageRef.uuid)
      ).toBeDefined();
    });

    it("adds a local package reference to packageReferences", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);
      const project = xcproj.rootObject;

      const initialCount = project.props.packageReferences?.length ?? 0;

      const packageRef = XCLocalSwiftPackageReference.create(xcproj, {
        relativePath: "../LocalPackage",
      });

      project.addPackageReference(packageRef);

      expect(project.props.packageReferences?.length).toBe(initialCount + 1);
      expect(
        project.props.packageReferences?.find((r) => r.uuid === packageRef.uuid)
      ).toBeDefined();
    });

    it("does not add duplicate package references", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);
      const project = xcproj.rootObject;

      const packageRef = XCRemoteSwiftPackageReference.create(xcproj, {
        repositoryURL: "https://github.com/example/package",
      });

      project.addPackageReference(packageRef);
      const countAfterFirst = project.props.packageReferences?.length ?? 0;

      project.addPackageReference(packageRef);
      expect(project.props.packageReferences?.length).toBe(countAfterFirst);
    });
  });

  describe("getPackageReference", () => {
    it("finds remote package by repositoryURL", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);
      const project = xcproj.rootObject;

      const found = project.getPackageReference(
        "https://github.com/supabase/supabase-swift"
      );

      expect(found).toBeDefined();
      expect(XCRemoteSwiftPackageReference.is(found)).toBe(true);
    });

    it("returns null for non-existent package", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);
      const project = xcproj.rootObject;

      const found = project.getPackageReference(
        "https://github.com/nonexistent/package"
      );

      expect(found).toBeNull();
    });

    it("finds local package by relativePath", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);
      const project = xcproj.rootObject;

      const packageRef = XCLocalSwiftPackageReference.create(xcproj, {
        relativePath: "../MyLocalPackage",
      });
      project.addPackageReference(packageRef);

      const found = project.getPackageReference("../MyLocalPackage");

      expect(found).toBeDefined();
      expect(XCLocalSwiftPackageReference.is(found)).toBe(true);
    });
  });

  describe("addRemoteSwiftPackage", () => {
    it("creates and adds a remote package in one call", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);
      const project = xcproj.rootObject;

      const packageRef = project.addRemoteSwiftPackage({
        repositoryURL: "https://github.com/example/package",
        requirement: {
          kind: "upToNextMajorVersion",
          minimumVersion: "2.0.0",
        },
      });

      expect(packageRef.props.repositoryURL).toBe(
        "https://github.com/example/package"
      );
      expect(
        project.props.packageReferences?.find((r) => r.uuid === packageRef.uuid)
      ).toBeDefined();
    });

    it("returns existing package if already added", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);
      const project = xcproj.rootObject;

      const first = project.addRemoteSwiftPackage({
        repositoryURL: "https://github.com/example/package",
      });

      const second = project.addRemoteSwiftPackage({
        repositoryURL: "https://github.com/example/package",
      });

      expect(first.uuid).toBe(second.uuid);
    });
  });

  describe("addLocalSwiftPackage", () => {
    it("creates and adds a local package in one call", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);
      const project = xcproj.rootObject;

      const packageRef = project.addLocalSwiftPackage({
        relativePath: "../MyLocalPackage",
      });

      expect(packageRef.props.relativePath).toBe("../MyLocalPackage");
      expect(
        project.props.packageReferences?.find((r) => r.uuid === packageRef.uuid)
      ).toBeDefined();
    });

    it("returns existing package if already added", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);
      const project = xcproj.rootObject;

      const first = project.addLocalSwiftPackage({
        relativePath: "../MyLocalPackage",
      });

      const second = project.addLocalSwiftPackage({
        relativePath: "../MyLocalPackage",
      });

      expect(first.uuid).toBe(second.uuid);
    });
  });
});

describe("PBXNativeTarget Swift Package helpers", () => {
  describe("addSwiftPackageProduct", () => {
    it("adds a package product dependency with full wiring", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);
      const project = xcproj.rootObject;
      const target = xcproj.getObject(
        "DCA0157385AE428CB5B4F71F"
      ) as PBXNativeTarget;

      // Add a new package
      const packageRef = project.addRemoteSwiftPackage({
        repositoryURL: "https://github.com/example/new-package",
        requirement: {
          kind: "upToNextMajorVersion",
          minimumVersion: "1.0.0",
        },
      });

      const initialDepCount = target.props.packageProductDependencies?.length ?? 0;

      // Add product dependency
      const productDep = target.addSwiftPackageProduct({
        productName: "NewPackage",
        package: packageRef,
      });

      // Verify product dependency was created
      expect(productDep.props.productName).toBe("NewPackage");
      expect(productDep.props.package?.uuid).toBe(packageRef.uuid);

      // Verify it was added to target
      expect(target.props.packageProductDependencies?.length).toBe(
        initialDepCount + 1
      );

      // Verify build file was created and added to frameworks phase
      const frameworksPhase = target.getFrameworksBuildPhase();
      const buildFile = frameworksPhase.props.files.find(
        (f) => f.props.productRef?.uuid === productDep.uuid
      );
      expect(buildFile).toBeDefined();
    });

    it("does not add duplicate product dependencies", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);
      const project = xcproj.rootObject;
      const target = xcproj.getObject(
        "DCA0157385AE428CB5B4F71F"
      ) as PBXNativeTarget;

      const packageRef = project.addRemoteSwiftPackage({
        repositoryURL: "https://github.com/example/package",
      });

      const first = target.addSwiftPackageProduct({
        productName: "TestProduct",
        package: packageRef,
      });

      const countAfterFirst = target.props.packageProductDependencies?.length ?? 0;

      const second = target.addSwiftPackageProduct({
        productName: "TestProduct",
        package: packageRef,
      });

      expect(first.uuid).toBe(second.uuid);
      expect(target.props.packageProductDependencies?.length).toBe(countAfterFirst);
    });

    it("allows same product from different packages", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);
      const project = xcproj.rootObject;
      const target = xcproj.getObject(
        "DCA0157385AE428CB5B4F71F"
      ) as PBXNativeTarget;

      const package1 = project.addRemoteSwiftPackage({
        repositoryURL: "https://github.com/example/package1",
      });

      const package2 = project.addRemoteSwiftPackage({
        repositoryURL: "https://github.com/example/package2",
      });

      const dep1 = target.addSwiftPackageProduct({
        productName: "SharedName",
        package: package1,
      });

      const dep2 = target.addSwiftPackageProduct({
        productName: "SharedName",
        package: package2,
      });

      expect(dep1.uuid).not.toBe(dep2.uuid);
    });
  });

  describe("getSwiftPackageProductDependencies", () => {
    it("returns all product dependencies for target", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);
      const target = xcproj.getObject(
        "DCA0157385AE428CB5B4F71F"
      ) as PBXNativeTarget;

      const deps = target.getSwiftPackageProductDependencies();

      expect(deps.length).toBeGreaterThan(0);
      expect(deps[0].props.productName).toBe("Supabase");
    });

    it("returns empty array for target without dependencies", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);
      const target = xcproj.getObject(
        "13B07F861A680F5B00A75B9A"
      ) as PBXNativeTarget;

      const deps = target.getSwiftPackageProductDependencies();

      expect(Array.isArray(deps)).toBe(true);
    });
  });

  describe("removeSwiftPackageProduct", () => {
    it("removes product dependency and build file", () => {
      const xcproj = XcodeProject.open(SPM_FIXTURE);
      const project = xcproj.rootObject;
      const target = xcproj.getObject(
        "DCA0157385AE428CB5B4F71F"
      ) as PBXNativeTarget;

      // First add a package product
      const packageRef = project.addRemoteSwiftPackage({
        repositoryURL: "https://github.com/example/removable-package",
      });

      const productDep = target.addSwiftPackageProduct({
        productName: "RemovableProduct",
        package: packageRef,
      });

      const depCountBefore = target.props.packageProductDependencies?.length ?? 0;

      // Now remove it
      target.removeSwiftPackageProduct(productDep);

      // Verify it was removed from target
      expect(target.props.packageProductDependencies?.length).toBe(
        depCountBefore - 1
      );
      expect(
        target.props.packageProductDependencies?.find(
          (d) => d.uuid === productDep.uuid
        )
      ).toBeUndefined();

      // Verify build file was removed from frameworks phase
      const frameworksPhase = target.getFrameworksBuildPhase();
      const buildFile = frameworksPhase.props.files.find(
        (f) => f.props.productRef?.uuid === productDep.uuid
      );
      expect(buildFile).toBeUndefined();

      // Verify product dependency was removed from project
      expect(xcproj.has(productDep.uuid)).toBe(false);
    });
  });
});

describe("end-to-end Swift Package workflow", () => {
  it("adds a complete local Swift package to a target", () => {
    const xcproj = XcodeProject.open(SPM_FIXTURE);
    const project = xcproj.rootObject;
    const target = xcproj.getObject(
      "DCA0157385AE428CB5B4F71F"
    ) as PBXNativeTarget;

    // Step 1: Add local package to project
    const packageRef = project.addLocalSwiftPackage({
      relativePath: "../Modules/MyFeature",
    });

    // Step 2: Add product dependency to target
    const productDep = target.addSwiftPackageProduct({
      productName: "MyFeature",
      package: packageRef,
    });

    // Verify the full chain
    expect(project.props.packageReferences).toContain(packageRef);
    expect(target.props.packageProductDependencies).toContain(productDep);
    expect(productDep.props.package).toBe(packageRef);

    // Verify it serializes correctly
    const json = xcproj.toJSON();
    expect(json.objects[packageRef.uuid]).toBeDefined();
    expect(json.objects[packageRef.uuid].isa).toBe("XCLocalSwiftPackageReference");
    expect(json.objects[productDep.uuid]).toBeDefined();
    expect(json.objects[productDep.uuid].isa).toBe("XCSwiftPackageProductDependency");
  });

  it("adds a complete remote Swift package to a target", () => {
    const xcproj = XcodeProject.open(SPM_FIXTURE);
    const project = xcproj.rootObject;
    const target = xcproj.getObject(
      "DCA0157385AE428CB5B4F71F"
    ) as PBXNativeTarget;

    // Step 1: Add remote package to project
    const packageRef = project.addRemoteSwiftPackage({
      repositoryURL: "https://github.com/apple/swift-collections",
      requirement: {
        kind: "upToNextMajorVersion",
        minimumVersion: "1.0.0",
      },
    });

    // Step 2: Add product dependency to target
    const productDep = target.addSwiftPackageProduct({
      productName: "Collections",
      package: packageRef,
    });

    // Verify the full chain
    expect(project.props.packageReferences).toContain(packageRef);
    expect(target.props.packageProductDependencies).toContain(productDep);

    // Verify it serializes correctly
    const json = xcproj.toJSON();
    expect((json.objects[packageRef.uuid] as any).repositoryURL).toBe(
      "https://github.com/apple/swift-collections"
    );
    expect((json.objects[productDep.uuid] as any).productName).toBe("Collections");
  });
});
