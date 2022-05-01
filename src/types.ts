/** Elements: http://www.monobjc.net/xcode-project-file-format.html */
export enum ISA {
  PBXBuildFile = "PBXBuildFile",
  PBXBuildPhase = "PBXBuildPhase",
  /*-*/ PBXAppleScriptBuildPhase = "PBXAppleScriptBuildPhase",
  /*-*/ PBXCopyFilesBuildPhase = "PBXCopyFilesBuildPhase",
  /*-*/ PBXFrameworksBuildPhase = "PBXFrameworksBuildPhase",
  /*-*/ PBXHeadersBuildPhase = "PBXHeadersBuildPhase",
  /*-*/ PBXResourcesBuildPhase = "PBXResourcesBuildPhase",
  /*-*/ PBXShellScriptBuildPhase = "PBXShellScriptBuildPhase",
  /*-*/ PBXSourcesBuildPhase = "PBXSourcesBuildPhase",
  PBXContainerItemProxy = "PBXContainerItemProxy",
  PBXFileElement = "PBXFileElement",
  /*-*/ PBXFileReference = "PBXFileReference",
  /*-*/ PBXGroup = "PBXGroup",
  /*---*/ PBXVariantGroup = "PBXVariantGroup",
  /*---*/ XCVersionGroup = "XCVersionGroup",
  PBXTarget = "PBXTarget",
  /*-*/ PBXNativeTarget = "PBXNativeTarget",
  /*-*/ PBXAggregateTarget = "PBXAggregateTarget",
  /*-*/ PBXLegacyTarget = "PBXLegacyTarget",
  PBXProject = "PBXProject",
  PBXTargetDependency = "PBXTargetDependency",
  XCBuildConfiguration = "XCBuildConfiguration",
  XCConfigurationList = "XCConfigurationList",

  // ??
  PBXBuildRule = "PBXBuildRule",
  PBXReferenceProxy = "PBXReferenceProxy",
  PBXRezBuildPhase = "PBXRezBuildPhase",
}

/** Indicates the relationship between a path and the project/system. */
export type SourceTree =
  // Paths are relative to the built products directory.
  | "BUILT_PRODUCTS_DIR"
  // Paths are relative to the developer directory.
  | "DEVELOPER_DIR"
  // Paths are relative to the project.
  | "SOURCE_ROOT"
  // Paths are relative to the SDK directory.
  | "SDKROOT"
  // Paths are relative to the group.
  | "<group>"
  // Source is an absolute path.
  | "<absolute>";

/** UTI for product types. */
export type PBXProductType =
  | "com.apple.product-type.application"
  | "com.apple.product-type.application.on-demand-install-capable"
  | "com.apple.product-type.framework"
  | "com.apple.product-type.library.dynamic"
  | "com.apple.product-type.library.static"
  | "com.apple.product-type.bundle"
  | "com.apple.product-type.bundle.unit-test"
  | "com.apple.product-type.bundle.ui-testing"
  | "com.apple.product-type.app-extension"
  | "com.apple.product-type.tool"
  | "com.apple.product-type.application.watchapp"
  | "com.apple.product-type.application.watchapp2"
  | "com.apple.product-type.application.watchapp2-container"
  | "com.apple.product-type.watchkit-extension"
  | "com.apple.product-type.watchkit2-extension"
  | "com.apple.product-type.tv-app-extension"
  | "com.apple.product-type.application.messages"
  | "com.apple.product-type.app-extension.messages"
  | "com.apple.product-type.app-extension.messages-sticker-pack"
  | "com.apple.product-type.xpc-service"
  | "com.apple.product-type.kernel-extension.iokit"
  | "com.apple.product-type.in-app-purchase-content"
  | "com.apple.product-type.kernel-extension";

export type BoolString = "YES" | "NO" | "YES_ERROR" | "YES_AGGRESSIVE";

type UUID = string;

// `PBXCopyFilesBuildPhase` destinations.
export enum SubFolder {
  absolutePath = 0,
  productsDirectory = 16,
  wrapper = 1,
  executables = 6,
  resources = 7,
  javaResources = 15,
  frameworks = 10,
  sharedFrameworks = 11,
  sharedSupport = 12,
  plugins = 13,
  // other,
}

export interface ObjectPrimitive<TISA extends ISA> {
  isa: TISA;
}

export interface XcodeProject {
  archiveVersion: string;
  classes: Record<string, any>;
  objectVersion: string;
  objects: Record<string, ObjectPrimitive<any>>;
  rootObject: string;
}

