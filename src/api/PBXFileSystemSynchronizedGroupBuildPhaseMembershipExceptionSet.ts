import * as json from "../json/types";

import type { SansIsa } from "./utils/util.types";
import type { XcodeProject } from "./XcodeProject";
import { AbstractObject } from "./AbstractObject";
import {
  PBXCopyFilesBuildPhase,
  PBXSourcesBuildPhase,
} from "./PBXSourcesBuildPhase";
import { getParent, getReferringTargets } from "./utils/paths";

export type PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSetModel =
  json.PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSet<
    /* source-related targets */
    PBXSourcesBuildPhase | PBXCopyFilesBuildPhase
  >;

export class PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSet extends AbstractObject<PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSetModel> {
  static isa = json.ISA
    .PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSet as const;

  static is(
    object: any
  ): object is PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSet {
    return (
      object.isa ===
      PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSet.isa
    );
  }

  static create(
    project: XcodeProject,
    opts: SansIsa<PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSetModel>
  ) {
    return project.createModel<PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSetModel>(
      {
        isa: PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSet.isa,
        ...opts,
      }
    ) as PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSet;
  }

  protected getObjectProps() {
    return {
      buildPhase: String,
    };
  }

  getDisplayName() {
    // NOTE: Only verified against `PBXCopyFilesBuildPhase`
    const name =
      "name" in this.props.buildPhase.props
        ? this.props.buildPhase.props.name
        : this.props.buildPhase.getDisplayName();

    const targets = getReferringTargets(this.props.buildPhase);

    let displayName = `Exceptions for "${getParent(
      this
    ).getDisplayName()}" folder in "${name}" phase`;

    if (targets.length === 1) {
      displayName += ` from "${targets[0].getDisplayName()}" target`;
    }

    return displayName;
  }
}
