import assert from "assert";
import util from "util";

import * as json from "../json/types";
import type { PBXProject } from "./PBXProject";
import type { EntriesAnyValue, OnlyValuesOfType } from "./utils/util.types";
import type { XcodeProject } from "./XcodeProject";

const debug = require("debug")("xcparse:models") as typeof console.log;

type OrArray<T> = T | T[];

export interface ReferenceCapableObject {
  getReferrers(): AbstractObject[];
  isReferencing(uuid: string): boolean;
}

export abstract class AbstractObject<
  TJSON extends json.AbstractObject<any> = json.AbstractObject<any>
> implements ReferenceCapableObject
{
  get isa() {
    return this.props.isa;
  }

  // Indicates which properties must be inflated into objects.
  protected abstract getObjectProps(): Partial<{
    [K in keyof Omit<
      // TJSON,
      OnlyValuesOfType<TJSON, OrArray<AbstractObject<any>>>,
      // These string values can never be UUID.
      "isa" | "name"
    >]: any;
  }>;

  getReferrers(): AbstractObject[] {
    return this.getXcodeProject().getReferrers(this.uuid);
  }

  get project(): PBXProject {
    return this.getXcodeProject().rootObject;
  }

  getXcodeProject(): XcodeProject {
    return this.xcodeProject;
  }

  // @ts-expect-error: Using hack to prevent this from being indexed.
  private readonly xcodeProject: XcodeProject;

  constructor(
    xcodeProject: XcodeProject,
    public uuid: string,
    public props: TJSON
  ) {
    Object.defineProperty(this, "xcodeProject", {
      get() {
        return xcodeProject;
      },
    });

    debug(`Inflating model (uuid: ${uuid}, isa: ${props.isa})`);

    this.setupDefaults(props);
  }

  protected inflate() {
    // Start inflating based on the input props.
    for (const [key, type] of Object.entries(
      this.getObjectProps()
    ) as EntriesAnyValue<TJSON>) {
      // Preserve undefined or nullish
      if (!(key in this.props)) {
        continue;
      }

      const jsonValue = this.props[key];

      if (Array.isArray(jsonValue)) {
        // If the xcode json is not the expected type.
        assert(
          type === Array || Array.isArray(type),
          `'${String(
            key
          )}' MUST be of type Array but instead found type: ${typeof jsonValue}`
        );

        // @ts-expect-error
        this.props[key] = jsonValue
          .map((uuid: string) => {
            if (typeof uuid !== "string") {
              // Perhaps the model was already inflated.
              return uuid;
            }
            try {
              return this.getXcodeProject().getObject(uuid);
            } catch (error: any) {
              if (
                "message" in error &&
                error.message.includes("object with uuid")
              ) {
                console.warn(
                  `[Malformed Xcode project]: Found orphaned reference: ${
                    this.uuid
                  } > ${this.isa}.${String(key)} > ${uuid}`
                );
              } else {
                throw error;
              }
              return null;
            }
          })
          .filter(Boolean);
      } else if (jsonValue != null) {
        if (jsonValue instanceof AbstractObject) {
          this.props[key] = this.getXcodeProject().getObject(jsonValue.uuid);
          continue;
        }
        assert(
          typeof this.props[key] === "string",
          `'${String(
            key
          )}' MUST be of type string (UUID) but instead found type: ${typeof jsonValue}`
        );

        try {
          this.props[key] = this.getXcodeProject().getObject(
            // @ts-expect-error
            jsonValue
          );
        } catch (error: any) {
          if (
            "message" in error &&
            error.message.includes("object with uuid")
          ) {
            console.warn(
              `[Malformed Xcode project]: Found orphaned reference: ${
                this.uuid
              } > ${this.isa}.${String(key)} > ${jsonValue}`
            );
          } else {
            throw error;
          }
        }
      }
    }
  }

  protected setupDefaults(props: TJSON) {}

  getDisplayName(): string {
    if ("name" in this.props) {
      // @ts-expect-error
      return this.props.name;
    }
    return this.isa.replace(/^(PBX|XC)/, "");
  }

  /** @returns `true` if the provided UUID is used somewhere in the props. */
  isReferencing(uuid: string): boolean {
    return false;
  }

  //   abstract toJSON(): TObject;
  toJSON(): TJSON {
    assert(this.isa, "isa is not defined for " + this.uuid);
    debug("to JSON for", this.isa, this.uuid, this.constructor.name);
    const json = {
      ...this.props,
    };

    // Deflate models
    for (const key of Object.keys(this.getObjectProps()) as (keyof TJSON)[]) {
      if (key in this.props) {
        const value = this.props[key];
        let resolvedValue: undefined | string | string[] = undefined;
        if (isModelArray(value)) {
          const uuids = value.map((object) => object.uuid);
          resolvedValue = uuids;
        } else if (Array.isArray(value)) {
          throw new Error(
            util.format(
              "Unable to serialize array of unknown objects (some missing 'uuid' property): %O",
              value
            )
          );
        } else if (isModel(value)) {
          resolvedValue = value.uuid;
        }

        if (resolvedValue) {
          // @ts-expect-error: tried my best lol
          json[key] = resolvedValue;
        } else {
          console.warn(util.format("Unable to serialize object: %O", value));
        }
      }
    }

    return json as TJSON;
  }

  /** abstract method for removing a UUID from any props that might be referencing it. */
  removeReference(uuid: string) {}

  removeFromProject() {
    this.getXcodeProject().delete(this.uuid);

    const referrers = this.getReferrers();

    referrers.forEach((referrer) => {
      referrer.removeReference(this.uuid);
    });
  }
}

function isModelArray(value: any): value is { uuid: string }[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item.uuid === "string")
  );
}
function isModel(value: any): value is { isa: string; uuid: string } {
  return typeof value.uuid === "string" && typeof value.isa === "string";
}