export interface PBXFileElement<TISA extends ISA = ISA.PBXFileElement>
  extends ObjectPrimitive<TISA> {
  /** `path` is relative to the position defined in `sourceTree`. */
  sourceTree: SourceTree;
  /**
   * Name of group. If `path` is defined, this property will not be.
   *
   * @example `CPDocument.xcdatamodeld`
   */
  name?: string;
  /**
   * Path in file system relative to `sourceTree`.
   * This is only used if the group is linked to a directory in the file system.
   *
   * @example `Cocoa Application/CPDocument.xcdatamodeld`
   */
  path?: string;
}

export interface PBXFileReference extends PBXFileElement<ISA.PBXFileReference> {
  /** Used by Xcode to generate 'products'. */
  explicitFileType?: string;
  /** Only present when `explicitFileType` is not present. */
  lastKnownFileType?: string;

  /** Of type `0` or `1`. */
  includeInIndex?: NumericBoolean;

  /** A number representing the encoding format. */
  fileEncoding?: number;

  /** Indicates the type of language highlighting to use in Xcode. @example `xcode.lang.swift` */
  xcLanguageSpecificationIdentifier?:
    | "xcode.lang.otd"
    | "xcode.lang.c"
    | "xcode.lang.cpp"
    | "xcode.lang.objc"
    | "xcode.lang.objcpp"
    | "xcode.lang.swift"
    | string;

  /** Indicates the structure of a plist file. */
  plistStructureDefinitionIdentifier?: string;

  /** @example `4` `2` */
  indentWidth?: string;
  /** @example `4` `2` */
  tabWidth?: string;
  /** @example `0` */
  usesTabs?: NumericBoolean;
  /**
   * Should Xcode wrap lines.
   *
   * @example `1`
   */
  wrapsLines?: NumericBoolean;
  /** Indicating if Xcode should save a file with a new line at the end. */
  lineEnding?: NumericBoolean;
}

/** A group that contains other groups and files. */

export interface PBXGroup<TISA extends ISA = ISA.PBXGroup>
  extends PBXFileElement<TISA> {
  /** List of UUIDs for objects of type `<PBXGroup|PBXReferenceProxy|PBXFileReference>` */
  children: UUID[];
  /** @example `4` `2` */
  indentWidth?: number;
  /** @example `4` `2` */
  tabWidth?: number;
  /** @example `0` */
  usesTabs?: NumericBoolean;
  /**
   * Should Xcode wrap lines.
   *
   * @example `1`
   */
  wrapsLines?: NumericBoolean;
}

/** Object for referencing localized resources. */
export interface PBXVariantGroup extends PBXGroup<ISA.PBXVariantGroup> {}

export interface XCVersionGroup extends PBXGroup<ISA.XCVersionGroup> {
  /** UUID for a `PBXBuildFile` (should also be included in the `children` array). */
  currentVersion: UUID[];

  versionGroupType: "wrapper.xcdatamodel" | string;
}

/** Abstract parent for custom build phases. */

export interface PBXBuildPhase<TISA extends ISA = ISA.PBXBuildPhase>
  extends ObjectPrimitive<TISA> {
  /** @example `2147483647` */
  buildActionMask: number | 2147483647 | 8 | 12;
  /** List of UUIDs for objects of type `PBXBuildFile` that should be processed in the phase. */
  files: UUID[];
  /**
   * If the phase should be processed before deployment.
   *
   * In Xcode this is displayed as:
   * - 'Copy only when installing' for `PBXCopyFilesBuildPhase`
   * - 'Run script only when installing' for `PBXShellScriptBuildPhase`
   */
  runOnlyForDeploymentPostprocessing: NumericBoolean;

  /**
   * If the phase should be force processed on every build, including incremental builds.
   *
   * In Xcode this is displayed as:
   * - 'Based on dependency analysis' for `PBXShellScriptBuildPhase`
   */
  alwaysOutOfDate?: 1;
}

/**
 * Copies files to the bundle.
 *
 * - 'Copy Files' in Xcode.
 * - Can be used multiple times per target.
 */
export interface PBXCopyFilesBuildPhase
  extends PBXBuildPhase<ISA.PBXCopyFilesBuildPhase> {
  /** @example `Embed App Extensions` */
  name?: string;
  /** Subpath for evaluated `dstSubfolderSpec` folder. */
  dstPath: string;
  /**
   * Path where the files are copied to.
   * @example `13`
   */
  dstSubfolderSpec: SubFolder;
}

/**
 * Compiles files.
 *
 * - 'Compile Sources' in Xcode.
 * - Can only be used once per target.
 */
export interface PBXSourcesBuildPhase
  extends PBXBuildPhase<ISA.PBXSourcesBuildPhase> {}

