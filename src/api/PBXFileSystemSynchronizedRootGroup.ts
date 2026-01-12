import * as json from "../json/types";

import type { SansIsa } from "./utils/util.types";
import type { XcodeProject } from "./XcodeProject";
import { AbstractObject } from "./AbstractObject";
import type { PBXFileSystemSynchronizedBuildFileExceptionSet } from "./PBXFileSystemSynchronizedBuildFileExceptionSet";
import type { PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSet } from "./PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSet";

export type PBXFileSystemSynchronizedRootGroupModel =
  json.PBXFileSystemSynchronizedRootGroup<
    /* exceptions */
    | PBXFileSystemSynchronizedBuildFileExceptionSet
    | PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSet
  >;

export class PBXFileSystemSynchronizedRootGroup extends AbstractObject<PBXFileSystemSynchronizedRootGroupModel> {
  static isa = json.ISA.PBXFileSystemSynchronizedRootGroup as const;

  static is(object: any): object is PBXFileSystemSynchronizedRootGroup {
    return object.isa === PBXFileSystemSynchronizedRootGroup.isa;
  }

  static create(
    project: XcodeProject,
    opts: SansIsa<PBXFileSystemSynchronizedRootGroupModel>
  ) {
    return project.createModel<PBXFileSystemSynchronizedRootGroupModel>({
      isa: PBXFileSystemSynchronizedRootGroup.isa,
      ...opts,
    }) as PBXFileSystemSynchronizedRootGroup;
  }

  protected getObjectProps() {
    return {
      exceptions: [String],
    };
  }

  removeFromProject() {
    // Remove all exceptions that are only referenced by this group
    if (this.props.exceptions) {
      for (const exception of [...this.props.exceptions]) {
        const referrers = exception.getReferrers();
        if (referrers.length === 1 && referrers[0].uuid === this.uuid) {
          exception.removeFromProject();
        }
      }
    }
    return super.removeFromProject();
  }
}
