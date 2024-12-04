# `@bacons/xcode`

> This project is a ~~_work in progress_ / _proof of concept_~~ seemingly spec compliant `pbxproj` parser. The API is subject to breaking changes.

```
yarn add @bacons/xcode
```

> Website https://xcode-seven.vercel.app/

Here is a diagram of the grammar used for parsing:

<img width="1211" alt="Screen Shot 2022-04-25 at 12 39 27 PM" src="https://user-images.githubusercontent.com/9664363/165143651-a75e354c-e131-4ae9-bde8-876be7d430f5.png">

# Why

The most popular solution for parsing pbxproj files is a very old package by Cordova called [xcode](https://www.npmjs.com/package/xcode).

**But `xcode` has some major issues:**

- Inaccurate parsing: strings can be quoted incorrectly very often, lists often don't work.
- Outdated: values for App Clips, iMessage Sticker packs, etc are missing.
- Untyped: TypeScript is a crutch I proudly support.
- Slow: PEG.js is not very fast ([benchmark](https://chevrotain.io/performance/)).
- Feature Incomplete: Missing the `Data` type (`<xx xx xx>`).

## Format Comparison

Consider the following format comparison.

**Input `.pbxproj`**

```diff
307D28A1123043350040C0FA /* app-icon.png */ = {
  isa = PBXFileReference;
  lastKnownFileType = image.png;
  path = "app-icon.png";
  sourceTree = "<group>";
};
```

**`xcode` output (old)**

```json
{
  "307D28A1123043350040C0FA_comment": "app-icon.png",
  "308D052E1370CCF300D202BF": {
    "isa": "PBXFileReference",
    "lastKnownFileType": "image.png",
    "path": "\"app-icon.png\"",
    "sourceTree": "\"<group>\""
  }
}
```

That same object would look like this in `@bacons/xcode`:

**`@bacons/xcode` output (NEW)**

```json
{
  "308D052E1370CCF300D202BF": {
    "isa": "PBXFileReference",
    "lastKnownFileType": "image.png",
    "path": "app-icon.png",
    "sourceTree": "<group>"
  }
}
```

Notice how you don't need to strip or reapply quotes, you also don't need to filter out comments because the default visitor ignores comments in favor of regenerating them dynamically like Xcode does.

## API

There's an experimental mutable-graph layer which makes it much easier to work with pbxproj.

```ts
import {
  PBXAggregateTarget,
  PBXFrameworksBuildPhase,
  PBXLegacyTarget,
  PBXNativeTarget,
  XcodeProject,
} from "@bacons/xcode";

const project = XcodeProject.open("/path/to/project.pbxproj");

// Get all targets:
project.rootObject.props.targets;
```

Create a Swift file:

```ts
import { PBXBuildFile, PBXFileReference } from "@bacons/xcode";
import path from "path";

// Get `project` from XcodeProject.

const file = PBXBuildFile.create(project, {
  fileRef: PBXFileReference.create(project, {
    path: "MyFile.swift",
    sourceTree: "<group>",
  }),
});

// The file and fileRef will now be injected in the pbxproj `objects` dict.
```

## Solution

- Unlike the [xcode](https://www.npmjs.com/package/xcode) package which uses PEG.js, this implementation uses [Chevrotain](https://chevrotain.io/).
- This project support the Data type `<xx xx xx>`.
- Unopinionated: this could change in the future :] but if it does we'll use modern graph API patterns that are typed.
- This implementation also _appears_ to be more stable since we follow the [best guess pbxproj spec][spec].
- String parsing is the trickiest part. This package uses a port of the actual [CFOldStylePlist parser](http://www.opensource.apple.com/source/CF/CF-744.19/CFOldStylePList.c) which is an approach first used at scale by the [CocoaPods team](https://github.com/CocoaPods/Nanaimo/blob/master/lib/nanaimo/unicode/next_step_mapping.rb) (originally credited to [Samantha Marshall](https://github.com/samdmarshall/pbPlist/blob/346c29f91f913d35d0e24f6722ec19edb24e5707/pbPlist/StrParse.py#L197)).

# How

The parsing is very simple (simplicity is the key).

`pbxproj` is an "old-style plist" (or ASCII Plist), this means it should be possible to represent it as any other static configuration file type like JSON or XML.

We support the following types: `Object`, `Array`, `Data`, `String`. Notably, we avoid dealing with `Integer`, `Double`, Boolean since they appear to not exist in the format.

# TODO

- [x] Reading.
- [x] Writing.
- [x] Escaping scripts and header search paths.
- [x] Use a fork of chevrotain -- it's [way too large](https://packagephobia.com/result?p=chevrotain@10.1.2) for what it offers.
- [x] Generating UUIDs.
- [x] Reference-type API.
- [ ] Build setting parsing.
- [ ] Docs.

# Docs

Docs are in the works. For now, you can refer to the [types](./src/types.ts) and the estimated [`pbxproj` spec][spec].

The API will change in the future, for now we have two methods:

```ts
import {
  /** Given a stringified `pbxproj`, return a JSON representation of the object. */
  parse,
  /** Given a JSON representation of a `pbxproj`, return a `.pbxproj` string that can be parsed by Xcode. */
  build,
} from "@bacons/xcode/json";

import fs from "fs";
import path from "path";

const pbxproj = parse(fs.readFileSync("/path/to/project.pbxproj"));

const pbxprojString = build(pbxproj);
```

- `PBXVariantGroup` is a localized `PBXGroup`.

## File Path Resolution

Files will have an attribute `sourceTree` which indicates how the file path should be resolved.

- `BUILT_PRODUCTS_DIR`: Paths are relative to the built products directory.
- `DEVELOPER_DIR`: Paths are relative to the developer directory.
- `SOURCE_ROOT`: Paths are relative to the project.
- `SDKROOT`: Paths are relative to the SDK directory.
- `<group>`: Paths are relative to the group.
- `<absolute>`: Source is an absolute path.

For example, a file object like:

```json
{
  "isa": "PBXFileReference",
  "name": "AppDelegate.m",
  "path": "multitarget/AppDelegate.m",
  "sourceTree": "<group>"
}
```

Indicates that the `path` "multitarget/AppDelegate.m" is relative to `sourceTree` "<group>". We need to check the containing `PBXGroup`'s `path` (only defined when the group is linked to a directory in the file system). Groups can live inside of other groups so this process is recursive.

## Versioning

Certain values loosely map to each other. For instance the top-level `objectVersion` (which indicates the versioning used for the objects in the top-level `objects` dictionary), maps to the `rootObject` -> `PBXProject`'s `compatibilityVersion` string. Here is an up-to-date mapping (May 2022):

| `PBXProject.compatibilityVersion` | `XcodeProject.objectVersion` |
| --------------------------------- | ---------------------------- |
| `'Xcode 16.0'`                    | `70`                         |
| `'Xcode 15.0'`                    | `60`                         |
| `'Xcode 14.0'`                    | `56`                         |
| `'Xcode 13.0'`                    | `55`                         |
| `'Xcode 12.0'`                    | `54`                         |
| `'Xcode 11.4'`                    | `53`                         |
| `'Xcode 11.0'`                    | `52`                         |
| `'Xcode 10.0'`                    | `51`                         |
| `'Xcode 9.3'`                     | `50`                         |
| `'Xcode 8.0'`                     | `48`                         |
| `'Xcode 6.3'`                     | `47`                         |
| `'Xcode 3.2'`                     | `46`                         |
| `'Xcode 3.1'`                     | `45`                         |

[spec]: http://www.monobjc.net/xcode-project-file-format.html

# Attribution

- [Best guess API doc][spec].
- [CocoaPods/Xcodeproj](https://github.com/CocoaPods/Xcodeproj/).
