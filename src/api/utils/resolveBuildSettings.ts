import path from "node:path";

export function resolveXcodeBuildSetting(
  value: string,
  lookup: (buildSetting: string) => string | undefined
): string {
  const parsedValue = value?.replace(/\$\(([^()]*|\([^)]*\))\)/g, (match) => {
    // Remove the `$(` and `)`, then split modifier(s) from the variable name.
    const [variable, ...transformations] = match.slice(2, -1).split(":");
    // Resolve the variable recursively.
    let lookedUp = lookup(variable);
    if (lookedUp) {
      lookedUp = resolveXcodeBuildSetting(lookedUp, lookup);
    }
    let resolved = lookedUp;

    // Ref: http://codeworkshop.net/posts/xcode-build-setting-transformations
    transformations.forEach((modifier) => {
      switch (modifier) {
        case "lower":
          // A lowercase representation.
          resolved = resolved?.toLowerCase();
          break;
        case "upper":
          // An uppercase representation.
          resolved = resolved?.toUpperCase();
          break;
        case "suffix":
          if (resolved) {
            // The extension of a path including the '.' divider.
            resolved = path.extname(resolved);
          }
          break;
        case "file":
          if (resolved) {
            // The file portion of a path.
            resolved = path.basename(resolved);
          }
          break;
        case "dir":
          if (resolved) {
            // The directory portion of a path.
            resolved = path.dirname(resolved);
          }
          break;
        case "base":
          if (resolved) {
            // The base name of a path - the last path component with any extension removed.
            const b = path.basename(resolved);
            const extensionIndex = b.lastIndexOf(".");
            resolved = extensionIndex === -1 ? b : b.slice(0, extensionIndex);
          }
          break;
        case "rfc1034identifier":
          // A representation suitable for use in a DNS name.

          // TODO: Check the spec if there is one, this is just what we had before.
          resolved = resolved?.replace(/[^a-zA-Z0-9]/g, "-");
          // resolved = resolved.replace(/[\/\*\s]/g, '-');
          break;
        case "c99extidentifier":
          // Like identifier, but with support for extended characters allowed by C99. Added in Xcode 6.
          // TODO: Check the spec if there is one.
          resolved = resolved?.replace(/[-\s]/g, "_");
          break;
        case "standardizepath":
          if (resolved) {
            // The equivalent of calling stringByStandardizingPath on the string.
            // https://developer.apple.com/documentation/foundation/nsstring/1407194-standardizingpath
            resolved = path.resolve(resolved);
          }
          break;
        default:
          resolved ||= modifier.match(/default=(.*)/)?.[1];
          break;
      }
    });

    return resolveXcodeBuildSetting(resolved ?? "", lookup);
  });

  if (parsedValue !== value) {
    return resolveXcodeBuildSetting(parsedValue, lookup);
  }
  return value;
}
