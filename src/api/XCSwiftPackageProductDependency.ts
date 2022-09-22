import * as json from "../json/types";
import { AbstractObject } from "./AbstractObject";

import type { SansIsa } from "./utils/util.types";
import type { XcodeProject } from "./XcodeProject";
import type { XCRemoteSwiftPackageReference } from "./XCRemoteSwiftPackageReference";

export class XCSwiftPackageProductDependency extends AbstractObject<
  json.XCSwiftPackageProductDependency<XCRemoteSwiftPackageReference>
> {
  static isa = json.ISA.XCSwiftPackageProductDependency as const;

  static is(object: any): object is XCSwiftPackageProductDependency {
    return object.isa === XCSwiftPackageProductDependency.isa;
  }

  static create(
    project: XcodeProject,
    opts: SansIsa<json.XCSwiftPackageProductDependency>
  ) {
    return project.createModel<json.XCSwiftPackageProductDependency>({
      isa: XCSwiftPackageProductDependency.isa,
      ...opts,
    }) as XCSwiftPackageProductDependency;
  }

  protected getObjectProps() {
    return {};
  }

  getDisplayName(): string {
    return this.props.productName ?? super.getDisplayName();
  }
}
