import * as json from "../json/types";
import { AbstractTarget } from "./AbstractTarget";

import {
  PBXFrameworksBuildPhase,
  PBXHeadersBuildPhase,
  PBXResourcesBuildPhase,
  PBXSourcesBuildPhase,
  type AnyBuildPhase,
} from "./PBXSourcesBuildPhase";
import { PBXFileReference } from "./PBXFileReference";
import type { PickRequired, SansIsa } from "./utils/util.types";
import type { XcodeProject } from "./XcodeProject";
import type { PBXBuildRule } from "./PBXBuildRule";
import type { PBXTargetDependency } from "./PBXTargetDependency";
import type { XCConfigurationList } from "./XCConfigurationList";
import type { XCSwiftPackageProductDependency } from "./XCSwiftPackageProductDependency";
import type { PBXFileSystemSynchronizedRootGroup } from "./PBXFileSystemSynchronizedRootGroup";

export type PBXNativeTargetModel = json.PBXNativeTarget<
  XCConfigurationList,
  PBXTargetDependency,
  AnyBuildPhase,
  PBXBuildRule,
  PBXFileReference,
  XCSwiftPackageProductDependency,
  PBXFileSystemSynchronizedRootGroup
>;

export class PBXNativeTarget extends AbstractTarget<PBXNativeTargetModel> {
  static isa = json.ISA.PBXNativeTarget as const;
  static is(object: any): object is PBXNativeTarget {
    return object.isa === PBXNativeTarget.isa;
  }

  static create(
    project: XcodeProject,
    opts: PickRequired<
      SansIsa<PBXNativeTargetModel>,
      "name" | "productType" | "buildConfigurationList"
    >
  ) {
    return project.createModel<PBXNativeTargetModel>({
      isa: json.ISA.PBXNativeTarget,
      buildPhases: [],
      buildRules: [],
      dependencies: [],
      // TODO: Should we default the product name to the target name?
      ...opts,
    }) as PBXNativeTarget;
  }

  isReferencing(uuid: string): boolean {
    if (this.props.buildRules.some((rule) => rule.uuid === uuid)) return true;
    if (this.props.packageProductDependencies?.some((dep) => dep.uuid === uuid))
      return true;
    if (this.props.productReference?.uuid === uuid) return true;

    return super.isReferencing(uuid);
  }

  /** @returns the `PBXFrameworksBuildPhase` or creates one if there is none. Only one can exist. */
  getFrameworksBuildPhase() {
    return (
      this.getBuildPhase(PBXFrameworksBuildPhase) ??
      this.createBuildPhase(PBXFrameworksBuildPhase)
    );
  }

  /** @returns the `PBXHeadersBuildPhase` or creates one if there is none. Only one can exist. */
  getHeadersBuildPhase() {
    return (
      this.getBuildPhase(PBXHeadersBuildPhase) ??
      this.createBuildPhase(PBXHeadersBuildPhase)
    );
  }

  /** @returns the `PBXSourcesBuildPhase` or creates one if there is none. Only one can exist. */
  getSourcesBuildPhase() {
    return (
      this.getBuildPhase(PBXSourcesBuildPhase) ??
      this.createBuildPhase(PBXSourcesBuildPhase)
    );
  }

  /** @returns the `PBXResourcesBuildPhase` or creates one if there is none. Only one can exist. */
  getResourcesBuildPhase() {
    return (
      this.getBuildPhase(PBXResourcesBuildPhase) ??
      this.createBuildPhase(PBXResourcesBuildPhase)
    );
  }

  /** Ensures a list of frameworks are linked to the target, given a list like `['SwiftUI.framework', 'WidgetKit.framework']`. Also ensures the file references are added to the Frameworks display folder. */
  ensureFrameworks(frameworks: string[]) {
    const frameworksFolder =
      this.getXcodeProject().rootObject.getFrameworksGroup();

    // TODO: This might need OS-specific checks like https://github.com/CocoaPods/Xcodeproj/blob/ab3dfa504b5a97cae3a653a8924f4616dcaa062e/lib/xcodeproj/project/object/native_target.rb#L322-L328
    const getFrameworkFileReference = (name: string): PBXFileReference => {
      const frameworkName = name.endsWith(".framework")
        ? name
        : name + ".framework";

      for (const [, entry] of this.getXcodeProject().entries()) {
        if (
          PBXFileReference.is(entry) &&
          entry.props.lastKnownFileType === "wrapper.framework" &&
          entry.props.sourceTree === "SDKROOT" &&
          entry.props.name === frameworkName
        ) {
          // This should never happen but if it does then we can repair the state by adding the framework file reference to the Frameworks display group.
          if (
            !frameworksFolder.props.children.find(
              (child) => child.uuid === entry.uuid
            )
          ) {
            frameworksFolder.props.children.push(entry);
          }
          return entry;
        }
      }

      return frameworksFolder.createFile({
        path: "System/Library/Frameworks/" + frameworkName,
      });
    };

    return frameworks.map((framework) => {
      return this.getFrameworksBuildPhase().ensureFile({
        fileRef: getFrameworkFileReference(framework),
      });
    });
  }

  protected getObjectProps(): Partial<{
    buildRules: any;
    productType: any;
    productReference?: any;
    productInstallPath?: any;
    packageProductDependencies?: any;
    productName?: any;
    buildConfigurationList: any;
    dependencies: any;
    buildPhases: any;
  }> {
    return {
      ...super.getObjectProps(),
      buildRules: [String],
      productReference: [String],
      packageProductDependencies: [String],
      fileSystemSynchronizedGroups: [String],
    };
  }
}
