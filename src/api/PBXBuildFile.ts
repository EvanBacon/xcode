import * as json from "../json/types";
import { AbstractObject } from "./AbstractObject";

import type { PickRequired, SansIsa } from "../util.types";
import type { PBXGroup } from "./AbstractGroup";
import type { XcodeProject } from "./XcodeProject";
import type { PBXFileReference } from "./PBXFileReference";
import type { PBXReferenceProxy } from "./PBXReferenceProxy";
import type { PBXVariantGroup } from "./PBXVariantGroup";
import type { XCSwiftPackageProductDependency } from "./XCSwiftPackageProductDependency";
import type { XCVersionGroup } from "./XCVersionGroup";

export class PBXBuildFile extends AbstractObject<
  json.PBXBuildFile<
    | PBXFileReference
    | PBXGroup
    | PBXVariantGroup
    | XCVersionGroup
    | PBXReferenceProxy,
    XCSwiftPackageProductDependency
  >
> {
  static isa = json.ISA.PBXBuildFile as const;

  static is(object: any): object is PBXBuildFile {
    return object.isa === PBXBuildFile.isa;
  }

  static create(
    project: XcodeProject,
    opts: PickRequired<SansIsa<json.PBXBuildFile>, "fileRef">
  ) {
    return project.createModel<json.PBXBuildFile>({
      isa: PBXBuildFile.isa,
      ...opts,
    }) as PBXBuildFile;
  }

  protected getObjectProps() {
    return {
      fileRef: String,
      productRef: String,
    };
  }

  isReferencing(id: string): boolean {
    return [this.props.fileRef?.uuid, this.props.productRef?.uuid].includes(id);
  }

  getDisplayName() {
    if (this.props.productRef) {
      return this.props.productRef.getDisplayName();
    } else if (this.props.fileRef) {
      return this.props.fileRef.getDisplayName();
    }
    return super.getDisplayName();
  }
}
