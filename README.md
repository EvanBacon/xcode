# xcparse

> This project is a _work in progress_ / _proof of concept_

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

### Solution

- Unlike the [xcode](https://www.npmjs.com/package/xcode) package which uses PEG.js, this implementation uses [Chevrotain](https://chevrotain.io/).
- This project support the Data type `<xx xx xx>`.
- Unopinionated: this could change in the future :] but if it does we'll use modern graph API patterns that are typed.
- This implementation also _appears_ to be more stable since we follow the [best guess pbxproj spec](http://www.monobjc.net/xcode-project-file-format.html).
- String parsing is the trickiest part. This package uses a port of the actual [CFOldStylePlist parser](http://www.opensource.apple.com/source/CF/CF-744.19/CFOldStylePList.c) which is an approach first used at scale by the [CocoaPods team](https://github.com/CocoaPods/Nanaimo/blob/master/lib/nanaimo/unicode/next_step_mapping.rb) (originally credited to [Samantha Marshall](https://github.com/samdmarshall/pbPlist/blob/346c29f91f913d35d0e24f6722ec19edb24e5707/pbPlist/StrParse.py#L197)).

# How

The parsing is very simple (avoiding overcomplication is the key).

`pbxproj` is an "old-style plist" (or ASCII Plist), this means it should be possible to represent it as any other static configuration file type like JSON or XML.

We support the following types: `Object`, `Array`, `Data`, `String`. Notably, we avoid dealing with `Integer`, `Double`, Boolean since they appear to not exist in the format.

# TODO

- [x] Reading.
- [x] Writing.
- [ ] Escaping scripts and header search paths.
- [ ] Generating UUIDs.
- [ ] The API would probably be implemented using [unist](https://github.com/syntax-tree/unist)
