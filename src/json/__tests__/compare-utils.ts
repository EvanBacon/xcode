// plutil -convert json ./src/json/__tests__/fixtures/AFNetworking.pbxproj

import spawnAsync from "@expo/spawn-async";
import fs from "fs";
import tempy from "tempy";

// Given the path to a pbxproj file, parse it into a JSON object using Apple's plutil utility and output the result to a temporary file,
// then read the file as JSON and return it.
export async function getPbxprojAsJsonWithPlutil(
  filePath: string
): Promise<any> {
  const tempJsonPath = tempy.file({ extension: "json" });
  await spawnAsync("plutil", [
    "-convert",
    "json",
    filePath,
    "-o",
    tempJsonPath,
  ]);
  const json = JSON.parse(await fs.promises.readFile(tempJsonPath, "utf8"));
  //   fs.unlinkSync(tempJsonPath);
  return json;
}

export function deepCompare(obj1: any, obj2: any): boolean {
  //Loop through properties in object 1
  for (var p in obj1) {
    //Check property exists on both objects
    if (obj1.hasOwnProperty(p) !== obj2.hasOwnProperty(p)) return false;

    switch (typeof obj1[p]) {
      //Deep compare objects
      case "object":
        if (!deepCompare(obj1[p], obj2[p])) return false;
        break;
      //Compare function code
      case "function":
        if (
          typeof obj2[p] == "undefined" ||
          (p != "compare" && obj1[p].toString() != obj2[p].toString())
        )
          return false;
        break;
      //Compare values
      default:
        if (obj1[p] != obj2[p]) return false;
    }
  }

  //Check object 2 for any extra properties
  for (var p in obj2) {
    if (typeof obj1[p] == "undefined") return false;
  }
  return true;
}
