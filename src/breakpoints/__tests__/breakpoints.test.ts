import { readFileSync } from "fs";
import path from "path";

import { parse, build } from "../index";
import type { XCBreakpointList } from "../types";

const fixturesDir = path.join(__dirname, "fixtures");

function readFixture(name: string): string {
  return readFileSync(path.join(fixturesDir, name), "utf-8");
}

describe("breakpoints parser", () => {
  describe("parse", () => {
    it("parses Breakpoints_v2.xcbkptlist", () => {
      const xml = readFixture("Breakpoints_v2.xcbkptlist");
      const list = parse(xml);

      expect(list.uuid).toBe("CC12345D-E789-4ABC-DEF0-123456789012");
      expect(list.type).toBe("1");
      expect(list.version).toBe("2.0");
      expect(list.breakpoints).toHaveLength(4);
    });

    it("parses file breakpoint", () => {
      const xml = readFixture("Breakpoints_v2.xcbkptlist");
      const list = parse(xml);

      const fileBreakpoint = list.breakpoints![0];
      expect(fileBreakpoint.breakpointExtensionID).toBe(
        "Xcode.Breakpoint.FileBreakpoint"
      );

      const content = fileBreakpoint.breakpointContent!;
      expect(content.uuid).toBe("AA12345B-C678-9DEF-0123-456789ABCDEF");
      expect(content.shouldBeEnabled).toBe(true);
      expect(content.ignoreCount).toBe(0);
      expect(content.continueAfterRunningActions).toBe(false);
      expect(content.filePath).toBe("MyApp/ViewController.swift");
      expect(content.startingLineNumber).toBe("42");
      expect(content.endingLineNumber).toBe("42");
      expect(content.landmarkName).toBe("viewDidLoad()");
      expect(content.landmarkType).toBe("7");
    });

    it("parses breakpoint with condition and actions", () => {
      const xml = readFixture("Breakpoints_v2.xcbkptlist");
      const list = parse(xml);

      const breakpoint = list.breakpoints![1];
      const content = breakpoint.breakpointContent!;

      expect(content.shouldBeEnabled).toBe(false);
      expect(content.ignoreCount).toBe(5);
      expect(content.continueAfterRunningActions).toBe(true);
      expect(content.condition).toBe("count > 10");

      // Actions
      expect(content.actions).toHaveLength(2);

      // Debugger command action
      const debugAction = content.actions![0];
      expect(debugAction.actionExtensionID).toBe(
        "Xcode.BreakpointAction.DebuggerCommand"
      );
      expect(debugAction.actionContent?.consoleCommand).toBe("po self");

      // Log action
      const logAction = content.actions![1];
      expect(logAction.actionExtensionID).toBe("Xcode.BreakpointAction.Log");
      expect(logAction.actionContent?.message).toBe(
        "Hit breakpoint at fetchData"
      );
      expect(logAction.actionContent?.conveyanceType).toBe("0");
    });

    it("parses symbolic breakpoint", () => {
      const xml = readFixture("Breakpoints_v2.xcbkptlist");
      const list = parse(xml);

      const symbolicBreakpoint = list.breakpoints![2];
      expect(symbolicBreakpoint.breakpointExtensionID).toBe(
        "Xcode.Breakpoint.SymbolicBreakpoint"
      );

      const content = symbolicBreakpoint.breakpointContent!;
      expect(content.symbolName).toBe("objc_exception_throw");
      expect(content.moduleName).toBe("");
    });

    it("parses exception breakpoint", () => {
      const xml = readFixture("Breakpoints_v2.xcbkptlist");
      const list = parse(xml);

      const exceptionBreakpoint = list.breakpoints![3];
      expect(exceptionBreakpoint.breakpointExtensionID).toBe(
        "Xcode.Breakpoint.ExceptionBreakpoint"
      );

      const content = exceptionBreakpoint.breakpointContent!;
      expect(content.scope).toBe("0");
      expect(content.stopOnStyle).toBe("0");
      expect(content.exceptionType).toBe("0");
    });
  });

  describe("build", () => {
    it("builds a basic breakpoint list", () => {
      const list: XCBreakpointList = {
        uuid: "TEST-UUID-1234",
        type: "1",
        version: "2.0",
        breakpoints: [
          {
            breakpointExtensionID: "Xcode.Breakpoint.FileBreakpoint",
            breakpointContent: {
              uuid: "BP-UUID-5678",
              shouldBeEnabled: true,
              ignoreCount: 0,
              continueAfterRunningActions: false,
              filePath: "MyApp/Main.swift",
              startingLineNumber: "10",
              endingLineNumber: "10",
            },
          },
        ],
      };

      const xml = build(list);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain("<Bucket");
      expect(xml).toContain('uuid = "TEST-UUID-1234"');
      expect(xml).toContain('type = "1"');
      expect(xml).toContain('version = "2.0"');
      expect(xml).toContain("<Breakpoints>");
      expect(xml).toContain(
        'BreakpointExtensionID = "Xcode.Breakpoint.FileBreakpoint"'
      );
      expect(xml).toContain('shouldBeEnabled = "Yes"');
      expect(xml).toContain('filePath = "MyApp/Main.swift"');
    });

    it("builds breakpoint with actions", () => {
      const list: XCBreakpointList = {
        uuid: "TEST-UUID",
        type: "1",
        version: "2.0",
        breakpoints: [
          {
            breakpointExtensionID: "Xcode.Breakpoint.FileBreakpoint",
            breakpointContent: {
              uuid: "BP-UUID",
              shouldBeEnabled: true,
              actions: [
                {
                  actionExtensionID: "Xcode.BreakpointAction.DebuggerCommand",
                  actionContent: {
                    consoleCommand: "po myVar",
                  },
                },
              ],
            },
          },
        ],
      };

      const xml = build(list);

      expect(xml).toContain("<Actions>");
      expect(xml).toContain(
        'ActionExtensionID = "Xcode.BreakpointAction.DebuggerCommand"'
      );
      expect(xml).toContain('consoleCommand = "po myVar"');
      expect(xml).toContain("</Actions>");
    });

    it("escapes XML special characters", () => {
      const list: XCBreakpointList = {
        uuid: "TEST",
        type: "1",
        version: "2.0",
        breakpoints: [
          {
            breakpointExtensionID: "Xcode.Breakpoint.FileBreakpoint",
            breakpointContent: {
              filePath: "Path/With<Special>&Chars.swift",
              condition: 'name == "test"',
            },
          },
        ],
      };

      const xml = build(list);

      expect(xml).toContain(
        'filePath = "Path/With&lt;Special&gt;&amp;Chars.swift"'
      );
      expect(xml).toContain('condition = "name == &quot;test&quot;"');
    });
  });

  describe("round-trip", () => {
    it("round-trips Breakpoints_v2.xcbkptlist", () => {
      const xml = readFixture("Breakpoints_v2.xcbkptlist");
      const list = parse(xml);
      const rebuilt = build(list);
      const reparsed = parse(rebuilt);

      // Deep equality check on the parsed structures
      expect(reparsed).toEqual(list);
    });
  });

  describe("parsing stability", () => {
    it("produces identical results on multiple parses", () => {
      const xml = readFixture("Breakpoints_v2.xcbkptlist");
      const parses = Array.from({ length: 5 }, () => parse(xml));

      for (let i = 1; i < parses.length; i++) {
        expect(parses[i]).toEqual(parses[0]);
      }
    });
  });
});
