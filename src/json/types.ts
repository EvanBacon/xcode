/**
 * `isa` or 'is a' as in 'object _is a_ `PBXBuildFile`'.
 *
 * The naming is a reference to Objective-C.
 * In objc, when objects are allocated they have an 'isa' pointer which indicates the superclass.
 *
 * - [cite](https://stackoverflow.com/a/3405588/4047926)
 * - [Apple Docs](https://developer.apple.com/documentation/objectivec/objc_object/1418809-isa).
 */
export enum ISA {
  PBXBuildFile = "PBXBuildFile",

  PBXAppleScriptBuildPhase = "PBXAppleScriptBuildPhase",
  PBXCopyFilesBuildPhase = "PBXCopyFilesBuildPhase",
  PBXFrameworksBuildPhase = "PBXFrameworksBuildPhase",
  PBXHeadersBuildPhase = "PBXHeadersBuildPhase",
  PBXResourcesBuildPhase = "PBXResourcesBuildPhase",
  PBXShellScriptBuildPhase = "PBXShellScriptBuildPhase",
  PBXSourcesBuildPhase = "PBXSourcesBuildPhase",
  PBXRezBuildPhase = "PBXRezBuildPhase",

  PBXContainerItemProxy = "PBXContainerItemProxy",

  PBXFileReference = "PBXFileReference",
  PBXGroup = "PBXGroup",
  PBXVariantGroup = "PBXVariantGroup",
  XCVersionGroup = "XCVersionGroup",
  PBXFileSystemSynchronizedRootGroup = "PBXFileSystemSynchronizedRootGroup",
  PBXFileSystemSynchronizedBuildFileExceptionSet = "PBXFileSystemSynchronizedBuildFileExceptionSet",
  PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSet = "PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSet",

  PBXNativeTarget = "PBXNativeTarget",
  PBXAggregateTarget = "PBXAggregateTarget",
  PBXLegacyTarget = "PBXLegacyTarget",

  PBXProject = "PBXProject",
  PBXTargetDependency = "PBXTargetDependency",
  XCBuildConfiguration = "XCBuildConfiguration",
  XCConfigurationList = "XCConfigurationList",

  PBXBuildRule = "PBXBuildRule",
  PBXReferenceProxy = "PBXReferenceProxy",

