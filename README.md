# xcparse

[![install size](https://packagephobia.com/badge?p=xcparse)](https://packagephobia.com/result?p=xcparse)

> This project is a ~~_work in progress_ / _proof of concept_~~ seemingly spec compliant `pbxproj` parser. The API is subject to breaking changes.

```
yarn add xcparse
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

Consider the following [output from the `xcode` package](https://github.com/apache/cordova-node-xcode/blob/8b98cabc5978359db88dc9ff2d4c015cba40f150/test/fixtures/full-project.json#L429-L435):

```json
{
  "307D28A1123043350040C0FA_comment": "PhoneGapBuildSettings.xcconfig",
  "308D052E1370CCF300D202BF": {
    "isa": "PBXFileReference",
    "lastKnownFileType": "image.png",
    "path": "\"icon-72.png\"",
    "sourceTree": "\"<group>\""
  }
}
```

That same object would look like this in `xcparse`:

```json
{
  "308D052E1370CCF300D202BF": {
    "isa": "PBXFileReference",
    "lastKnownFileType": "image.png",
    "path": "icon-72.png",
    "sourceTree": "<group>"
  }
}
```

Notice how you don't need to strip or reapply quotes, you also don't need to filter out comments because the default visitor ignores comments in favor of regenerating them dynamically like Xcode does.

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
- [ ] Generating UUIDs.
- [ ] The API would probably be implemented using [unist](https://github.com/syntax-tree/unist)
- [ ] Docs

# Docs

Docs are in the works. For now, you can refer to the [types](./src/types.ts) and the estimated [`pbxproj` spec][spec].

The API will change in the future, for now we have two methods:

```ts
import {
  /** Given a stringified `pbxproj`, return a JSON representation of the object. */
  parse,
  /** Given a JSON representation of a `pbxproj`, return a `.pbxproj` string that can be parsed by Xcode. */
  build,
} from "xctrace";

import fs from "fs";
import path from "path";

const pbxproj = parse(fs.readFileSync("/path/to/project.pbxproj"));

const pbxprojString = build(pbxproj);
```

- `PBXVariantGroup` is a localized `PBXGroup`.

[spec]: http://www.monobjc.net/xcode-project-file-format.html

# Attribution

- [Best guess API doc][spec].
- [CocoaPods/Xcodeproj](https://github.com/CocoaPods/Xcodeproj/).
