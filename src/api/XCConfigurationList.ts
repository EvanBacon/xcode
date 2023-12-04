import * as json from "../json/types";
import { AbstractObject } from "./AbstractObject";

import type { PickRequired, SansIsa } from "./utils/util.types";
import type { XcodeProject } from "./XcodeProject";
import type { XCBuildConfiguration } from "./XCBuildConfiguration";

export type XCConfigurationListModel =
  json.XCConfigurationList<XCBuildConfiguration>;

export class XCConfigurationList extends AbstractObject<XCConfigurationListModel> {
  static isa = json.ISA.XCConfigurationList as const;

  static is(object: any): object is XCConfigurationList {
    return object.isa === XCConfigurationList.isa;
  }

  static create(
    project: XcodeProject,
    opts: PickRequired<
      SansIsa<XCConfigurationListModel>,
      "defaultConfigurationName" | "buildConfigurations"
    >
  ) {
    return project.createModel<XCConfigurationListModel>({
      isa: XCConfigurationList.isa,
      defaultConfigurationIsVisible: 0,
      ...opts,
    }) as XCConfigurationList;
  }

  protected getObjectProps() {
    return {
      buildConfigurations: [String],
    };
  }

  /** Get the configuration for the `defaultConfigurationName` and assert if it isn't available. */
  getDefaultConfiguration() {
    const config = this.props.buildConfigurations.find(
      (child) => child.props.name === this.props.defaultConfigurationName
    );

    if (!config) {
      throw new Error(
        `[XCConfigurationList][${this.uuid}]: ${
          this.props.defaultConfigurationName
        } not found in buildConfigurations. Available configurations: ${this.props.buildConfigurations
          .map((config) => `${config.props.name} (${config.uuid})`)
          .join(", ")})`
      );
    }

    return config;
  }

  removeReference(uuid: string) {
    const index = this.props.buildConfigurations.findIndex(
      (child) => child.uuid === uuid
    );
    if (index !== -1) {
      this.props.buildConfigurations.splice(index, 1);
    }
  }

  isReferencing(uuid: string): boolean {
    return this.props.buildConfigurations.some((child) => child.uuid === uuid);
  }
}
