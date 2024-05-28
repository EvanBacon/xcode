import * as json from "../json/types";
import { AbstractObject } from "./AbstractObject";

import type { SansIsa } from "./utils/util.types";
import type { XcodeProject } from "./XcodeProject";

export type XCLocalSwiftPackageReferenceModel =
  json.XCLocalSwiftPackageReference;

export class XCLocalSwiftPackageReference extends AbstractObject<XCLocalSwiftPackageReferenceModel> {
  static isa = json.ISA.XCLocalSwiftPackageReference as const;

  static is(object: any): object is XCLocalSwiftPackageReference {
    return object.isa === XCLocalSwiftPackageReference.isa;
  }

  static create(
    project: XcodeProject,
    opts: SansIsa<XCLocalSwiftPackageReferenceModel>
  ) {
    return project.createModel<XCLocalSwiftPackageReferenceModel>({
      isa: XCLocalSwiftPackageReference.isa,
      ...opts,
    }) as XCLocalSwiftPackageReference;
  }

  protected getObjectProps() {
    return {};
  }

  getDisplayName(): string {
    return this.props.relativePath ?? super.getDisplayName();
  }
}