/**
 * An Xcode-managed version of `PBXCopyFilesBuildPhase`.
 *
 * - 'Copy Bundle Resources' in Xcode.
 * - Can only be used once per target.
 */
export interface PBXResourcesBuildPhase
  extends PBXBuildPhase<ISA.PBXResourcesBuildPhase> {}

/**
 * Copies headers.
 *
 * - 'Copy Headers' in Xcode.
 * - Can only be used once per target.
 */
export interface PBXHeadersBuildPhase
  extends PBXBuildPhase<ISA.PBXHeadersBuildPhase> {}

/**
 *
 * - ?? in Xcode.
 * - ??
 */
export interface PBXAppleScriptBuildPhase
  extends PBXBuildPhase<ISA.PBXAppleScriptBuildPhase> {}

/**
 * - 'Build Carbon Resources' in Xcode.
 * - Can be used multiple times per target.
 */
export interface PBXRezBuildPhase extends PBXBuildPhase<ISA.PBXRezBuildPhase> {}

/**
 * - 'Link Binary With Libraries' in Xcode.
 * - Can only be used once per target.
 */
export interface PBXFrameworksBuildPhase
  extends PBXBuildPhase<ISA.PBXFrameworksBuildPhase> {}

/**
 * Runs a shell script.
 *
 * - 'Run Script' in Xcode.
 * - Can be used multiple times per target.
 */
export interface PBXShellScriptBuildPhase
  extends PBXBuildPhase<ISA.PBXShellScriptBuildPhase> {
  /** @example `Embed App Extensions` */
  name?: string;
  inputPaths: string[];
  outputPaths: string[];
  /** Path to script interpreter. @example `/bin/sh` */
  shellPath: string;
  /** Script to run, defaults to a comment. */
  shellScript?: string;
  inputFileListPaths?: string[];
  outputFileListPaths?: string[];
  /** If the environment variables should be printed in the build log of `xcodebuild`. */
  showEnvVarsInLog?: NumericBoolean;

  dependencyFile?: string;
}

export interface PBXBuildRule extends ObjectPrimitive<ISA.PBXBuildRule> {
  name?: string;

  /** Indicates which compiler to use. */
  compilerSpec: "com.apple.compilers.proxy.script" | string;
  /** Discovered dependency file. */
  dependencyFile?: string;
  /** Type of files that should be processed by the rule. */
  fileType?: string | "pattern.proxy" | "wrapper.xcclassmodel";
  /**
   * Used to target files by a pattern. An alternate query to `fileType`.
   * @example `*.css`
   */
  filePatterns?: string;
  /** If the rule can be edited. */
  isEditable: NumericBoolean;

  /** List of UUIDs for objects of type `PBXFileReference` for input to the rule. */
  inputFiles?: UUID[];

  /**
   * List of UUIDs for objects of type `PBXFileReference` for output to the rule.
   *
   * @example `["${INPUT_FILE_BASE}.css.c"]`
   */
  outputFiles: UUID[];
  outputFilesCompilerFlags?: string[];

  runOncePerArchitecture?: NumericBoolean;

  /** This attribute is present if `compilerSpec: 'com.apple.compilers.proxy.script'`. */
  script?: string;
}

// Discovered in Cocoa-Application.pbxproj
export interface PBXReferenceProxy
  extends PBXFileElement<ISA.PBXReferenceProxy> {
  /** Type of the referenced file. */
  fileType: "wrapper.application" | string;

  /** UUID to an object of type `PBXContainerItemProxy`. */
  remoteRef: UUID;
}

export type NumericBoolean = 0 | 1;

/** Legacy target for use with external build tools. */
export interface PBXLegacyTarget extends PBXTarget<ISA.PBXLegacyTarget> {
  buildWorkingDirectory: string;
  buildArgumentsString: string;
  passBuildSettingsInEnvironment: NumericBoolean;
  buildToolPath: string;
}

/** This is the element for a build target that aggregates several others. */
export interface PBXAggregateTarget extends PBXTarget<ISA.PBXAggregateTarget> {}

/** A target used in Xcode */
export interface PBXNativeTarget extends PBXTarget<ISA.PBXNativeTarget> {
  /** List of UUIDs for objects of type `PBXBuildRule` */
  buildRules: UUID[];
  /** Build product type ID. */
  productType: PBXProductType;
  /** UUID */
  productReference?: UUID;
  /** @example `$(HOME)/bin` */
  productInstallPath?: string;
  /** List of UUID for object of type `XCSwiftPackageProductDependency` */
  packageProductDependencies?: UUID[];
}

