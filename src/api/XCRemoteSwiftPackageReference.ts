import * as json from "../json/types";
import { AbstractObject } from "./AbstractObject";

import type { SansIsa } from "./utils/util.types";
import type { XcodeProject } from "./XcodeProject";

export type XCRemoteSwiftPackageReferenceModel =
  json.XCRemoteSwiftPackageReference;

export class XCRemoteSwiftPackageReference extends AbstractObject<XCRemoteSwiftPackageReferenceModel> {
  static isa = json.ISA.XCRemoteSwiftPackageReference as const;

  static is(object: any): object is XCRemoteSwiftPackageReference {
    return object.isa === XCRemoteSwiftPackageReference.isa;
  }

  static create(
    project: XcodeProject,
    opts: SansIsa<XCRemoteSwiftPackageReferenceModel>
  ) {
    return project.createModel<XCRemoteSwiftPackageReferenceModel>({
      isa: XCRemoteSwiftPackageReference.isa,
      ...opts,
    }) as XCRemoteSwiftPackageReference;
  }

  protected getObjectProps() {
    return {};
  }

  getDisplayName(): string {
    return this.props.repositoryURL ?? super.getDisplayName();
  }
}
