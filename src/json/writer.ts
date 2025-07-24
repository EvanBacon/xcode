import {
  createReferenceList,
  isPBXBuildFile,
  isPBXFileReference,
} from "./comments";
import { PBXBuildFile, PBXFileReference, XcodeProject } from "./types";

// Simplified quote mapping for essential characters
const QUOTE_MAP: Record<string, string> = {
  '\x07': '\\a', '\b': '\\b', '\f': '\\f', '\r': '\\r', '\t': '\\t', '\v': '\\v', 
  '\n': '\\n', '"': '\\"', '\\': '\\\\',
  '\x00': '\\U0000', '\x01': '\\U0001', '\x02': '\\U0002', '\x03': '\\U0003',
  '\x04': '\\U0004', '\x05': '\\U0005', '\x06': '\\U0006', '\x0E': '\\U000e',
  '\x0F': '\\U000f', '\x10': '\\U0010', '\x11': '\\U0011', '\x12': '\\U0012',
  '\x13': '\\U0013', '\x14': '\\U0014', '\x15': '\\U0015', '\x16': '\\U0016',
  '\x17': '\\U0017', '\x18': '\\U0018', '\x19': '\\U0019', '\x1A': '\\U001a',
  '\x1B': '\\U001b', '\x1C': '\\U001c', '\x1D': '\\U001d', '\x1E': '\\U001e',
  '\x1F': '\\U001f'
};

const QUOTE_REGEXP = /\x07|\x08|\f|\r|\t|\v|\n|"|\\|\x00|\x01|\x02|\x03|\x04|\x05|\x06|\x0E|\x0F|\x10|\x11|\x12|\x13|\x14|\x15|\x16|\x17|\x18|\x19|\x1A|\x1B|\x1C|\x1D|\x1E|\x1F/g;

function addQuotes(string: string): string {
  return String(string).replace(QUOTE_REGEXP, (sub) => QUOTE_MAP[sub] || sub);
}

let EOL = "\n";

try {
  EOL = require("os").EOL;
} catch {}

export type JSONPrimitive =
  | boolean
  | number
  | string
  | null
  | Buffer
  | undefined;

export type JSONValue = JSONPrimitive | JSONArray | JSONObject;

export interface JSONArray extends Array<JSONValue> {}

export interface JSONObject {
  [key: string]: JSONValue | undefined;
}

function isObject(value: any): value is JSONObject {
  return (
    typeof value === "object" && value !== null && !(value instanceof Buffer)
  );
}

/** Ensure string values that use invalid characters are wrapped in quotes. */
function ensureQuotes(value: any): string {
  value = addQuotes(value);

  // Seems like no hyphen is the wehhh
  if (/^[\w_$/:.]+$/.test(value)) {
    //   if (/^[\w_$/:.-]+$/.test(value)) {
    return value;
  }
  return `"${value}"`;
}

// TODO: How to handle buffer? <xx xx xx>
function formatData(data: Buffer): string {
  return `<${data.toString()}>`;
}

function getSortedObjects(objects: Record<string, any>) {
  const sorted: Record<
    string,
    [string, { isa: string } & Record<string, any>][]
  > = {};

  // sort by isa
  Object.entries(objects).forEach(([id, object]) => {
    if (!sorted[object.isa]) {
      sorted[object.isa] = [];
    }
    sorted[object.isa].push([id, object]);
  });

  // alphabetize by isa like Xcode
  return Object.entries(sorted).sort();
}

export class Writer {
  private indent = 0;
  private contents: string = "";
  private comments: { [key: string]: string } = {};

  pad(x: number): string {
    // \t might also work...
    const tab = this.options.tab ?? "\t";
    return x > 0 ? tab + this.pad(x - 1) : "";
    // return x > 0 ? "    " + pad(x - 1) : "";
  }

  constructor(
    private project: Partial<XcodeProject>,
    private options: {
      /** @default `\t`` */
      tab?: string;
      /** @default `!$*UTF8*$!` */
      shebang?: string;
      /** @default `false` */
      skipNullishValues?: boolean;
    } = {}
  ) {
    this.comments = createReferenceList(project);
    this.writeShebang();
    this.writeProject();
  }

  public getResults() {
    return this.contents;
  }

  private println(string?: JSONPrimitive) {
    this.contents += this.pad(this.indent);
    this.contents += string;
    this.contents += EOL;
  }

  private write(string?: JSONPrimitive) {
    this.contents += this.pad(this.indent);
    this.contents += string;
  }

  private printAssignLn(key: string, value: string) {
    return this.println(key + " = " + value + ";");
  }

  private flush(string?: JSONPrimitive) {
    const current = this.indent;
    this.indent = 0;
    this.write(string);
    this.indent = current;
  }