/** Info about build settings for a file in a `PBXBuildPhase`. */
export interface PBXBuildFile extends ObjectPrimitive<ISA.PBXBuildFile> {
  /** UUID for an object of type <PBXFileReference|PBXGroup|PBXVariantGroup|XCVersionGroup|PBXReferenceProxy> */
  fileRef: UUID;
  settings?: Record<string, any>;

  /** UUID for a `XCSwiftPackageProductDependency` (Swift Package) file. */
  productRef?: UUID;

  platformFilter?: string;
}

export enum ProxyType {
  targetReference = 1,
  reference = 2,
}

export interface PBXContainerItemProxy
  extends ObjectPrimitive<ISA.PBXContainerItemProxy> {
  containerPortal: string;
  /** @example `1` */
  proxyType: ProxyType;
  /** UUID */
  remoteGlobalIDString: UUID;
  remoteInfo?: string;
}

/** This element is an abstract parent for specialized targets. */
export interface PBXTarget<
  TTargetIsa extends
    | ISA.PBXAggregateTarget
    | ISA.PBXLegacyTarget
    | ISA.PBXNativeTarget
> extends ObjectPrimitive<TTargetIsa> {
  name: string;
  productName?: string;
  /** UUID for object of type `XCConfigurationList`. */
  buildConfigurationList: UUID;
  /** List of UUIDs for objects of type `PBXTargetDependency`. */
  dependencies: UUID[];
  /** List of `PBXBuildPhase` UUIDs. UUIDs pointing to objects of type `<PBXShellScriptBuildPhase|PBXCopyFilesBuildPhase>` can only appear once at most. */
  buildPhases: UUID[];
}
export interface PBXTargetDependency
  extends ObjectPrimitive<ISA.PBXTargetDependency> {
  /** Target UUID for object of type `PBXTarget` that must be built for the dependency. */
  target: UUID;
  /** UUID for an object of type `PBXContainerItemProxy` that must be built for the dependency. Used for cross workspace projects. */
  targetProxy: UUID;

  /** Name of the target, rarely used. */
  name?: string;

  platformFilter?: string;
  platformFilters?: string[];

  productRef?: string;
}

export interface XCConfigurationList
  extends ObjectPrimitive<ISA.XCConfigurationList> {
  /** List of UUIDs to objects of type `XCBuildConfiguration` */
  buildConfigurations: UUID[];
  defaultConfigurationIsVisible: NumericBoolean;
  defaultConfigurationName: string;
}

export interface XCBuildConfiguration
  extends ObjectPrimitive<ISA.XCBuildConfiguration> {
  /** UUID pointing to reference configuration file of type `.xcconfig`. */
  baseConfigurationReference: UUID;
  buildSettings: BuildSettings;
  /** configuration name. */
  name: string;
}

// const COMPATIBILITY_VERSION_BY_OBJECT_VERSION = Object.freeze({
//   55: 'Xcode 13.0',
//   54: 'Xcode 12.0',
//   53: 'Xcode 11.4',
//   52: 'Xcode 11.0',
//   51: 'Xcode 10.0',
//   50: 'Xcode 9.3',
//   48: 'Xcode 8.0',
//   47: 'Xcode 6.3',
//   46: 'Xcode 3.2',
//   45: 'Xcode 3.1',
// })

export interface PBXProject extends ObjectPrimitive<ISA.PBXProject> {
  attributes: Attributes;
  /** XCConfigurationList UUID */
  buildConfigurationList: UUID;
  /** Xcode compatibility version. @example `Xcode 3.2` */
  compatibilityVersion: string;
  /** @example `English` */
  developmentRegion?: string;
  /** @example `0` */
  hasScannedForEncodings?: NumericBoolean;
  /** Known regions for localized files. */
  knownRegions: ("en" | "Base" | string)[];
  /** Object is a UUID for a `PBXGroup`. */
  mainGroup: UUID;
  /** Object is a UUID for a `PBXGroup`. */
  productRefGroup?: UUID;
  /** Relative path for the project. */
  projectDirPath: string;
  /** Relative root path for the project. */
  projectRoot: string;
  /** List of UUIDs for targets. */
  targets: UUID[];

  /** List of UUIDs for `XCRemoteSwiftPackageReference` */
  packageReferences?: UUID[];
}

export interface Attributes {
  CLASSPREFIX?: string;
  ORGANIZATIONNAME?: string;
  /** @example `1240` */
  LastUpgradeCheck: string;
  /** @example `1240` */
  LastSwiftUpdateCheck?: string;
  TargetAttributes: Record<string, TargetAttribute>;
}

