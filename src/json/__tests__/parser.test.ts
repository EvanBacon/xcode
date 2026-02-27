import { parse } from "..";
import path from "path";
import fs from "fs";

describe("parse", () => {
  it("should keep numeric object keys as strings", () => {
    const input = `{ 123 = abc; 456 = { 789 = def; }; }`;
    const result = parse(input) as any;

    expect(result).toEqual({
      "123": "abc",
      "456": {
        "789": "def",
      },
    });

    // Verify keys are strings, not numbers
    expect(typeof Object.keys(result)[0]).toBe("string");
    expect(typeof Object.keys(result)[1]).toBe("string");
    expect(typeof Object.keys(result["456"])[0]).toBe("string");
  });

  it("should handle quoted strings with escapes", () => {
    const input = `{ key = "hello\\nworld"; }`;
    const result = parse(input) as any;
    expect(result.key).toBe("hello\nworld");
  });

  it("should handle single quoted strings", () => {
    const input = `{ key = 'single quoted'; }`;
    const result = parse(input) as any;
    expect(result.key).toBe("single quoted");
  });

  it("should handle arrays", () => {
    const input = `{ arr = (one, two, three); }`;
    const result = parse(input) as any;
    expect(result.arr).toEqual(["one", "two", "three"]);
  });

  it("should handle nested objects", () => {
    const input = `{ outer = { inner = value; }; }`;
    const result = parse(input) as any;
    expect(result.outer.inner).toBe("value");
  });

  it("should handle comments", () => {
    const input = `{
      // single line comment
      key = value;
      /* multi
         line
         comment */
      key2 = value2;
    }`;
    const result = parse(input) as any;
    expect(result.key).toBe("value");
    expect(result.key2).toBe("value2");
  });

  it("should convert safe integers", () => {
    const input = `{ num = 42; large = 123456789012345678901234; }`;
    const result = parse(input) as any;
    expect(result.num).toBe(42);
    expect(typeof result.num).toBe("number");
    // Large numbers preserved as strings
    expect(typeof result.large).toBe("string");
  });

  it("should preserve octal literals", () => {
    const input = `{ perm = 0755; }`;
    const result = parse(input) as any;
    expect(result.perm).toBe("0755");
  });

  it("should handle data literals", () => {
    const input = `{ data = <48454C4C4F>; }`;
    const result = parse(input) as any;
    expect(Buffer.isBuffer(result.data)).toBe(true);
    expect(result.data.toString()).toBe("HELLO");
  });

  describe("error messages", () => {
    it("should provide line and column for missing brace", () => {
      expect(() => parse(`{ key = value; `)).toThrow(
        "Unexpected end of input in object at line 1, column 16"
      );
    });

    it("should provide line and column for missing semicolon", () => {
      expect(() => parse(`{ key = value }`)).toThrow(
        "Expected ';' at line 1, column 15"
      );
    });

    it("should provide line and column for unterminated string", () => {
      expect(() => parse(`{ key = "unterminated; }`)).toThrow(
        /Unterminated string at line 1/
      );
    });

    it("should handle empty input", () => {
      expect(() => parse(``)).toThrow("Expected '{' or '(' at line 1, column 1");
    });
  });

  const fixtures = [
    "01-float.pbxproj",
    "006-spm.pbxproj",
    "007-xcode16.pbxproj",
    "008-out-of-order-orphans.pbxproj",
    "009-expo-app-clip.pbxproj",
    "shopify-tophat.pbxproj",
    "AFNetworking.pbxproj",
    "project.pbxproj",
    "project-rn74.pbxproj",
    "Cocoa-Application.pbxproj",
    "project-multitarget-missing-targetattributes.pbxproj",
    "project-multitarget.pbxproj",
    "project-rni.pbxproj",
    "project-swift.pbxproj",
    "swift-protobuf.pbxproj",
    "watch.pbxproj",
  ];

  fixtures.forEach((fixture) => {
    const filePath = path.join(__dirname, "./fixtures/", fixture);
    const file = fs.readFileSync(filePath, "utf8");

    it(`should parse fixture: ${fixture}`, () => {
      const result = parse(file);
      expect(result).toBeTruthy();
      expect(result.archiveVersion).toBeDefined();
    });
  });
});