  private writeShebang() {
    const headComment = this.options?.shebang ?? "!$*UTF8*$!";
    this.println(`// ${headComment}`);
  }

  /** Format ID with optional comment reference. */
  private formatId(id: string, cmt: string = this.comments[id]) {
    if (cmt) {
      // 13B07F961A680F5B00A75B9A /* yolo87.app */
      return `${id} /* ${cmt} */`;
    }
    // If there is no reference then we might need to wrap with quotes.
    return ensureQuotes(id);
  }

  private writeProject() {
    this.println("{");
    if (this.project) {
      this.indent++;
      this.writeObject(this.project as any, true);
      this.indent--;
    }
    this.println("}");
  }

  private keyHasFloatValue(key: string) {
    return (
      key === key.toUpperCase() &&
      (key.endsWith("SWIFT_VERSION") ||
        key.endsWith("MARKETING_VERSION") ||
        key.endsWith("_DEPLOYMENT_TARGET"))
    );
  }

  private writeObject(object: JSONObject, isBase?: boolean) {
    Object.entries(object).forEach(([key, value]) => {
      if (this.options.skipNullishValues && value == null) {
        return;
      } else if (value instanceof Buffer) {
        this.printAssignLn(ensureQuotes(key), formatData(value));
      } else if (Array.isArray(value)) {
        this.writeArray(key, value);
      } else if (isObject(value)) {
        // Deeper empty objects should be inlined.
        if (!isBase && !Object.keys(value).length) {
          this.println(ensureQuotes(key) + " = {};");
          return;
        }

        this.println(ensureQuotes(key) + " = {");
        this.indent++;
        if (isBase && key === "objects") {
          this.writePbxObjects(value);
        } else {
          this.writeObject(value, isBase);
        }
        this.indent--;
        this.println("};");
      } else if (typeof value === "number") {
        const valueWithDot =
          this.keyHasFloatValue(key) && Number.isInteger(value)
            ? `${value}.0`
            : value;
        this.printAssignLn(ensureQuotes(key), ensureQuotes(valueWithDot));
      } else {
        this.printAssignLn(
          ensureQuotes(key),
          key === "remoteGlobalIDString" || key === "TestTargetID"
            ? ensureQuotes(value)
            : this.formatId(value as any)
        );
      }
    });
  }

  private writePbxObjects(projectObjects: any): void {
    getSortedObjects(projectObjects).forEach(([isa, objects]) => {
      this.flush(EOL);
      this.flush(`/* Begin ${isa} section */` + EOL);
      // Xcode sorts the objects alphabetically by ID for each section.
      objects
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([id, obj]) => this.writeObjectInclusive(id, obj));
      this.flush(`/* End ${isa} section */` + EOL);
    });
  }

  private writeArray(key: string, value: JSONArray) {
    this.println(ensureQuotes(key) + " = (");
    this.indent++;

    value.forEach((item) => {
      // TODO: Nested arrays?
      if (item instanceof Buffer) {
        this.println(formatData(item) + ",");
      } else if (item == null) {
        return;
      } else if (isObject(item)) {
        this.println("{");
        if (item) {
          this.indent++;
          this.writeObject(item);
          this.indent--;
        }
        this.println("},");
      } else {
        this.println(this.formatId(String(item)) + ",");
      }
    });

    this.indent--;
    this.println(");");
  }

  private writeObjectInclusive(key: string, value: any) {
    if (isPBXBuildFile(value) || isPBXFileReference(value)) {
      return this.writeObjectWithoutIndent(key, value);
    }

    this.println(this.formatId(key) + " = {");
    /* foo = { */
    this.indent++;
    /*  */ this.writeObject(value);
    this.indent--;
    /* }; */
    this.println("};");
  }

  private writeObjectWithoutIndent(
    key: string,
    value: PBXBuildFile | PBXFileReference
  ) {
    const line: string[] = [];

    const buildInline = (
      key: string,
      value: PBXBuildFile | PBXFileReference | JSONObject
    ) => {
      line.push(this.formatId(key) + " = {");

      Object.entries(value).forEach(([key, obj]) => {
        if (this.options.skipNullishValues && obj == null) {
          return;
        } else if (obj instanceof Buffer) {
          line.push(ensureQuotes(key) + " = " + formatData(obj) + "; ");
        } else if (Array.isArray(obj)) {
          line.push(ensureQuotes(key) + " = (");
          obj.forEach((item) => line.push(ensureQuotes(item) + ", "));
          line.push("); ");
        } else if (isObject(obj)) {
          buildInline(key, obj);
        } else {
          line.push(ensureQuotes(key) + " = " + this.formatId(obj) + "; ");
        }
      });

      line.push("}; ");
    };

    buildInline(key, value);

    this.println(line.join("").trim());
  }
}
