import { parse, write } from "./src";
import fs from "fs";
import path from "path";

const pbxproj = fs.readFileSync(
  path.join(__dirname, "./src/__tests__/fixtures/project.pbxproj"),
  "utf8"
);

const project = parse(pbxproj);

console.log(project);

console.log(write(project));
