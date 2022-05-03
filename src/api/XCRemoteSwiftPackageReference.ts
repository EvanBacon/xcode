import * as json from "../json/types";
import { AbstractObject } from "./AbstractObject";

import type { SansIsa } from "../util.types";
import type { XcodeProject } from "./XcodeProject";

export class XCRemoteSwiftPackageReference extends AbstractObject<json.XCRemoteSwiftPackageReference> {
  static isa = json.ISA.XCRemoteSwiftPackageReference as const;

  static is(object: any): object is XCRemoteSwiftPackageReference {
    return object.isa === XCRemoteSwiftPackageReference.isa;
  }

  static create(
    project: XcodeProject,
    opts: SansIsa<json.XCRemoteSwiftPackageReference>
  ) {
    return project.createModel<json.XCRemoteSwiftPackageReference>({
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
