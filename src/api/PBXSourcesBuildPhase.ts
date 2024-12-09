import * as json from "../json/types";
import { AbstractObject } from "./AbstractObject";
import { PBXBuildFile, PBXBuildFileModel } from "./PBXBuildFile";

import type { PickRequired, SansIsa } from "./utils/util.types";
import type { PBXGroup } from "./AbstractGroup";
import type { PBXFileReference } from "./PBXFileReference";
import type { PBXReferenceProxy } from "./PBXReferenceProxy";
import type { PBXVariantGroup } from "./PBXVariantGroup";
import type { XCVersionGroup } from "./XCVersionGroup";
import type { PBXNativeTarget } from "./PBXNativeTarget";

// const debug = require("debug")("xcparse:models") as typeof console.log;

type AnyFileReference =
  | PBXFileReference
  | PBXGroup
  | PBXVariantGroup
  | XCVersionGroup
  | PBXReferenceProxy;

export class AbstractBuildPhase<
  TJSON extends json.AbstractBuildPhase<any, PBXBuildFile>
> extends AbstractObject<TJSON> {
  protected getObjectProps(): any {
    return { files: [String] };
  }

  /** Create a file and add it to the files array. To prevent creating duplicates, use `ensureFile` instead. */
  createFile(json: PickRequired<SansIsa<PBXBuildFileModel>, "fileRef">) {
    const file = PBXBuildFile.create(this.getXcodeProject(), json);
    this.props.files.push(file);
    return file;
  }

  /** Get or create a file. */
  ensureFile(json: PickRequired<SansIsa<PBXBuildFileModel>, "fileRef">) {
    const existing = this.getBuildFile(json.fileRef);
    if (existing) {
      return existing;
    }
    return this.createFile(json);
  }

  getFileReferences() {
    return this.props.files.map((file) => file.props.fileRef);
  }

  /** @returns the first build file for a given file reference. */
  getBuildFile(file: AnyFileReference | string) {
    if (!this.props.files.length) return null;
    const refs = (
      typeof file === "string"
        ? this.getXcodeProject().getReferrers(file)
        : file.getReferrers()
    ).filter((ref) => PBXBuildFile.is(ref)) as PBXBuildFile[];
    return (
      refs.find((ref) => {
        return this.props.files.some((file) => file.uuid === ref.uuid);
      }) ?? null
    );
  }

  includesFile(file: AnyFileReference | string): boolean {
    return !!this.getBuildFile(file);
  }

  isReferencing(uuid: string): boolean {
    return !!this.props.files.find((file: any) => file.uuid === uuid);
  }

  removeFileReference(file: PBXFileReference) {
    const buildFiles = this.props.files.filter(
      (buildFile) => buildFile.props.fileRef.uuid === file.uuid
    );
    buildFiles.forEach((buildFile) => {
      this.props.files.splice(this.props.files.indexOf(buildFile), 1);
      buildFile.removeFromProject();
    });
  }

  removeBuildFile(file: PBXBuildFile) {
    file.removeFromProject();
  }

  protected setupDefaults() {
    if (this.props.buildActionMask == null) {
      this.props.buildActionMask = 2147483647;
    }
    if (this.props.runOnlyForDeploymentPostprocessing == null) {
      this.props.runOnlyForDeploymentPostprocessing = 0;
    }
    if (!this.props.files) this.props.files = [];
  }
}
export class PBXCopyFilesBuildPhase extends AbstractBuildPhase<
  json.PBXCopyFilesBuildPhase<PBXBuildFile>
> {
  static isa = json.ISA.PBXCopyFilesBuildPhase as const;
  static is(object: any): object is PBXCopyFilesBuildPhase {
    return object.isa === PBXCopyFilesBuildPhase.isa;
  }
  getDisplayName() {
    return super.getDisplayName().replace(/BuildPhase$/, "");
  }

  private isAppExtensionFileRef(file: PBXBuildFile): PBXFileReference | null {
    if (
      file.props.fileRef &&
      file.props.fileRef.isa === "PBXFileReference" &&
      "isAppExtension" in file.props.fileRef &&
      file.props.fileRef.isAppExtension()
    ) {
      return file.props.fileRef;
    }
    return null;
  }

  /** Given a target, set the default CopyBuildPhase values. This is useful for adding app extensions. */
  ensureDefaultsForTarget(target: PBXNativeTarget) {
    if (target.isWatchOSTarget()) {
      // Is WatchOS appex CopyFilesBuildPhase
      this.props.dstPath = "$(CONTENTS_FOLDER_PATH)/Watch";

      // WatchOS folder.
      this.props.dstSubfolderSpec = 16;
      this.props.name = "Embed Watch Content";
    } else if (
      target.props.productType ===
      "com.apple.product-type.application.on-demand-install-capable"
    ) {
      this.props.dstPath = "$(CONTENTS_FOLDER_PATH)/AppClips";
      this.props.dstSubfolderSpec = 16;
      this.props.name = "Embed App Clips";
    } else if (
      // Is Extension appex CopyFilesBuildPhase
      target.props.productType ===
      "com.apple.product-type.extensionkit-extension"
    ) {
      this.props.dstPath = "$(EXTENSIONS_FOLDER_PATH)";
      this.props.dstSubfolderSpec = 16;
      this.props.name = "Embed ExtensionKit Extensions";
    } else if (target.props.productReference?.isAppExtension()) {
      // PlugIns folder.
      this.props.dstSubfolderSpec = 13;
      this.props.name = "Embed Foundation Extensions";
    }
  }

  protected setupDefaults(): void {
    const appExtFiles = this.props.files
      .map(
        (file) => typeof file !== "string" && this.isAppExtensionFileRef(file)
      )
      .filter(Boolean) as PBXFileReference[];

    // Set defaults for copy build phases that are used to embed app extensions.
    if (appExtFiles.length) {
      const firstTarget = appExtFiles
        .map((ref) => ref.getTargetReferrers())
        .flat()
        .filter(Boolean)[0];

      if (firstTarget) {
        this.ensureDefaultsForTarget(firstTarget);
      }
    }

    if (!this.props.dstPath) {
      this.props.dstPath = "";
    }
    if (!this.props.dstSubfolderSpec) {
      // Resources folder.
      this.props.dstSubfolderSpec = 7;
    }
    super.setupDefaults();
  }
}

