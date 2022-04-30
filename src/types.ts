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
  /*-*/ PBXVariantGroup = "PBXVariantGroup",
  PBXTarget = "PBXTarget",
  /*-*/ PBXAggregateTarget = "PBXAggregateTarget",
  /*-*/ PBXLegacyTarget = "PBXLegacyTarget",
  /*-*/ PBXNativeTarget = "PBXNativeTarget",
  PBXProject = "PBXProject",
  PBXTargetDependency = "PBXTargetDependency",
  XCBuildConfiguration = "XCBuildConfiguration",
  XCConfigurationList = "XCConfigurationList",

  // ??
  PBXBuildRule = "PBXBuildRule",
  PBXReferenceProxy = "PBXReferenceProxy",
  PBXRezBuildPhase = "PBXRezBuildPhase",
  XCVersionGroup = "XCVersionGroup",
}

export type PBXProductType =
  | "com.apple.product-type.application"
  | "com.apple.product-type.app-extension"
  | "com.apple.product-type.bundle"
  | "com.apple.product-type.tool"
  | "com.apple.product-type.kernel-extension.iokit"
  | "com.apple.product-type.library.dynamic"
  | "com.apple.product-type.in-app-purchase-content"
  | "com.apple.product-type.kernel-extension"
  | "com.apple.product-type.bundle.ui-testing"
  | "com.apple.product-type.framework"
  | "com.apple.product-type.library.static"
  | "com.apple.product-type.bundle.unit-test"
  | "com.apple.product-type.application.watchapp"
  | "com.apple.product-type.application.watchapp2"
  | "com.apple.product-type.application.on-demand-install-capable"
  | "com.apple.product-type.watchkit-extension"
  | "com.apple.product-type.watchkit2-extension";

interface Object<TISA extends ISA> {
  isa: TISA;
}

export interface XcodeProject {
  archiveVersion: string;
  classes: Record<string, any>;
  objectVersion: string;
  objects: Record<string, Object<any>>;
  rootObject: string;
}

/** Object for referencing localized resources. */
export interface PBXVariantGroup extends Object<ISA.PBXVariantGroup> {
  /** UUID list */
  children: string[];
  /** file name */
  name: string;
  /** Variant group source tree */
  sourceTree: SourceTree;
}

export interface PBXFileElement extends Object<ISA.PBXFileElement> {
  sourceTree: SourceTree;
  path: string;
  name: string;
}
/** Abstract parent for custom build phases. */

export interface PBXBuildPhase<TISA extends ISA = ISA.PBXBuildPhase>
  extends Object<TISA> {
  /** @example `Embed App Extensions` */
  name?: string;
  /** @example `2147483647` */
  buildActionMask: string;
  /** List of UUIDs */
  files: string[];
  /** Boolean number 0-1. */
  runOnlyForDeploymentPostprocessing: string;
}

export enum SubFolder {
  absolutePath = "0",
  productsDirectory = "16",
  wrapper = "1",
  executables = "6",
  resources = "7",
  javaResources = "15",
  frameworks = "10",
  sharedFrameworks = "11",
  sharedSupport = "12",
  plugins = "13",
  // other,
}

export interface PBXCopyFilesBuildPhase
  extends PBXBuildPhase<ISA.PBXCopyFilesBuildPhase> {
  dstPath: string;
  /** @example `13` */
  dstSubfolderSpec: SubFolder;
}

/** Sources compilation */
export interface PBXSourcesBuildPhase
  extends PBXBuildPhase<ISA.PBXSourcesBuildPhase> {}
export interface PBXResourcesBuildPhase
  extends PBXBuildPhase<ISA.PBXResourcesBuildPhase> {}
export interface PBXHeadersBuildPhase
  extends PBXBuildPhase<ISA.PBXHeadersBuildPhase> {}
export interface PBXAppleScriptBuildPhase
  extends PBXBuildPhase<ISA.PBXAppleScriptBuildPhase> {}

// Discovered in Cocoa-Application.pbxproj
export interface PBXRezBuildPhase extends PBXBuildPhase<ISA.PBXRezBuildPhase> {}

export interface PBXShellScriptBuildPhase
  extends PBXBuildPhase<ISA.PBXShellScriptBuildPhase> {
  inputPaths: string[];
  outputPaths: string[];
  shellPath: string;
  shellScript?: string;
  inputFileListPaths?: any[];
  outputFileListPaths?: any[];
  showEnvVarsInLog?: string;
}

export interface PBXFrameworksBuildPhase
  extends PBXBuildPhase<ISA.PBXFrameworksBuildPhase> {}

export interface PBXBuildRule extends Object<ISA.PBXBuildRule> {
  compilerSpec: "com.apple.compilers.proxy.script" | string;
  /** @example `*.css` */
  filePatterns?: string;
  fileType: string | "pattern.proxy" | "wrapper.xcclassmodel";
  isEditable: number;

  inputFiles?: string[];

  /** @example `["${INPUT_FILE_BASE}.css.c"]` */
  outputFiles: string[];
  outputFilesCompilerFlags?: string[];

  script?: string;
}

// Discovered in Cocoa-Application.pbxproj
export interface PBXReferenceProxy extends Object<ISA.PBXReferenceProxy> {
  fileType: "wrapper.application" | string;
  /** @example `ReferencedProject.app` */
  path: string;
  /** UUID */
  remoteRef: string;
  sourceTree: SourceTree;
}