export type TargetAttribute =
  | {
      CreatedOnToolsVersion: string;
      TestTargetID?: string;
      ProvisioningStyle?: "Automatic" | "Manual";
    }
  | {
      LastSwiftMigration: string;
    };

export interface XCBuildConfiguration
  extends ObjectPrimitive<ISA.XCBuildConfiguration> {
  buildSettings: BuildSettings;
  name: string;
}

export interface BuildSettings {
  BUNDLE_LOADER: string;
  IPHONEOS_DEPLOYMENT_TARGET: string;
  PRODUCT_BUNDLE_IDENTIFIER: string;
  PRODUCT_NAME: string;
  TEST_HOST: string;
  COPY_PHASE_STRIP?: string;
  ASSETCATALOG_COMPILER_APPICON_NAME: string;
  CURRENT_PROJECT_VERSION: string;
  ENABLE_BITCODE?: string;
  INFOPLIST_FILE: string;
  LD_RUNPATH_SEARCH_PATHS: string;
  OTHER_LDFLAGS: string[];
  SWIFT_OPTIMIZATION_LEVEL?: string | "-O";
  SWIFT_VERSION: string | "4.2";

  ALWAYS_SEARCH_USER_PATHS?: BoolString;
  CLANG_ANALYZER_NONNULL?: BoolString;

  CLANG_ANALYZER_LOCALIZABILITY_NONLOCALIZED: string;

  CLANG_CXX_LANGUAGE_STANDARD: string | "gnu++0x" | "gnu++14";
  CLANG_CXX_LIBRARY: string | "libc++";
  VERSIONING_SYSTEM?: "apple-generic" | string;

  CLANG_ENABLE_MODULES?: BoolString;
  CLANG_ENABLE_OBJC_ARC?: BoolString;
  CLANG_ENABLE_OBJC_WEAK?: BoolString;

  CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING?: BoolString;
  CLANG_WARN_BOOL_CONVERSION?: BoolString;
  CLANG_WARN_COMMA: string;
  CLANG_WARN_CONSTANT_CONVERSION: string;
  CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS: string;
  CLANG_WARN_DIRECT_OBJC_ISA_USAGE: string;
  CLANG_WARN_EMPTY_BODY: string;
  CLANG_WARN_ENUM_CONVERSION: string;
  CLANG_WARN_INFINITE_RECURSION: string;
  CLANG_WARN_INT_CONVERSION: string;
  CLANG_WARN_NON_LITERAL_NULL_CONVERSION: string;
  CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF: string;
  CLANG_WARN_OBJC_LITERAL_CONVERSION: string;
  CLANG_WARN_OBJC_ROOT_CLASS: string;
  CLANG_WARN_RANGE_LOOP_ANALYSIS: string;
  CLANG_WARN_STRICT_PROTOTYPES: string;
  CLANG_WARN_SUSPICIOUS_MOVE: string;
  CLANG_WARN_UNREACHABLE_CODE: string;
  CLANG_WARN__DUPLICATE_METHOD_MATCH: string;
  "CODE_SIGN_IDENTITY[sdk=iphoneos*]": string | "iPhone Developer";
  ENABLE_STRICT_OBJC_MSGSEND: string;
  ENABLE_TESTABILITY?: string;
  GCC_C_LANGUAGE_STANDARD: string;
  GCC_DYNAMIC_NO_PIC?: BoolString;
  GCC_NO_COMMON_BLOCKS: BoolString;
  GCC_OPTIMIZATION_LEVEL?: string;
  GCC_PREPROCESSOR_DEFINITIONS?: string[];
  GCC_SYMBOLS_PRIVATE_EXTERN?: string;
  GCC_WARN_64_TO_32_BIT_CONVERSION: BoolString;
  GCC_WARN_ABOUT_RETURN_TYPE: BoolString;
  GCC_WARN_UNDECLARED_SELECTOR: BoolString;
  GCC_WARN_UNINITIALIZED_AUTOS: BoolString;
  GCC_WARN_UNUSED_FUNCTION: BoolString;
  GCC_WARN_UNUSED_VARIABLE: BoolString;
  LIBRARY_SEARCH_PATHS: string[];
  PREBINDING?: BoolString;
  MTL_ENABLE_DEBUG_INFO: BoolString;
  MTL_FAST_MATH: BoolString;
  ONLY_ACTIVE_ARCH?: BoolString;
  SDKROOT: string;
  ENABLE_NS_ASSERTIONS?: BoolString;
  VALIDATE_PRODUCT?: string;
  DEBUG_INFORMATION_FORMAT?: "dwarf" | "dwarf-with-dsym" | string;
}