export class PBXSourcesBuildPhase extends AbstractBuildPhase<
  json.PBXSourcesBuildPhase<PBXBuildFile>
> {
  static isa = json.ISA.PBXSourcesBuildPhase as const;
  static is(object: any): object is PBXSourcesBuildPhase {
    return object.isa === PBXSourcesBuildPhase.isa;
  }
}

export class PBXResourcesBuildPhase extends AbstractBuildPhase<
  json.PBXResourcesBuildPhase<PBXBuildFile>
> {
  static isa = json.ISA.PBXResourcesBuildPhase as const;
  static is(object: any): object is PBXResourcesBuildPhase {
    return object.isa === PBXResourcesBuildPhase.isa;
  }
}

export class PBXHeadersBuildPhase extends AbstractBuildPhase<
  json.PBXHeadersBuildPhase<PBXBuildFile>
> {
  static isa = json.ISA.PBXHeadersBuildPhase as const;
  static is(object: any): object is PBXHeadersBuildPhase {
    return object.isa === PBXHeadersBuildPhase.isa;
  }
}

export class PBXAppleScriptBuildPhase extends AbstractBuildPhase<
  json.PBXAppleScriptBuildPhase<PBXBuildFile>
> {
  static isa = json.ISA.PBXAppleScriptBuildPhase as const;
  static is(object: any): object is PBXAppleScriptBuildPhase {
    return object.isa === PBXAppleScriptBuildPhase.isa;
  }
}

export class PBXRezBuildPhase extends AbstractBuildPhase<
  json.PBXRezBuildPhase<PBXBuildFile>
> {
  static isa = json.ISA.PBXRezBuildPhase as const;
  static is(object: any): object is PBXRezBuildPhase {
    return object.isa === PBXRezBuildPhase.isa;
  }
}

export class PBXFrameworksBuildPhase extends AbstractBuildPhase<
  json.PBXFrameworksBuildPhase<PBXBuildFile>
> {
  static isa = json.ISA.PBXFrameworksBuildPhase as const;
  static is(object: any): object is PBXFrameworksBuildPhase {
    return object.isa === PBXFrameworksBuildPhase.isa;
  }
}

export class PBXShellScriptBuildPhase extends AbstractBuildPhase<
  json.PBXShellScriptBuildPhase<PBXBuildFile>
> {
  static isa = json.ISA.PBXShellScriptBuildPhase as const;
  static is(object: any): object is PBXShellScriptBuildPhase {
    return object.isa === PBXShellScriptBuildPhase.isa;
  }
  protected setupDefaults(): void {
    if (!this.props.shellPath) {
      this.props.shellPath = "/bin/sh";
    }
    if (!this.props.shellScript) {
      this.props.shellScript =
        "# Type a script or drag a script file from your workspace to insert its path.\n";
    }
    if (!this.props.outputFileListPaths) {
      this.props.outputFileListPaths = [];
    }
    if (!this.props.outputPaths) {
      this.props.outputPaths = [];
    }
    if (!this.props.inputFileListPaths) {
      this.props.inputFileListPaths = [];
    }
    if (!this.props.inputPaths) {
      this.props.inputPaths = [];
    }
    super.setupDefaults();
  }
}

export type AnyBuildPhase =
  | PBXCopyFilesBuildPhase
  | PBXSourcesBuildPhase
  | PBXResourcesBuildPhase
  | PBXHeadersBuildPhase
  | PBXAppleScriptBuildPhase
  | PBXRezBuildPhase
  | PBXFrameworksBuildPhase
  | PBXShellScriptBuildPhase;
