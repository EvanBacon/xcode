import path from "node:path";

import * as json from "../json/types";
import { AbstractObject } from "./AbstractObject";
import type { SansIsa } from "./utils/util.types";
import type { XcodeProject } from "./XcodeProject";
import type { PBXFileReference } from "./PBXFileReference";
import { resolveXcodeBuildSetting } from "./utils/resolveBuildSettings";

const debug = require("debug")(
  "xcode:XCBuildConfiguration"
) as typeof console.log;

export type XCBuildConfigurationModel =
  json.XCBuildConfiguration<PBXFileReference>;

export class XCBuildConfiguration extends AbstractObject<XCBuildConfigurationModel> {
  static isa = json.ISA.XCBuildConfiguration as const;
  static is(object: any): object is XCBuildConfiguration {
    return object.isa === XCBuildConfiguration.isa;
  }

  static create(
    project: XcodeProject,
    opts: SansIsa<XCBuildConfigurationModel>
  ) {
    return project.createModel<XCBuildConfigurationModel>({
      isa: json.ISA.XCBuildConfiguration,
      ...opts,
    }) as XCBuildConfiguration;
  }

  /** @returns the resolved absolute file path for the `INFOPLIST_FILE` build setting if it exists. `null` if the setting does not exist. */
  getInfoPlistFile(): string | null {
    const fileRef = this.props.buildSettings.INFOPLIST_FILE;
    if (fileRef == null) {
      return null;
    }
    const root = this.getXcodeProject().getProjectRoot();
    // TODO: Maybe interpolate
    // TODO: Maybe add root projectRoot, currently this is always `""` in my fixtures.

    return path.join(root, fileRef);
  }

  /**
   * Build settings can include environment variables (often defined by `xcodebuild`) and additional commands to mutate the value, e.g. `$(FOO:lower)` -> `process.env.FOO.toLowerCase()`
   *
   * @returns a resolved build setting with all commands and references interpolated out. */
  resolveBuildSetting(
    buildSetting: keyof json.BuildSettings
  ): json.BuildSettings[keyof json.BuildSettings] {
    const resolver = (sub: string) => {
      if (!(sub in this.props.buildSettings)) {
        if (sub in process.env) {
          debug('Using environment variable substitution for "%s"', sub);
          return process.env[sub];
        } else if (
          // If the build settings aren't available then it means this process it being run outside of xcodebuild (likely)
          // so we'll fallback on defaults from a random HTML file I found on the internet.
          // https://opensource.apple.com/source/pb_makefiles/pb_makefiles-1005/platform-variables.make.auto.html
          sub in DEF_APPLE_BUILD_VARIABLES
        ) {
          debug(
            'Dangerously using estimated default Apple build variable substitution for "%s"',
            sub
          );
          return DEF_APPLE_BUILD_VARIABLES[sub];
        }

        console.warn(
          `[XCBuildConfiguration][${this.props.name}]: Issue resolving build setting "${buildSetting}". Substitute value "${sub}" not found in build settings.`
        );
      }

      if (Array.isArray(sub)) {
        console.warn(
          `[XCBuildConfiguration][${this.props.name}]: Issue resolving build setting "${buildSetting}". Substitute value "${sub}" is of type array––it's not clear how this should be resolved in a string.`
        );
      }

      // @ts-expect-error: A setting could refer to another setting that isn't of type string.
      return this.props.buildSettings[sub];
    };

    const setting = this.props.buildSettings[buildSetting];
    if (typeof setting === "string") {
      return resolveXcodeBuildSetting(setting, resolver);
    }
    if (Array.isArray(setting)) {
      return setting.map((s) => {
        return resolveXcodeBuildSetting(s, resolver);
      });
    }
    return setting;
  }

  protected getObjectProps() {
    return {
      baseConfigurationReference: String,
    };
  }
}

import os from "node:os";

// https://opensource.apple.com/source/pb_makefiles/pb_makefiles-1005/platform-variables.make.auto.html
const DEF_APPLE_BUILD_VARIABLES: Record<string, string> = {
  HOME: os.homedir(),

  SYSTEM_APPS_DIR: "/Applications",
  SYSTEM_ADMIN_APPS_DIR: "/Applications/Utilities",
  SYSTEM_DEMOS_DIR: "/Applications/Extras",
  SYSTEM_DEVELOPER_DIR: "/Applications/Xcode.app/Contents/Developer",
  SYSTEM_DEVELOPER_APPS_DIR: "/Applications/Xcode.app/Contents/Applications",
  SYSTEM_DEVELOPER_JAVA_TOOLS_DIR:
    "/Applications/Xcode.app/Contents/Applications/Java Tools",
  SYSTEM_DEVELOPER_PERFORMANCE_TOOLS_DIR:
    "/Applications/Xcode.app/Contents/Applications/Performance Tools",
  SYSTEM_DEVELOPER_GRAPHICS_TOOLS_DIR:
    "/Applications/Xcode.app/Contents/Applications/Graphics Tools",
  SYSTEM_DEVELOPER_UTILITIES_DIR:
    "/Applications/Xcode.app/Contents/Applications/Utilities",
  SYSTEM_DEVELOPER_DEMOS_DIR:
    "/Applications/Xcode.app/Contents/Developer/Utilities/Built Examples",
  SYSTEM_DEVELOPER_DOC_DIR:
    "/Applications/Xcode.app/Contents/Developer/ADC Reference Library",
  SYSTEM_DEVELOPER_TOOLS_DOC_DIR:
    "/Applications/Xcode.app/Contents/Developer/ADC Reference Library/documentation/DeveloperTools",
  SYSTEM_DEVELOPER_RELEASENOTES_DIR:
    "/Applications/Xcode.app/Contents/Developer/ADC Reference Library/releasenotes",
  SYSTEM_DEVELOPER_TOOLS_RELEASENOTES_DIR:
    "/Applications/Xcode.app/Contents/Developer/ADC Reference Library/releasenotes/DeveloperTools",
  SYSTEM_LIBRARY_DIR: "/System/Library",
  SYSTEM_CORE_SERVICES_DIR: "/System/Library/CoreServices",
  SYSTEM_DOCUMENTATION_DIR: "/Library/Documentation",
  LOCAL_ADMIN_APPS_DIR: "/Applications/Utilities",
  LOCAL_APPS_DIR: "/Applications",
  LOCAL_DEVELOPER_DIR: "/Library/Developer",
  LOCAL_LIBRARY_DIR: "/Library",
  USER_APPS_DIR: "$(HOME)/Applications",
  USER_LIBRARY_DIR: "$(HOME)/Library",
  MAN_PAGE_DIRECTORIES: "/usr/share/man",

  SYSTEM_LIBRARY_EXECUTABLES_DIR: "",
  SYSTEM_DEVELOPER_EXECUTABLES_DIR: "",
  LOCAL_DEVELOPER_EXECUTABLES_DIR: "",
};