  // spm
  XCSwiftPackageProductDependency = "XCSwiftPackageProductDependency",
  XCRemoteSwiftPackageReference = "XCRemoteSwiftPackageReference",
  XCLocalSwiftPackageReference = "XCLocalSwiftPackageReference",
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
  | "com.apple.product-type.extensionkit-extension"
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

export enum ProxyType {
  targetReference = 1,
  reference = 2,
}

export type BoolNumber = 0 | 1;

export type BoolString = "YES" | "NO" | "YES_ERROR" | "YES_AGGRESSIVE";

/**
 * A 24 character UUID used to uniquely identify objects in the `XcodeProject.objects` dictionary.
 *
 * @example `13B07FBC1A68108700A75B9A`
 */
export type UUID = string;

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

export interface AbstractObject<TISA extends ISA> {
  isa: TISA;
}

/** The entire project representation. */
export interface XcodeProject {
  /**
   * Versioning system for the entire archive.
   * @example `1`
   */
  archiveVersion: number;
  /**
   * Versioning system for the `objects` dictionary.
   * @example `56` (Xcode 14.0)
   */
  objectVersion: number;
  /**
   * A dictionary of all objects in the project where the key is a 24 character UUID.
   * This is the main interface for parsing the project, all objects live on the
   * top-level of this dictionary, no nesting.
   * Other objects reference objects in this dictionary.
   *
   * Objects in the dictionary are typed according to the `isa` field.
   */
  objects: Record<UUID, AbstractObject<any>>;
  /** UUID for the initial object in the `objects` dictionary. */
  rootObject: UUID;
  /** No idea what this does, I've Googled it a bit. */
  classes: Record<UUID, unknown>;
}

export interface AbstractFileObject<TISA extends ISA>
  extends AbstractObject<TISA> {
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

export interface AbstractPhysicalFileObject<TISA extends ISA>
  extends AbstractFileObject<TISA> {
  /**
   * If the file should be indexed.
   * Seems to only be added when the file is generated by Xcode (defaulting to `0` (false)).
   *
   * Of type `0` (false) or `1` (true).
   */
  includeInIndex?: BoolNumber;
  /**
   * Should Xcode wrap lines.
   *
   * @example `1`
   */
  wrapsLines?: BoolNumber;
  /** Width of the indention as displayed in the editor (Xcode). @example `4` `2` */
  indentWidth?: number;
  /** Width of a tab as displayed in the editor (Xcode). @example `4` `2` */
  tabWidth?: number;
  /** Should the editor (Xcode) use tabs instead of spaces. @example `0` */
  usesTabs?: BoolNumber;
}

export interface PBXFileReference
  extends AbstractPhysicalFileObject<ISA.PBXFileReference> {
  /** Used by Xcode to generate 'products'. */
  explicitFileType?: FileType;
  /** Only present when `explicitFileType` is not present. */
  lastKnownFileType?: FileType;
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
    | (string & {});

  /** Indicates the structure of a plist file. */
  plistStructureDefinitionIdentifier?: string;
  /** Indicating if Xcode should save a file with a new line at the end. */
  lineEnding?: BoolNumber;
}

/** A group that contains other groups and files. */
export interface PBXGroup<TISA extends ISA = ISA.PBXGroup, TChild = UUID>
  extends AbstractPhysicalFileObject<TISA> {
  /** List of UUIDs for objects of type `<PBXGroup|PBXReferenceProxy|PBXFileReference>` */
  children: TChild[];
}

/** Object for referencing localized resources. */
export interface PBXVariantGroup<TChild = UUID>
  extends PBXGroup<ISA.PBXVariantGroup, TChild> {}

/** A group that references a folder on disk. */

export interface PBXFileSystemSynchronizedRootGroup<TException = UUID>
  extends AbstractPhysicalFileObject<ISA.PBXFileSystemSynchronizedRootGroup> {
  /** The list of exceptions applying to this group. */
  exceptions?: TException[];
  /** Maps relative paths inside the synchronized root group to a particular file type. If a path doesn’t have a particular file type specified, Xcode defaults to the default file type based on the extension of the file. */
  explicitFileTypes: Record<string, string>;
  /** List of relative paths to children folder whose configuration is overwritten. */
  explicitFolders: string[];
}

/** Object for referencing files that should be excluded from synchronization with the file system. */
export interface PBXFileSystemSynchronizedBuildFileExceptionSet<TTarget = UUID>
  extends AbstractObject<ISA.PBXFileSystemSynchronizedBuildFileExceptionSet> {
  /** Files with a platform filter. */
  platformFiltersByRelativePath?: Record<string, string[]>;

  /** Additional compiler flags by relative path. Every item in the list is the relative path inside the root synchronized group. The value is the additional compiler flags. */
  additionalCompilerFlagsByRelativePath?: Record<string, string>;

  /** Attributes by relative path. Every item in the list is the relative path inside the root synchronized group. This is used for example when linking frameworks to specify that they are optional with the attribute “Weak” */
  attributesByRelativePath?: Record<string, string[]>;

  /** List of relative paths to children subfolders for which exceptions are applied. */
  membershipExceptions?: string[];

  /** Changes the default header visibility (project) to private for the following headers. Every item in the list is the relative path inside the root synchronized group. */
  privateHeaders?: string[];

  /** Changes the default header visibility (project) to public for the following headers. Every item in the list is the relative path inside the root synchronized group. */
  publicHeaders?: string[];

  /** The target that this exception set applies to. */
  target: TTarget;
}

/** Object for referencing a group of files that should be excluded from synchronization with a build phase. */
export interface PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSet<
  TBuildPhase = UUID
> extends AbstractObject<ISA.PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSet> {
  /** Files with a platform filter. */
  platformFiltersByRelativePath?: Record<string, string[]>;

  /** List of relative paths to children subfolders for which exceptions are applied. */
  membershipExceptions?: string[];

  /** The build phase that this exception set applies to. */
  buildPhase: TBuildPhase;
}

// Possibly not exhaustive.
export type FileType =
  | "archive.ar"
  | "text"
  | "wrapper.extensionkit-extension"
  | "wrapper.application"
  | "wrapper.app-extension"
  | "wrapper.plug-in"
  | "sourcecode.cpp.cpp"
  | "compiled.mach-o.dylib"
  | "text.plist.entitlements"
  | "wrapper.framework"
  | "sourcecode.javascript"
  | "text.json"
  | "text.html"
  | "text.css"
  | "image.gif"
  | "text.xml"
  | "sourcecode.c.h"
  | "sourcecode.cpp.h"
  | "sourcecode.c.objc"
  | "text"
  | "folder"
  | "wrapper.cfbundle"
  | "sourcecode.module"
  | "video.quicktime"
  | "audio.mp3"
  | "wrapper.cfbundle"
  | "sourcecode.c.h"
  | "text.plist.xml"
  | "image.png"
  | "text.script.sh"
  | "file.sks"
  | "file.storyboard"
  | "text.plist.strings"
  | "sourcecode.swift"
  | "folder.assetcatalog"
  | "text.xcconfig"
  | "wrapper.xcdatamodel"
  | "wrapper.pb-project"
  | "wrapper.cfbundle"
  | "file.xib"
  | "file.intentdefinition"
  | "archive.zip";

export interface XCVersionGroup<TChild = UUID, TCurrentVersion = UUID>
  extends PBXGroup<ISA.XCVersionGroup, TChild> {
  /** UUID for a `PBXFileReference` (should also be included in the `children` array). */
  currentVersion: TCurrentVersion[];

  /** Type of resource. */
  versionGroupType: FileType;
}

/** Abstract parent for custom build phases. */
export interface AbstractBuildPhase<TISA extends ISA, TFile = UUID>
  extends AbstractObject<TISA> {
  /** @example `2147483647` */
  buildActionMask: number | 2147483647 | 8 | 12;
  /** List of UUIDs for objects of type `PBXBuildFile` that should be processed in the phase. */
  files: TFile[];
  /**
   * If the phase should be processed before deployment.
   *
   * In Xcode this is displayed as:
   * - 'Copy only when installing' for `PBXCopyFilesBuildPhase`
   * - 'Run script only when installing' for `PBXShellScriptBuildPhase`
   */
  runOnlyForDeploymentPostprocessing: BoolNumber;

  /**
   * If the phase should be force processed on every build, including incremental builds.
   *
   * In Xcode this is displayed as:
   * - 'Based on dependency analysis' for `PBXShellScriptBuildPhase`
   */
  alwaysOutOfDate?: 1;
}

/**
 * A build phase that copies files to the bundle.
 *
 * - 'Copy Files' in Xcode.
 * - Can be used multiple times per target.
 */
export interface PBXCopyFilesBuildPhase<TFile = UUID>
  extends AbstractBuildPhase<ISA.PBXCopyFilesBuildPhase, TFile> {
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
 * A build phase that compiles files.
 *
 * - 'Compile Sources' in Xcode.
 * - Can only be used once per target.
 */
export interface PBXSourcesBuildPhase<TFiles = UUID>
  extends AbstractBuildPhase<ISA.PBXSourcesBuildPhase, TFiles> {}

/**
 * An Xcode-managed version of `PBXCopyFilesBuildPhase`.
 *
 * - 'Copy Bundle Resources' in Xcode.
 * - Can only be used once per target.
 */
export interface PBXResourcesBuildPhase<TFiles = UUID>
  extends AbstractBuildPhase<ISA.PBXResourcesBuildPhase, TFiles> {}

/**
 * A build phase that copies headers into the bundle.
 *
 * - 'Copy Headers' in Xcode.
 * - Can only be used once per target.
 */
export interface PBXHeadersBuildPhase<TFiles = UUID>
  extends AbstractBuildPhase<ISA.PBXHeadersBuildPhase, TFiles> {}

/**
 *
 * - ?? in Xcode.
 * - ??
 */
export interface PBXAppleScriptBuildPhase<TFiles = UUID>
  extends AbstractBuildPhase<ISA.PBXAppleScriptBuildPhase, TFiles> {}

/**
 * - 'Build Carbon Resources' in Xcode.
 * - Can be used multiple times per target.
 */
export interface PBXRezBuildPhase<TFiles = UUID>
  extends AbstractBuildPhase<ISA.PBXRezBuildPhase, TFiles> {}

/**
 * - 'Link Binary With Libraries' in Xcode.
 * - Can only be used once per target.
 */
export interface PBXFrameworksBuildPhase<TFiles = UUID>
  extends AbstractBuildPhase<ISA.PBXFrameworksBuildPhase, TFiles> {}

/**
 * A build phase for running a shell script.
 *
 * - 'Run Script' in Xcode.
 * - Can be used multiple times per target.
 */
export interface PBXShellScriptBuildPhase<TFiles = UUID>
  extends AbstractBuildPhase<ISA.PBXShellScriptBuildPhase, TFiles> {
  /** @example `Embed App Extensions` */
  name?: string;
  /**
   * Array of input file paths for the shell script.
   *
   * @example `"$(SRCROOT)/foobar"`
   */
  inputPaths: string[];
  /**
   * Array of output file paths for the shell script.
   * @example `"$(DERIVED_FILE_DIR)/foobar"`
   */
  outputPaths: string[];
  /**
   * Path to script interpreter.
   * @default `"/bin/sh"`
   */
  shellPath?: string;
  /** Script to run, defaults to a comment. */
  shellScript?: string;
  inputFileListPaths?: string[];
  outputFileListPaths?: string[];
  /** If the environment variables should be printed in the build log of `xcodebuild`. */
  showEnvVarsInLog?: BoolNumber;
  /** Discovered dependency file. */
  dependencyFile?: string;
}

export interface PBXBuildRule<TInputFile = UUID, TOutputFile = UUID>
  extends AbstractObject<ISA.PBXBuildRule> {
  name?: string;

  /** Indicates which compiler to use. */
  compilerSpec:
    | "com.apple.compilers.proxy.script"
    | "com.apple.build-tasks.copy-strings-file"
    | (string & {});
  /** Discovered dependency file. */
  dependencyFile?: string;
  /** Type of files that should be processed by the rule. */
  fileType?: "pattern.proxy" | "wrapper.xcclassmodel" | (string & {});
  /**
   * Used to target files by a pattern. An alternate query to `fileType`.
   * @example `"*.css"`
   */
  filePatterns?: string;
  /** If the rule can be edited. */
  isEditable: BoolNumber;

  /** List of UUIDs for objects of type `PBXFileReference` for input to the rule. */
  inputFiles?: TInputFile[];

  /**
   * List of UUIDs for objects of type `PBXFileReference` for output to the rule.
   *
   * @example `["${INPUT_FILE_BASE}.css.c"]`
   */
  outputFiles: TOutputFile[];
  outputFilesCompilerFlags?: string[];

  runOncePerArchitecture?: BoolNumber;

  /** This attribute is present if `compilerSpec: 'com.apple.compilers.proxy.script'`. */
  script?: string;
}

export interface PBXReferenceProxy<TRemoteRef = UUID>
  extends AbstractFileObject<ISA.PBXReferenceProxy> {
  /** Type of the referenced file. */
  fileType: "wrapper.application" | (string & {});

  /** UUID to an object of type `PBXContainerItemProxy`. */
  remoteRef: TRemoteRef;
}

/** Legacy target for use with external build tools. */
export interface PBXLegacyTarget<
  TBuildConfigurationList = UUID,
  TDependency = UUID,
  TBuildPhase = UUID
> extends AbstractTarget<
    ISA.PBXLegacyTarget,
    TBuildConfigurationList,
    TDependency,
    TBuildPhase
  > {
  buildWorkingDirectory: string;
  buildArgumentsString: string;
  passBuildSettingsInEnvironment: BoolNumber;
  buildToolPath: string;
}

/** This is the element for a build target that aggregates several others. */
export interface PBXAggregateTarget<
  TBuildConfigurationList = UUID,
  TDependency = UUID,
  TBuildPhase = UUID
> extends AbstractTarget<
    ISA.PBXAggregateTarget,
    TBuildConfigurationList,
    TDependency,
    TBuildPhase
  > {}

/** A target used in Xcode */
export interface PBXNativeTarget<
  TBuildConfigurationList = UUID,
  TDependency = UUID,
  TBuildPhase = UUID,
  TBuildRule = UUID,
  TProductReference = UUID,
  TPackageProductDependency = UUID,
  TFileSystemSynchronizedGroups = UUID
> extends AbstractTarget<
    ISA.PBXNativeTarget,
    TBuildConfigurationList,
    TDependency,
    TBuildPhase
  > {
  /** List of UUIDs for objects of type `PBXBuildRule` */
  buildRules: TBuildRule[];
  /** Build product type ID. */
  productType: PBXProductType;
  /** UUID */
  productReference?: TProductReference;
  /** @example `$(HOME)/bin` */
  productInstallPath?: string;
  /** List of UUID for object of type `XCSwiftPackageProductDependency` */
  packageProductDependencies?: TPackageProductDependency[];
  /** List of file system synchronized groups containing files to include to build this target. */
  fileSystemSynchronizedGroups?: TFileSystemSynchronizedGroups[];
}

/** Info about build settings for a file in a `PBXBuildPhase`. */
export interface PBXBuildFile<TFileRef = UUID, TProductRef = UUID>
  extends AbstractObject<ISA.PBXBuildFile> {
  /** UUID for an object of type <PBXFileReference|PBXGroup|PBXVariantGroup|XCVersionGroup|PBXReferenceProxy> */
  fileRef: TFileRef;
  settings?: {
    ATTRIBUTES?: ("RemoveHeadersOnCopy" | (string & {}))[];
  } & Record<string, any>;

  /** UUID for a `XCSwiftPackageProductDependency` (Swift Package) file. */
  productRef?: TProductRef;

  /** Platform filter for this build file. Use the newer `platformFilters` instead. */
  platformFilter?: string;

  /** List of platform filters for this build file. */
  platformFilters?: string[];
}

export interface XCSwiftPackageProductDependency<TPackage = UUID>
  extends AbstractObject<ISA.XCSwiftPackageProductDependency> {
  /** UUID for an object of type `XCRemoteSwiftPackageReference` or `XCLocalSwiftPackageReference` */
  package?: TPackage;

  productName?: string;
}

/** Version requirement for a remote Swift package. */
export type XCSwiftPackageVersionRequirement =
  | {
      kind: "upToNextMajorVersion";
      minimumVersion: string;
    }
  | {
      kind: "upToNextMinorVersion";
      minimumVersion: string;
    }
  | {
      kind: "versionRange";
      minimumVersion: string;
      maximumVersion: string;
    }
  | {
      kind: "exactVersion";
      version: string;
    }
  | {
      kind: "branch";
      branch: string;
    }
  | {
      kind: "revision";
      revision: string;
    };

export interface XCRemoteSwiftPackageReference
  extends AbstractObject<ISA.XCRemoteSwiftPackageReference> {
  /** URL the Swift package was installed from. */
  repositoryURL?: string;
  /** Version requirements. */
  requirement?: XCSwiftPackageVersionRequirement;
}

export interface XCLocalSwiftPackageReference
  extends AbstractObject<ISA.XCLocalSwiftPackageReference> {
  /** Repository path where the package is located relative to the Xcode project. */
  relativePath: string;
}

export interface PBXContainerItemProxy<
  TContainerPortal = UUID,
  TRemoteGlobalIDString = UUID
> extends AbstractObject<ISA.PBXContainerItemProxy> {
  containerPortal: TContainerPortal;
  /** @example `1` */
  proxyType: ProxyType;
  /** UUID */
  remoteGlobalIDString: TRemoteGlobalIDString;
  remoteInfo?:
    | "ReferencedProject"
    | "iOS application"
    | "iOS staticLibrary"
    | (string & {});
}

/** This element is an abstract parent for specialized targets. */
export interface AbstractTarget<
  TTargetIsa extends
    | ISA.PBXAggregateTarget
    | ISA.PBXLegacyTarget
    | ISA.PBXNativeTarget,
  TBuildConfigurationList = UUID,
  TDependencies = UUID,
  TBuildPhases = UUID
> extends AbstractObject<TTargetIsa> {
  /** Display name of the target. */
  name: string;

  /** Name of the built product. */
  productName?: string;
  /**
   * A list object (`XCConfigurationList`) which contains the configurations (`XCBuildConfiguration`)
   * used for `xcodebuild`. This list usually contains two configurations - `Debug` and `Release`.
   *
   * The configurations contain a large k/v pair of the build settings.
   */
  buildConfigurationList: TBuildConfigurationList;
  /**
   * List of dependencies (`PBXTargetDependency`) used to create this target.
   */
  dependencies: TDependencies[];
  /**
   * List of phases (`AbstractBuildPhase`) that are run during `xcodebuild`.
   * Phases are ordered according to when they should be executed.
   *
   * The following phases can be used more than once:
   * - `PBXShellScriptBuildPhase` - Run a shell script.
   * - `PBXCopyFilesBuildPhase` - Copy files.
   */
  buildPhases: TBuildPhases[];
}

/**
 * Represents a native target (`AbstractTarget`) that has a dependency on another native target through a proxy (`PBXContainerItemProxy`).
 * Used for multi-target projects (e.g. App Clip for an app).
 */
export interface PBXTargetDependency<TTarget = UUID, TTargetProxy = UUID>
  extends AbstractObject<ISA.PBXTargetDependency> {
  /** Target UUID for object of type `AbstractTarget` that must be built for the dependency. */
  target: TTarget;
  /** UUID for an object of type `PBXContainerItemProxy` that must be built for the dependency. Used for cross workspace projects. */
  targetProxy: TTargetProxy;

  /** Name of the target, rarely used. */
  name?: string;

  platformFilter?: string;
  platformFilters?: string[];

  productRef?: string;
}

export type XCBuildConfigurationName = "Release" | "Debug" | (string & {});

export interface XCConfigurationList<TBuildConfigurations = UUID>
  extends AbstractObject<ISA.XCConfigurationList> {
  /** List of UUIDs to objects of type `XCBuildConfiguration` */
  buildConfigurations: TBuildConfigurations[];
  defaultConfigurationIsVisible: BoolNumber;
  defaultConfigurationName: XCBuildConfigurationName;
}

export interface XCBuildConfiguration<TBaseConfigurationReference = UUID>
  extends AbstractObject<ISA.XCBuildConfiguration> {
  /** UUID pointing to reference configuration file of type `.xcconfig`. */
  baseConfigurationReference?: TBaseConfigurationReference;
  buildSettings: BuildSettings;
  /** configuration name. */
  name: XCBuildConfigurationName;
}

export interface PBXProject<
  TBuildConfigurationList = UUID,
  TMainGroup = UUID,
  TProductRefGroup = UUID,
  TTargets = UUID,
  TPackageReference = UUID
> extends AbstractObject<ISA.PBXProject> {
  attributes: Attributes;
  /**
   * A list object (`XCConfigurationList`) which contains the configurations (`XCBuildConfiguration`)
   * used for `xcodebuild`. This list usually contains two configurations - `Debug` and `Release`.
   *
   * The configurations contain a large k/v pair of the build settings.
   */
  buildConfigurationList: TBuildConfigurationList;
  /** Xcode compatibility version. @example `Xcode 3.2` */
  compatibilityVersion: string;
  /** @example `English` */
  developmentRegion?: string;
  /** @example `0` */
  hasScannedForEncodings?: BoolNumber;
  /** Known regions for localized files. */
  knownRegions: ("en" | "Base" | (string & {}))[];
  /** Object is a UUID for a `PBXGroup`. */
  mainGroup: TMainGroup;
  /** Object is a UUID for a `PBXGroup`. */
  productRefGroup?: TProductRefGroup;
  /** Relative path for the project. */
  projectDirPath: string;
  /** Relative root path for the project. */
  projectRoot: string;
  /** List of UUIDs for targets. */
  targets: TTargets[];

  /** List of UUIDs for `XCRemoteSwiftPackageReference` or `XCLocalSwiftPackageReference` */
  packageReferences?: TPackageReference[];
}

export interface Attributes {
  CLASSPREFIX?: string;
  ORGANIZATIONNAME?: string;
  /** @example `1240` */
  LastUpgradeCheck: string;
  /** @example `1240` */
  LastSwiftUpdateCheck?: string;
  TargetAttributes?: Record<string, TargetAttribute>;
  BuildIndependentTargetsInParallel?: BoolString;

  KnownAssetTags?: string[];
}

export type TargetAttribute =
  | {
      CreatedOnToolsVersion: string;
      TestTargetID?: string;
      ProvisioningStyle?: "Automatic" | "Manual";
      DevelopmentTeam?: string;
    }
  | {
      LastSwiftMigration: string;
      DevelopmentTeam?: string;
    };

export interface XCBuildConfiguration
  extends AbstractObject<ISA.XCBuildConfiguration> {
  buildSettings: BuildSettings;
  name: XCBuildConfigurationName;
}

export interface BuildSettings {
  CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION?: BoolString;
  CLANG_WARN_DOCUMENTATION_COMMENTS?: BoolString;
  CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER?: BoolString;
  CLANG_WARN_UNGUARDED_AVAILABILITY?: BoolString;
  CODE_SIGN_STYLE?: "Automatic" | (string & {});
  SWIFT_ACTIVE_COMPILATION_CONDITIONS?:
    | "DEBUG"
    | "DEBUG $(inherited)"
    | (string & {});
  GENERATE_INFOPLIST_FILE?: BoolString;
  INFOPLIST_KEY_CFBundleDisplayName?: string;
  INFOPLIST_KEY_NSHumanReadableCopyright?: "";
  INFOPLIST_KEY_UIApplicationSceneManifest_Generation?: BoolString;
  INFOPLIST_KEY_UIApplicationSupportsIndirectInputEvents?: BoolString;
  INFOPLIST_KEY_UILaunchScreen_Generation?: BoolString;
  INFOPLIST_KEY_UISupportedInterfaceOrientations_iPad?: string;
  INFOPLIST_KEY_UISupportedInterfaceOrientations_iPhone?: string;
  INFOPLIST_KEY_UISupportedInterfaceOrientations?: string;
  /** bundle identifier of the main application target. */
  INFOPLIST_KEY_WKCompanionAppBundleIdentifier?: string;

  // INFOPLIST_KEY_MetalCaptureEnabled
  // INFOPLIST_KEY_WKWatchOnly
  // INFOPLIST_KEY_WKRunsIndependentlyOfCompanionApp
  // INFOPLIST_KEY_WKExtensionDelegateClassName
  // INFOPLIST_KEY_WKCompanionAppBundleIdentifier
  // INFOPLIST_KEY_CLKComplicationPrincipalClass
  // INFOPLIST_KEY_UISupportsDocumentBrowser
  // INFOPLIST_KEY_UISupportedInterfaceOrientations_iPhone
  // INFOPLIST_KEY_UISupportedInterfaceOrientations_iPad
  // INFOPLIST_KEY_UIStatusBarStyle
  // INFOPLIST_KEY_UIStatusBarHidden
  // INFOPLIST_KEY_UIRequiresFullScreen
  // INFOPLIST_KEY_UIApplicationSceneManifest_Generation
  // INFOPLIST_KEY_UIApplicationSupportsIndirectInputEvents
  // INFOPLIST_KEY_LSSupportsOpeningDocumentsInPlace
  // INFOPLIST_KEY_UIUserInterfaceStyle
  // INFOPLIST_KEY_UISupportedInterfaceOrientations
  // INFOPLIST_KEY_UIRequiredDeviceCapabilities
  // INFOPLIST_KEY_UIMainStoryboardFile
  // INFOPLIST_KEY_UILaunchStoryboardName
  // INFOPLIST_KEY_UILaunchScreen_Generation
  // INFOPLIST_KEY_NSMainStoryboardFile
  // INFOPLIST_KEY_NSMainNibFile
  // INFOPLIST_KEY_LSUIElement
  // INFOPLIST_KEY_LSBackgroundOnly
  // INFOPLIST_KEY_OSBundleUsageDescription
  // INFOPLIST_KEY_NSVoIPUsageDescription
  // INFOPLIST_KEY_NSVideoSubscriberAccountUsageDescription
  // INFOPLIST_KEY_NSUserTrackingUsageDescription
  // INFOPLIST_KEY_NSSystemExtensionUsageDescription
  // INFOPLIST_KEY_NSSystemAdministrationUsageDescription
  // INFOPLIST_KEY_NSSpeechRecognitionUsageDescription
  // INFOPLIST_KEY_NSSiriUsageDescription
  // INFOPLIST_KEY_NSSensorKitUsageDescription
  // INFOPLIST_KEY_NSSensorKitPrivacyPolicyURL
  // INFOPLIST_KEY_NSRemovableVolumesUsageDescription
  // INFOPLIST_KEY_NSRemindersUsageDescription
  // INFOPLIST_KEY_NSPhotoLibraryUsageDescription
  // INFOPLIST_KEY_NSPhotoLibraryAddUsageDescription
  // INFOPLIST_KEY_NSNetworkVolumesUsageDescription
  // INFOPLIST_KEY_NSNearbyInteractionUsageDescription
  // INFOPLIST_KEY_NSNearbyInteractionAllowOnceUsageDescription
  // INFOPLIST_KEY_NSMotionUsageDescription
  // INFOPLIST_KEY_NSMicrophoneUsageDescription
  // INFOPLIST_KEY_NSLocationWhenInUseUsageDescription
  // INFOPLIST_KEY_NSLocationUsageDescription
  // INFOPLIST_KEY_NSLocationTemporaryUsageDescription
  // INFOPLIST_KEY_NSLocationAlwaysUsageDescription
  // INFOPLIST_KEY_NSLocationAlwaysAndWhenInUseUsageDescription
  // INFOPLIST_KEY_NSLocalNetworkUsageDescription
  // INFOPLIST_KEY_NSHomeKitUsageDescription
  // INFOPLIST_KEY_NSHealthUpdateUsageDescription
  // INFOPLIST_KEY_NSHealthShareUsageDescription
  // INFOPLIST_KEY_NSHealthClinicalHealthRecordsShareUsageDescription
  // INFOPLIST_KEY_NSGKFriendListUsageDescription
  // INFOPLIST_KEY_NSFocusStatusUsageDescription
  // INFOPLIST_KEY_NSFileProviderPresenceUsageDescription
  // INFOPLIST_KEY_NSFileProviderDomainUsageDescription
  // INFOPLIST_KEY_NSFallDetectionUsageDescription
  // INFOPLIST_KEY_NSFaceIDUsageDescription
  // INFOPLIST_KEY_NSDownloadsFolderUsageDescription
  // INFOPLIST_KEY_NSDocumentsFolderUsageDescription
  // INFOPLIST_KEY_NSDesktopFolderUsageDescription
  // INFOPLIST_KEY_NSContactsUsageDescription
  // INFOPLIST_KEY_NSCameraUsageDescription
  // INFOPLIST_KEY_NSCalendarsUsageDescription
  // INFOPLIST_KEY_NSBluetoothWhileInUseUsageDescription
  // INFOPLIST_KEY_NSBluetoothPeripheralUsageDescription
  // INFOPLIST_KEY_NSBluetoothAlwaysUsageDescription
  // INFOPLIST_KEY_NSAppleMusicUsageDescription
  // INFOPLIST_KEY_NSAppleEventsUsageDescription
  // INFOPLIST_KEY_NFCReaderUsageDescription
  // INFOPLIST_KEY_NSPrincipalClass
  // INFOPLIST_KEY_NSHumanReadableCopyright
  // INFOPLIST_KEY_LSApplicationCategoryType

  WATCHOS_DEPLOYMENT_TARGET?: string;
  MARKETING_VERSION?: number | string;
  SKIP_INSTALL?: BoolString;
  SWIFT_EMIT_LOC_STRINGS?: BoolString;
  TARGETED_DEVICE_FAMILY?: string;
  ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES?: BoolString;
  ASSETCATALOG_COMPILER_WIDGET_BACKGROUND_COLOR_NAME?: string;
  ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME?: string;
  BUNDLE_LOADER?: string;
  IPHONEOS_DEPLOYMENT_TARGET?: string;
  MACOSX_DEPLOYMENT_TARGET?: string;
  TVOS_DEPLOYMENT_TARGET?: string;
  PRODUCT_BUNDLE_IDENTIFIER: string;
  PRODUCT_NAME?: string;
  TEST_HOST?: string;
  COPY_PHASE_STRIP?: BoolString;
  DEVELOPMENT_TEAM?: string;
  ASSETCATALOG_COMPILER_APPICON_NAME?: string;
  CURRENT_PROJECT_VERSION?: string | number;
  ENABLE_BITCODE?: string;
  /** Path to the Info.plist file on disk, relative to root. */
  INFOPLIST_FILE: string;
  LD_RUNPATH_SEARCH_PATHS?: string | string[];
  OTHER_LDFLAGS?: string[];
  SWIFT_COMPILATION_MODE?: "wholemodule" | (string & {});
  SWIFT_OPTIMIZATION_LEVEL?: "-O" | "-Onone" | "-Owholemodule" | (string & {});
  SWIFT_VERSION?: "4.2" | "5" | (string & {});

  ENABLE_USER_SCRIPT_SANDBOXING?: BoolString;
  ALWAYS_SEARCH_USER_PATHS?: BoolString;
  CLANG_ANALYZER_NONNULL?: BoolString;

  CLANG_ANALYZER_LOCALIZABILITY_NONLOCALIZED?: string;

  CLANG_CXX_LANGUAGE_STANDARD?:
    | "gnu++0x"
    | "gnu++14"
    | "gnu++20"
    | (string & {});
  CLANG_CXX_LIBRARY?: "libc++" | (string & {});
  VERSIONING_SYSTEM?: "apple-generic" | (string & {});

  DEVELOPMENT_ASSET_PATHS?: string;
  ENABLE_PREVIEWS?: BoolString;
  CLANG_ENABLE_MODULES?: BoolString;
  CLANG_ENABLE_OBJC_ARC?: BoolString;
  CLANG_ENABLE_OBJC_WEAK?: BoolString;
  CODE_SIGN_ENTITLEMENTS?: string;
  INSTALL_PATH?: string;

  CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING?: BoolString;
  CLANG_WARN_BOOL_CONVERSION?: BoolString;
  CLANG_WARN_COMMA?: string;
  CLANG_WARN_CONSTANT_CONVERSION?: string;
  CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS?: string;
  CLANG_WARN_DIRECT_OBJC_ISA_USAGE?: string;
  CLANG_WARN_EMPTY_BODY?: string;
  CLANG_WARN_ENUM_CONVERSION?: string;
  CLANG_WARN_INFINITE_RECURSION?: string;
  CLANG_WARN_INT_CONVERSION?: string;
  CLANG_WARN_NON_LITERAL_NULL_CONVERSION?: string;
  CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF?: string;
  CLANG_WARN_OBJC_LITERAL_CONVERSION?: string;
  CLANG_WARN_OBJC_ROOT_CLASS?: string;
  CLANG_WARN_RANGE_LOOP_ANALYSIS?: string;
  CLANG_WARN_STRICT_PROTOTYPES?: string;
  CLANG_WARN_SUSPICIOUS_MOVE?: string;
  CLANG_WARN_UNREACHABLE_CODE?: string;
  CLANG_WARN__DUPLICATE_METHOD_MATCH?: string;
  "CODE_SIGN_IDENTITY[sdk=iphoneos*]"?: "iPhone Developer" | (string & {});
  "INFOPLIST_KEY_UIApplicationSceneManifest_Generation[sdk=iphoneos*]"?: BoolString;
  ENABLE_STRICT_OBJC_MSGSEND?: string;
  ENABLE_TESTABILITY?: string;
  GCC_C_LANGUAGE_STANDARD?: "gnu11" | (string & {});
  GCC_DYNAMIC_NO_PIC?: BoolString;
  GCC_NO_COMMON_BLOCKS?: BoolString;
  GCC_OPTIMIZATION_LEVEL?: string;
  GCC_PREPROCESSOR_DEFINITIONS?: string[];
  GCC_SYMBOLS_PRIVATE_EXTERN?: string;
  GCC_WARN_64_TO_32_BIT_CONVERSION?: BoolString;
  GCC_WARN_ABOUT_RETURN_TYPE?: BoolString;
  GCC_WARN_UNDECLARED_SELECTOR?: BoolString;
  GCC_WARN_UNINITIALIZED_AUTOS?: BoolString;
  GCC_WARN_UNUSED_FUNCTION?: BoolString;
  GCC_WARN_UNUSED_VARIABLE?: BoolString;
  LIBRARY_SEARCH_PATHS?: string[];
  PREBINDING?: BoolString;
  MTL_ENABLE_DEBUG_INFO?: BoolString | "INCLUDE_SOURCE";
  MTL_FAST_MATH?: BoolString;
  ONLY_ACTIVE_ARCH?: BoolString;
  SDKROOT?: string;
  ENABLE_NS_ASSERTIONS?: BoolString;
  VALIDATE_PRODUCT?: string;
  DEBUG_INFORMATION_FORMAT?: "dwarf" | "dwarf-with-dsym" | (string & {});

  /** `"iphoneos iphonesimulator macosx xros xrsimulator"` */
  SUPPORTED_PLATFORMS?: string;

  SUPPORTS_MACCATALYST?: BoolString;
  SUPPORTS_MAC_DESIGNED_FOR_IPHONE_IPAD?: BoolString;
  SUPPORTS_XR_DESIGNED_FOR_IPHONE_IPAD?: BoolString;
  ENABLE_HARDENED_RUNTIME?: BoolString;
  LOCALIZATION_PREFERS_STRING_CATALOGS?: BoolString;
  ASSETCATALOG_COMPILER_GENERATE_SWIFT_ASSET_SYMBOL_EXTENSIONS?: BoolString;
  DEAD_CODE_STRIPPING?: BoolString;
}
