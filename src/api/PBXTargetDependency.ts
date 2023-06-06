import * as json from "../json/types";
import { AbstractObject } from "./AbstractObject";

import type { SansIsa } from "./utils/util.types";
import type { XcodeProject } from "./XcodeProject";
import type { PBXAggregateTarget } from "./PBXAggregateTarget";
import type { PBXContainerItemProxy } from "./PBXContainerItemProxy";
import type { PBXLegacyTarget } from "./PBXLegacyTarget";
import type { PBXNativeTarget } from "./PBXNativeTarget";

export type PBXTargetDependencyModel = json.PBXTargetDependency<
  /* any target */
  PBXAggregateTarget | PBXLegacyTarget | PBXNativeTarget,
  /** targetProxy */
  PBXContainerItemProxy
>;

export class PBXTargetDependency extends AbstractObject<PBXTargetDependencyModel> {
  static isa = json.ISA.PBXTargetDependency as const;

  static is(object: any): object is PBXTargetDependency {
    return object.isa === PBXTargetDependency.isa;
  }

  static create(
    project: XcodeProject,
    opts: SansIsa<PBXTargetDependencyModel>
  ) {
    return project.createModel<PBXTargetDependencyModel>({
      isa: PBXTargetDependency.isa,
      ...opts,
    }) as PBXTargetDependency;
  }

  protected getObjectProps() {
    return {
      // TODO: idk
      target: String,
      // target: PBXLegacyTarget,
      targetProxy: String,
    };
  }

  /**
   * @return uuid of the target, if the dependency is a native target, otherwise the uuid of the target in the sub-project if the dependency is a target proxy.
   */
  getNativeTargetUuid() {
    if (this.props.target) {
      return this.props.target.uuid;
    }

    if (this.props.targetProxy) {
      return this.props.targetProxy.props.remoteGlobalIDString;
    }

    throw new Error(
      `Expected target or target_proxy, from which to fetch a uuid for target '${this.getDisplayName()}'. Find and clear the PBXTargetDependency entry with uuid '${
        this.uuid
      }' in your .xcodeproj.`
    );
  }

  getDisplayName(): string {
    return (
      this.props.name ??
      this.props.target.props.name ??
      this.props.targetProxy.props.remoteInfo ??
      super.getDisplayName()
    );
  }
}
