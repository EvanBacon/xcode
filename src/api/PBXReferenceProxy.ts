import * as json from "../json/types";
import { AbstractObject } from "./AbstractObject";
import { PBXBuildFile } from "./PBXBuildFile";

import type { PickRequired, SansIsa } from "./utils/util.types";
import type { XcodeProject } from "./XcodeProject";
import type { PBXContainerItemProxy } from "./PBXContainerItemProxy";

export class PBXReferenceProxy extends AbstractObject<
  json.PBXReferenceProxy<PBXContainerItemProxy>
> {
  static isa = json.ISA.PBXReferenceProxy as const;
  static is(object: any): object is PBXReferenceProxy {
    return object.isa === PBXReferenceProxy.isa;
  }
  static create(
    project: XcodeProject,
    opts: PickRequired<
      SansIsa<json.PBXReferenceProxy>,
      "remoteRef" | "fileType"
    >
  ) {
    return project.createModel<json.PBXReferenceProxy>({
      isa: PBXReferenceProxy.isa,
      sourceTree: "<group>",
      ...opts,
    }) as PBXReferenceProxy;
  }

  protected getObjectProps(): Partial<{ remoteRef: any }> {
    return {
      remoteRef: String,
    };
  }

  /** Removes self and all PBXBuildFiles that this proxy is referencing. */
  removeFromProject() {
    this.getBuildFiles().forEach((file) => {
      file.removeFromProject();
    });
    return super.removeFromProject();
  }

  getBuildFiles() {
    return this.getReferrers().filter(PBXBuildFile.is);
  }
}
