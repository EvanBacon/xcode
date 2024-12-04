import assert from "assert";
import * as json from "../json/types";
import { AbstractObject } from "./AbstractObject";
import type { SansIsa } from "./utils/util.types";
import { XcodeProject } from "./XcodeProject";
import { PBXFileReference } from "./PBXFileReference";
import type { PBXProject } from "./PBXProject";
import type { PBXReferenceProxy } from "./PBXReferenceProxy";

export type PBXContainerItemProxyModel = json.PBXContainerItemProxy<
  /** containerPortal */
  PBXReferenceProxy | PBXProject,
  /** remoteGlobalIDString */
  json.UUID
>;

export class PBXContainerItemProxy extends AbstractObject<PBXContainerItemProxyModel> {
  static isa = json.ISA.PBXContainerItemProxy as const;

  static is(object: any): object is PBXContainerItemProxy {
    return object.isa === PBXContainerItemProxy.isa;
  }

  static create(
    project: XcodeProject,
    opts: SansIsa<PBXContainerItemProxyModel>
  ) {
    return project.createModel<PBXContainerItemProxyModel>({
      isa: PBXContainerItemProxy.isa,
      ...opts,
    }) as PBXContainerItemProxy;
  }

  protected getObjectProps() {
    return {
      containerPortal: String,
      //   remoteGlobalIDString: PBXNativeTarget,
    };
  }

  getProxiedObject() {
    return this.getContainerPortalObject().get(this.props.remoteGlobalIDString);
  }

  getContainerPortalObject(): XcodeProject {
    if (this.isRemote()) {
      const containerPortalFileRef = this.getXcodeProject().get(
        this.props.containerPortal.uuid
      );
      assert(
        PBXFileReference.is(containerPortalFileRef),
        "containerPortal is not a PBXFileReference"
      );
      return XcodeProject.open(containerPortalFileRef.getRealPath());
    }
    return this.getXcodeProject();
  }

  /** @return `true` if this object points to a remote project. */
  isRemote() {
    return (
      this.getXcodeProject().rootObject.uuid !== this.props.containerPortal.uuid
    );
  }
}
