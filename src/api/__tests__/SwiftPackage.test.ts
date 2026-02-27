import path from "path";

import {
  XcodeProject,
  XCLocalSwiftPackageReference,
  XCRemoteSwiftPackageReference,
  XCSwiftPackageProductDependency,
} from "..";

const SPM_FIXTURE = path.join(
  __dirname,
  "../../json/__tests__/fixtures/006-spm.pbxproj"
);

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
});
