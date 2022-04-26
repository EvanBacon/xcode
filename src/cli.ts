import fs from "fs";
import path from "path";

import { parse } from "./lib/parser/parser";
import { ContextVisitor } from "./lib/visitor/contextVisitor";
import { Writer } from "./lib/writer";

function parseXcode(text: string) {
  const cst = parse(text);
  const visitor = new ContextVisitor();
  visitor.visit(cst);
  return visitor.context;
}

// const { ["ios/ReactNativeProject.xcodeproj/project.pbxproj"]: pbxprojString } =
//   require("./fixture").default;

const pbxprojString = fs.readFileSync(
  path.join(
    __dirname,
    "__tests__/fixtures/project-swift.pbxproj"
    // "__tests__/fixtures/project-multitarget-missing-targetattributes.pbxproj"
  ),
  "utf8"
);

console.time("parse");
const fixture = parseXcode(pbxprojString);
console.timeEnd("parse");

console.time("write");
const writer = new Writer(fixture);
console.timeEnd("write");
console.log(writer.getResults());
