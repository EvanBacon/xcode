import * as json from "../json/types";
import { AbstractObject } from "./AbstractObject";

import type { SansIsa } from "./utils/util.types";
import type { XcodeProject } from "./XcodeProject";
import type { XCRemoteSwiftPackageReference } from "./XCRemoteSwiftPackageReference";
import type { XCLocalSwiftPackageReference } from "./XCLocalSwiftPackageReference";

export type XCSwiftPackageProductDependencyModel =
  json.XCSwiftPackageProductDependency<
    XCRemoteSwiftPackageReference | XCLocalSwiftPackageReference
  >;

export class XCSwiftPackageProductDependency extends AbstractObject<XCSwiftPackageProductDependencyModel> {
  static isa = json.ISA.XCSwiftPackageProductDependency as const;

  static is(object: any): object is XCSwiftPackageProductDependency {
    return object.isa === XCSwiftPackageProductDependency.isa;
  }

  static create(
    project: XcodeProject,
    opts: SansIsa<XCSwiftPackageProductDependencyModel>
  ) {
    return project.createModel<XCSwiftPackageProductDependencyModel>({
      isa: XCSwiftPackageProductDependency.isa,
      ...opts,
    }) as XCSwiftPackageProductDependency;
  }

  protected getObjectProps() {
    return {
      package: String,
    };
  }

  getDisplayName(): string {
    return this.props.productName ?? super.getDisplayName();
  }
}
