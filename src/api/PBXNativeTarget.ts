import * as json from "../json/types";
import { AbstractTarget } from "./AbstractTarget";

import {
  PBXCopyFilesBuildPhase,
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
import { PBXTargetDependency } from "./PBXTargetDependency";
import type { XCConfigurationList } from "./XCConfigurationList";
import type { XCSwiftPackageProductDependency } from "./XCSwiftPackageProductDependency";
import type { PBXFileSystemSynchronizedRootGroup } from "./PBXFileSystemSynchronizedRootGroup";
import { PBXContainerItemProxy } from "./PBXContainerItemProxy";
import type { PBXFileSystemSynchronizedBuildFileExceptionSet } from "./PBXFileSystemSynchronizedBuildFileExceptionSet";

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
    if (
      this.props.fileSystemSynchronizedGroups?.some(
        (group) => group.uuid === uuid
      )
    )
      return true;

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

  /**
   * Adds a dependency on the given target.
   *
   * @param  [AbstractTarget] target
   *         the target which should be added to the dependencies list of
   *         the receiver. The target may be a target of this target's
   *         project or of a subproject of this project. Note that the
   *         subproject must already be added to this target's project.
   *
   * @return [void]
   */
  addDependency(target: PBXNativeTarget) {
    const isSameProject =
      target.getXcodeProject().filePath === this.getXcodeProject().filePath;
    const existing = this.getDependencyForTarget(target);
    if (existing) {
      if (!isSameProject) {
        // Seems to only be used when the target is a subproject. https://github.com/CocoaPods/Xcodeproj/blob/ab3dfa504b5a97cae3a653a8924f4616dcaa062e/lib/xcodeproj/project/object/target_dependency.rb#L24-L25
        // Update existing props with the existing target.
        existing.props.name = target.props.name;
      }
      return;
    }

    const containerProxy = PBXContainerItemProxy.create(
      this.getXcodeProject(),
      {
        containerPortal: this.getXcodeProject().rootObject,
        proxyType: 1,
        remoteGlobalIDString: target.uuid,
        remoteInfo: target.props.name,
      }
    );

    if (isSameProject) {
      containerProxy.props.containerPortal = this.getXcodeProject().rootObject;
    } else {
      throw new Error(
        "adding dependencies to subprojects is not yet supported. Please open an issue if you need this feature."
      );
    }

    const dependency = PBXTargetDependency.create(this.getXcodeProject(), {
      target,
      targetProxy: containerProxy,
      // name: isSameProject ? undefined : target.props.name,
    });

    this.props.dependencies.push(dependency);
  }

  getCopyBuildPhaseForTarget(target: PBXNativeTarget) {
    const project = this.getXcodeProject();
    if (project.rootObject.getMainAppTarget("ios")!.uuid !== this.uuid) {
      throw new Error(
        `getCopyBuildPhaseForTarget can only be called on the main target`
      );
    }

    const WELL_KNOWN_COPY_EXTENSIONS_NAME = (() => {
      if (
        target.props.productType ===
        "com.apple.product-type.application.on-demand-install-capable"
      ) {
        return "Embed App Clips";
      } else if (
        target.props.productType === "com.apple.product-type.application"
      ) {
        return "Embed Watch Content";
      } else if (
        target.props.productType ===
        "com.apple.product-type.extensionkit-extension"
      ) {
        return "Embed ExtensionKit Extensions";
      }
      return "Embed Foundation Extensions";
    })();

    const existing = this.props.buildPhases.find((phase) => {
      // TODO: maybe there's a safer way to do this? The name is not a good identifier.
      return (
        PBXCopyFilesBuildPhase.is(phase) &&
        phase.props.name === WELL_KNOWN_COPY_EXTENSIONS_NAME
      );
    });
    if (existing) {
      return existing;
    }

    const phase = this.createBuildPhase(PBXCopyFilesBuildPhase, {
      name: WELL_KNOWN_COPY_EXTENSIONS_NAME,
      files: [],
    });

    phase.ensureDefaultsForTarget(target);

    return phase;
  }

  isWatchOSTarget(): boolean {
    return (
      this.props.productType === "com.apple.product-type.application" &&
      !!this.getDefaultBuildSetting("WATCHOS_DEPLOYMENT_TARGET")
    );
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