// Discovered in Cocoa-Application.pbxproj
export interface XCVersionGroup extends Object<ISA.XCVersionGroup> {
  /** List of UUIDs (appears to be UUIDs for `PBXBuildFile`s of type `xcdatamodel`) */
  children: string[];
  /** UUID for a `PBXBuildFile` (should also be included in the `children` array). */
  currentVersion: string[];
  /** @example `CPDocument.xcdatamodeld` */
  name: string;
  /** @example `Cocoa Application/CPDocument.xcdatamodeld` */
  path: string;
  sourceTree: SourceTree;
  versionGroupType: "wrapper.xcdatamodel" | string;
}

export interface PBXFileReference extends Object<ISA.PBXFileReference> {
  isa: ISA.PBXFileReference;
  children?: string[];
  basename: string;
  lastKnownFileType?: string;
  group?: string;
  path?: string;
  fileEncoding?: string;
  defaultEncoding?: string;
  sourceTree: SourceTree;
  includeInIndex?: string;
  explicitFileType?: string;
  settings?: object;
  uuid?: string;
  fileRef: string;
  target?: string;
}

/** This is the element for a build target that aggregates several others. */
export interface PBXAggregateTarget extends PBXTarget<ISA.PBXAggregateTarget> {
  /** UUID */
  buildConfigurationList: string;
  /** UUID List */
  buildPhases: string[];
  /** UUID List */
  dependencies: string[];
  name: string;
  productName?: string;
  /** UUID */
  productReference?: string;
  productType?: PBXProductType;
}

export interface PBXNativeTarget extends PBXTarget<ISA.PBXNativeTarget> {
  /** Target build configuration list. */
  buildConfigurationList: string;
  buildPhases: string[];
  buildRules: any[];
  dependencies: string[];
  name: string;
  productName?: string;
  /** UUID */
  productReference?: string;
  productType: PBXProductType;
  /** @example `$(HOME)/bin` */
  productInstallPath?: string;
}

export interface PBXBuildFile extends Object<ISA.PBXBuildFile> {
  fileRef: string;
  settings?: Record<string, any>;
}

export enum ProxyType {
  targetReference = "1",
  // other
}

export interface PBXContainerItemProxy
  extends Object<ISA.PBXContainerItemProxy> {
  containerPortal: string;
  /** @example `1` */
  proxyType: ProxyType;
  /** UUID */
  remoteGlobalIDString: string;
  remoteInfo?: string;
}

/** This element is an abstract parent for specialized targets. */
export interface PBXTarget<
  TTargetIsa extends
    | ISA.PBXAggregateTarget
    | ISA.PBXLegacyTarget
    | ISA.PBXNativeTarget
> extends Object<TTargetIsa> {
  target: string;
  targetProxy: string;
}
export interface PBXTargetDependency extends Object<ISA.PBXTargetDependency> {
  target: string;
  targetProxy: string;
}

export interface XCConfigurationList extends Object<ISA.XCConfigurationList> {
  buildConfigurations: string[];
  defaultConfigurationIsVisible: string;
  defaultConfigurationName: string;
}

export interface XCBuildConfiguration extends Object<ISA.XCBuildConfiguration> {
  /** UUID pointing to reference. */
  baseConfigurationReference: string;
  buildSettings: BuildSettings;
  /** configuration name. */
  name: string;
}

export interface PBXGroup extends Object<ISA.PBXGroup> {
  children: string[];
  sourceTree: SourceTree;

  /** @example `4` `2` */
  indentWidth?: string;
  /** @example `4` `2` */
  tabWidth?: string;
  /** @example `0` */
  usesTabs?: string;
}

export interface PBXProject extends Object<ISA.PBXProject> {
  attributes: Attributes;
  /** XCConfigurationList UUID */
  buildConfigurationList: string;
  /** Xcode compatibility version. @example `Xcode 3.2` */
  compatibilityVersion: string;
  /** @example `English` */
  developmentRegion?: string;
  /** @example `0` */
  hasScannedForEncodings?: string;
  /** Known regions for localized files. */
  knownRegions: ("en" | "Base" | string)[];
  /** Object is a UUID for a `PBXGroup`. */
  mainGroup: string;
  /** Object is a UUID for a `PBXGroup`. */
  productRefGroup?: string;
  /** Relative path for the project. */
  projectDirPath: string;
  /** Relative root path for the project. */
  projectRoot: string;
  targets: string[];
}

export interface Attributes {
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

export interface XCBuildConfiguration extends Object<ISA.XCBuildConfiguration> {
  buildSettings: BuildSettings;
  name: string;
}

export type BoolString = "YES" | "NO" | "YES_ERROR" | "YES_AGGRESSIVE";

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
  ENABLE_NS_ASSERTIONS?: string;
  VALIDATE_PRODUCT?: string;
  DEBUG_INFORMATION_FORMAT?: "dwarf" | "dwarf-with-dsym" | string;
}

export type SourceTree =
  | "BUILT_PRODUCTS_DIR"
  | "DEVELOPER_DIR"
  | "SOURCE_ROOT"
  | "SDKROOT"
  | "<group>"
  | "<absolute>";
