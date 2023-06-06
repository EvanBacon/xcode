import * as json from "../json/types";
import { AbstractObject } from "./AbstractObject";

import type { PickRequired, SansIsa } from "./utils/util.types";
import type { PBXGroup } from "./AbstractGroup";
import type { XcodeProject } from "./XcodeProject";
import type { PBXFileReference } from "./PBXFileReference";
import type { PBXReferenceProxy } from "./PBXReferenceProxy";
import type { PBXVariantGroup } from "./PBXVariantGroup";
import type { XCSwiftPackageProductDependency } from "./XCSwiftPackageProductDependency";
import type { XCVersionGroup } from "./XCVersionGroup";

export type PBXBuildFileModel = json.PBXBuildFile<
  | PBXFileReference
  | PBXGroup
  | PBXVariantGroup
  | XCVersionGroup
  | PBXReferenceProxy,
  XCSwiftPackageProductDependency
>;

export class PBXBuildFile extends AbstractObject<PBXBuildFileModel> {
  static isa = json.ISA.PBXBuildFile as const;

  static is(object: any): object is PBXBuildFile {
    return object.isa === PBXBuildFile.isa;
  }

  static create(
    project: XcodeProject,
    opts: PickRequired<SansIsa<PBXBuildFileModel>, "fileRef">
  ) {
    return project.createModel<PBXBuildFileModel>({
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

  isReferencing(uuid: string): boolean {
    return [this.props.fileRef?.uuid, this.props.productRef?.uuid].includes(
      uuid
    );
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
