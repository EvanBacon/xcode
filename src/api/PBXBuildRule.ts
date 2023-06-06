import * as json from "../json/types";
import type { SansIsa } from "./utils/util.types";
import type { XcodeProject } from "./XcodeProject";
import type { PBXFileReference } from "./PBXFileReference";
import { AbstractObject } from "./AbstractObject";

export class PBXBuildRule extends AbstractObject<
  json.PBXBuildRule<PBXFileReference, PBXFileReference>
> {
  static isa = json.ISA.PBXBuildRule as const;
  static is(object: any): object is PBXBuildRule {
    return object.isa === PBXBuildRule.isa;
  }
  static create(project: XcodeProject, opts: SansIsa<json.PBXBuildRule>) {
    return project.createModel<json.PBXBuildRule>({
      isa: PBXBuildRule.isa,
      ...opts,
    }) as PBXBuildRule;
  }
  protected getObjectProps() {
    return {
      inputFiles: [String],
      outputFiles: [String],
    };
  }
  protected setupDefaults(): void {
    if (this.props.isEditable == null) {
      this.props.isEditable = 1;
    }
  }

  /**
   * Adds an output file with the specified compiler flags.
   */
  addOutputFile(file: PBXFileReference, compilerFlags = "") {
    if (!this.props.outputFiles) {
      this.props.outputFiles = [];
    }
    this.props.outputFiles.push(file);
    if (!this.props.outputFilesCompilerFlags) {
      this.props.outputFilesCompilerFlags = [];
    }
    this.props.outputFilesCompilerFlags.push(compilerFlags);
  }

  getOutputFilesAndFlags() {
    return zip(this.props.outputFiles, this.props.outputFilesCompilerFlags);
  }
}

function zip<T, J>(arr: T[] = [], arr2: J[] = []): [T, J][] {
  return arr.map((a, i) => [a, arr2[i]]);
}
