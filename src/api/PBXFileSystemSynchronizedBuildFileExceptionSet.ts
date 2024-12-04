import * as json from "../json/types";

import type { SansIsa } from "./utils/util.types";
import type { XcodeProject } from "./XcodeProject";
import { AbstractObject } from "./AbstractObject";
import { PBXAggregateTarget } from "./PBXAggregateTarget";
import { PBXLegacyTarget } from "./PBXLegacyTarget";
import { PBXNativeTarget } from "./PBXNativeTarget";

export type PBXFileSystemSynchronizedBuildFileExceptionSetModel = json.PBXFileSystemSynchronizedBuildFileExceptionSet<
  /* any target */
  PBXAggregateTarget | PBXLegacyTarget | PBXNativeTarget
>;

export class PBXFileSystemSynchronizedBuildFileExceptionSet extends AbstractObject<PBXFileSystemSynchronizedBuildFileExceptionSetModel> {

  static isa = json.ISA.PBXFileSystemSynchronizedBuildFileExceptionSet as const;

  static is(object: any): object is PBXFileSystemSynchronizedBuildFileExceptionSet {
    return object.isa === PBXFileSystemSynchronizedBuildFileExceptionSet.isa;
  }

  static create(
    project: XcodeProject,
    opts: SansIsa<PBXFileSystemSynchronizedBuildFileExceptionSetModel>
  ) {
    return project.createModel<PBXFileSystemSynchronizedBuildFileExceptionSetModel>({
      isa: PBXFileSystemSynchronizedBuildFileExceptionSet.isa,
      ...opts,
    }) as PBXFileSystemSynchronizedBuildFileExceptionSet;
  }

  protected getObjectProps() {
    return {
      target: String,
    };
  }
}
