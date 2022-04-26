import { parse, write } from "./src";
import fs from "fs";
import path from "path";
import { inspect } from "util";

const pbxproj = fs.readFileSync(
  path.join(__dirname, "./src/__tests__/fixtures/swift-protobuf.pbxproj"),
  // path.join(__dirname, "./src/__tests__/fixtures/project.pbxproj"),
  "utf8"
);

const project = parse(pbxproj);

console.log(inspect(project, { depth: 6, colors: true }));

console.log(write(project));
