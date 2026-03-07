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

/**
 * File type UTIs used in Xcode projects.
 *
 * Derived from Xcode's built-in file type specs:
 * - DevToolsCore.framework/Versions/A/Resources/BuiltInFileTypes.xcspec
 * - DevToolsCore.framework/Versions/A/Resources/StandardFileTypes.xcspec
 * - Various plugin .xcspec/.pbfilespec files
 */
export type FileType =
  // Archives
  | "archive.ar"
  | "archive.asdictionary"
  | "archive.binhex"
  | "archive.ear"
  | "archive.gzip"
  | "archive.jar"
  | "archive.macbinary"
  | "archive.metal-library"
  | "archive.ppob"
  | "archive.rsrc"
  | "archive.stuffit"
  | "archive.tar"
  | "archive.war"
  | "archive.zip"
  // Audio
  | "audio.aiff"
  | "audio.au"
  | "audio.midi"
  | "audio.mp3"
  | "audio.wav"
  // Apple Instruments
  | "com.apple.instruments.instrdst"
  | "com.apple.instruments.package-definition"
  // Compiled
  | "compiled.air"
  | "compiled.javaclass"
  | "compiled.mach-o.dylib"
  | "compiled.mach-o.objfile"
  | "compiled.rcx"
  // Files
  | "file"
  | "file.intentdefinition"
  | "file.mlmodel"
  | "file.playground"
  | "file.rcproject"
  | "file.scp"
  | "file.sks"
  | "file.skybox"
  | "file.storyboard"
  | "file.uicatalog"
  | "file.usdz"
  | "file.xcplaygroundpage"
  | "file.xib"
  // Folders
  | "folder"
  | "folder.assetcatalog"
  | "folder.documentationcatalog"
  | "folder.iconset"
  | "folder.imagecatalog"
  | "folder.skatlas"
  | "folder.stickers"
  // Images
  | "image.bmp"
  | "image.gif"
  | "image.icns"
  | "image.ico"
  | "image.jpeg"
  | "image.pdf"
  | "image.pict"
  | "image.png"
  | "image.tiff"
  // Markdown
  | "net.daringfireball.markdown"
  // Source code
  | "sourcecode.ada"
  | "sourcecode.applescript"
  | "sourcecode.asm"
  | "sourcecode.asm.asm"
  | "sourcecode.asm.llvm"
  | "sourcecode.c.c"
  | "sourcecode.c.c.preprocessed"
  | "sourcecode.c.h"
  | "sourcecode.c.objc"
  | "sourcecode.c.objc.preprocessed"
  | "sourcecode.clips"
  | "sourcecode.cpp.cpp"
  | "sourcecode.cpp.cpp.preprocessed"
  | "sourcecode.cpp.h"
  | "sourcecode.cpp.objcpp"
  | "sourcecode.cpp.objcpp.preprocessed"
  | "sourcecode.dtrace"
  | "sourcecode.dylan"
  | "sourcecode.exports"
  | "sourcecode.fortran"
  | "sourcecode.fortran.f77"
  | "sourcecode.fortran.f90"
  | "sourcecode.glsl"
  | "sourcecode.iig"
  | "sourcecode.jam"
  | "sourcecode.java"
  | "sourcecode.javascript"
  | "sourcecode.lex"
  | "sourcecode.make"
  | "sourcecode.metal"
  | "sourcecode.mig"
  | "sourcecode.module"
  | "sourcecode.module-map"
  | "sourcecode.nasm"
  | "sourcecode.nqc"
  | "sourcecode.opencl"
  | "sourcecode.pascal"
  | "sourcecode.protobuf"
  | "sourcecode.rez"
  | "sourcecode.swift"
  | "sourcecode.text-based-dylib-definition"
  | "sourcecode.yacc"
  // Text
  | "text"
  | "text.apinotes"
  | "text.css"
  | "text.html"
  | "text.html.other"
  | "text.json"
  | "text.man"
  | "text.pbxproject"
  | "text.plist"
  | "text.plist.entitlements"
  | "text.plist.ibClassDescription"
  | "text.plist.pbfilespec"
  | "text.plist.pblangspec"
  | "text.plist.scriptSuite"
  | "text.plist.scriptTerminology"
  | "text.plist.strings"
  | "text.plist.stringsdict"
  | "text.plist.xcbuildrules"
  | "text.plist.xclangspec"
  | "text.plist.xcspec"
  | "text.plist.xcsynspec"
  | "text.plist.xctxtmacro"
  | "text.plist.xml"
  | "text.rtf"
  | "text.script.csh"
  | "text.script.perl"
  | "text.script.php"
  | "text.script.python"
  | "text.script.ruby"
  | "text.script.sh"
  | "text.script.worksheet"
  | "text.xcconfig"
  | "text.xcfilelist"
  | "text.xml"
  | "text.xml.dae"
  | "text.xml.ibArchivingDescription"
  | "text.yaml"
  // Video
  | "video.avi"
  | "video.mpeg"
  | "video.quartz-composer"
  | "video.quicktime"
  // Wrappers
  | "wrapper.app-extension"
  | "wrapper.application"
  | "wrapper.cfbundle"
  | "wrapper.driver-extension"
  | "wrapper.dsym"
  | "wrapper.extensionkit-extension"
  | "wrapper.framework"
  | "wrapper.htmld"
  | "wrapper.installer-mpkg"
  | "wrapper.installer-pkg"
  | "wrapper.kernel-extension"
  | "wrapper.nib"
  | "wrapper.pb-project"
  | "wrapper.pb-target"
  | "wrapper.plug-in"
  | "wrapper.rtfd"
  | "wrapper.scnassets"
  | "wrapper.scncache"
  | "wrapper.spotlight-importer"
  | "wrapper.storyboardc"
  | "wrapper.system-extension"
  | "wrapper.workspace"
  | "wrapper.xcclassmodel"
  | "wrapper.xcdatamodel"
  | "wrapper.xcdatamodeld"
  | "wrapper.xcframework"
  | "wrapper.xcmappingmodel"
  | "wrapper.xpc-service"
  // Escape hatch for unknown types
  | (string & {});

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
  /** UUID for an object of type <PBXFileReference|PBXGroup|PBXVariantGroup|XCVersionGroup|PBXReferenceProxy>. Optional when using productRef for Swift Packages. */
  fileRef?: TFileRef;
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

  /** Name of the product from the Swift package. For plugins, prefixed with "plugin:" */
  productName: string;
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

/**
 * Xcode build settings that control how a target is built.
 * @see https://developer.apple.com/documentation/xcode/build-settings-reference
 */
export interface BuildSettings {
  // ============================================================================
  // Build Action & Configuration
  // ============================================================================

  /** A string identifying the build system action being performed. */
  ACTION?: string;

  /** A list of components being built during this action. */
  BUILD_COMPONENTS?: string[];

  /** Identifies the build configuration, such as `Debug` or `Release`, that the target uses to generate the product. */
  CONFIGURATION?: string;

  // ============================================================================
  // SDK & Platform
  // ============================================================================

  /** The name or path of the base SDK being used during the build. */
  SDKROOT?: string;

  /** The locations of any sparse SDKs that should be layered on top of the one specified by `SDKROOT`. */
  ADDITIONAL_SDKS?: string[];

  /** The list of supported platforms from which a base SDK can be used. */
  SUPPORTED_PLATFORMS?: string;

  /** Support building this target for Mac Catalyst. */
  SUPPORTS_MACCATALYST?: BoolString;

  /** Show the Mac (Designed for iPhone) and Mac (Designed for iPad) destinations. */
  SUPPORTS_MAC_DESIGNED_FOR_IPHONE_IPAD?: BoolString;

  /** Show the Apple Vision (Designed for iPhone) and Apple Vision (Designed for iPad) destinations. */
  SUPPORTS_XR_DESIGNED_FOR_IPHONE_IPAD?: BoolString;

  /** Indicates whether the target is building for Mac Catalyst. */
  IS_MACCATALYST?: BoolString;

  // ============================================================================
  // Architectures
  // ============================================================================

  /** A list of the architectures for which the product will be built. */
  ARCHS?: string | string[];

  /** A list of architectures for which the target should not be built. */
  EXCLUDED_ARCHS?: string | string[];

  /** If enabled, only the active architecture is built. */
  ONLY_ACTIVE_ARCH?: BoolString;

  /** The name of the active architecture being processed. */
  CURRENT_ARCH?: string;

  /** Identifies the architecture on which the build is being performed. */
  NATIVE_ARCH?: string;

  /** If enabled, allows targets to build multiple times within a single build operation. */
  ALLOW_TARGET_PLATFORM_SPECIALIZATION?: BoolString;

  // ============================================================================
  // Deployment Targets
  // ============================================================================

  IPHONEOS_DEPLOYMENT_TARGET?: string;
  MACOSX_DEPLOYMENT_TARGET?: string;
  TVOS_DEPLOYMENT_TARGET?: string;
  WATCHOS_DEPLOYMENT_TARGET?: string;
  /** visionOS deployment target version. @example `"2.0"` */
  XROS_DEPLOYMENT_TARGET?: string;

  /** The name of the build setting for the deployment target for the effective platform. */
  DEPLOYMENT_TARGET_SETTING_NAME?: string;

  // ============================================================================
  // Versioning
  // ============================================================================

  /** This setting defines the current version of the project. The value must be an integer or floating point number. */
  CURRENT_PROJECT_VERSION?: string | number;

  /** This setting defines the user-visible version of the project. */
  MARKETING_VERSION?: number | string;

  /** Compatibility version of the resulting library, bundle, or framework binary. */
  DYLIB_COMPATIBILITY_VERSION?: string;

  /** Current version of any framework built by the project. */
  DYLIB_CURRENT_VERSION?: string;

  /** Selects the process used for version-stamping generated files. */
  VERSIONING_SYSTEM?: "apple-generic" | "apple-generic-hidden" | (string & {});

  /** Reference to the user performing a build to be included in the generated Apple Generic Versioning stub. */
  VERSION_INFO_BUILDER?: string;

  /** Prefix string for the version info symbol declaration. */
  VERSION_INFO_EXPORT_DECL?: string;

  /** Name for the source file that will be generated by Apple Generic Versioning. */
  VERSION_INFO_FILE?: string;

  /** Prefix for the name of the version info symbol. */
  VERSION_INFO_PREFIX?: string;

  /** Suffix for the name of the version info symbol. */
  VERSION_INFO_SUFFIX?: string;

  // ============================================================================
  // Product Settings
  // ============================================================================

  /** A string that uniquely identifies the bundle. */
  PRODUCT_BUNDLE_IDENTIFIER?: string;

  /** The basename of the product generated by the target. */
  PRODUCT_NAME?: string;

  /** The name to use for the source code module constructed for this target. */
  PRODUCT_MODULE_NAME?: string;

  /** Build product type ID. */
  PRODUCT_TYPE?: string;

  /** Path to a file specifying additional requirements for a product archive. */
  PRODUCT_DEFINITION_PLIST?: string;

  /** Targeted Device Families - comma-separated list of integers corresponding to device families. */
  TARGETED_DEVICE_FAMILY?: string;

  /** Overrides `TARGETED_DEVICE_FAMILY` when the resource copying needs to differ from the default targeted device. */
  RESOURCES_TARGETED_DEVICE_FAMILY?: string;

  // ============================================================================
  // Info.plist
  // ============================================================================

  /** The project-relative path to the property list file that contains the `Info.plist` information. */
  INFOPLIST_FILE?: string;

  /** Automatically generate an Info.plist file. */
  GENERATE_INFOPLIST_FILE?: BoolString;

  /** If enabled, don't automatically generate an Info.plist file for wrapped products when `INFOPLIST_FILE` is empty. */
  DONT_GENERATE_INFOPLIST_FILE?: BoolString;

  /** Expand build settings in the `Info.plist` file. */
  INFOPLIST_EXPAND_BUILD_SETTINGS?: BoolString;

  /** Preprocess the `Info.plist` file using the C Preprocessor. */
  INFOPLIST_PREPROCESS?: BoolString;

  /** Implicitly include the given file when preprocessing the `Info.plist` file. */
  INFOPLIST_PREFIX_HEADER?: string;

  /** Space-separated list of preprocessor macros for preprocessing the `Info.plist` file. */
  INFOPLIST_PREPROCESSOR_DEFINITIONS?: string;

  /** Other flags to pass to the C preprocessor when preprocessing the `Info.plist` file. */
  INFOPLIST_OTHER_PREPROCESSOR_FLAGS?: string;

  /** Specifies the output encoding for the output `Info.plist`. */
  INFOPLIST_OUTPUT_FORMAT?: "binary" | "XML" | (string & {});

  /** Specifies the path to the bundle's information property list file. */
  INFOPLIST_PATH?: string;

  /** Creates a section called `__info_plist` in the `__TEXT` segment of the linked binary. */
  CREATE_INFOPLIST_SECTION_IN_BINARY?: BoolString;

  // ============================================================================
  // Info.plist Keys (GENERATE_INFOPLIST_FILE)
  // ============================================================================

  /** Bundle Display Name */
  INFOPLIST_KEY_CFBundleDisplayName?: string;

  /** Complication Principal Class */
  INFOPLIST_KEY_CLKComplicationPrincipalClass?: string;

  /** Supports Game Controller User Interaction */
  INFOPLIST_KEY_GCSupportsControllerUserInteraction?: BoolString;

  /** Supports Game Mode */
  INFOPLIST_KEY_GCSupportsGameMode?: BoolString;

  /** App Uses Non-Exempt Encryption */
  INFOPLIST_KEY_ITSAppUsesNonExemptEncryption?: BoolString;

  /** App Encryption Export Compliance Code */
  INFOPLIST_KEY_ITSEncryptionExportComplianceCode?: string;

  /** Application Category */
  INFOPLIST_KEY_LSApplicationCategoryType?: string;

  /** Application is Background Only */
  INFOPLIST_KEY_LSBackgroundOnly?: BoolString;

  /** Supports Opening Documents in Place */
  INFOPLIST_KEY_LSSupportsOpeningDocumentsInPlace?: BoolString;

  /** Application is Agent (UIElement) */
  INFOPLIST_KEY_LSUIElement?: BoolString;

  /** Metal Capture Enabled */
  INFOPLIST_KEY_MetalCaptureEnabled?: BoolString;

  /** Privacy - NFC Scan Usage Description */
  INFOPLIST_KEY_NFCReaderUsageDescription?: string;

  /** Privacy - Accessory Tracking Usage Description */
  INFOPLIST_KEY_NSAccessoryTrackingUsageDescription?: string;

  /** Privacy - Other Application Data Usage Description */
  INFOPLIST_KEY_NSAppDataUsageDescription?: string;

  /** Privacy - AppleEvents Sending Usage Description */
  INFOPLIST_KEY_NSAppleEventsUsageDescription?: string;

  /** Privacy - Media Library Usage Description */
  INFOPLIST_KEY_NSAppleMusicUsageDescription?: string;

  /** Privacy - Bluetooth Always Usage Description */
  INFOPLIST_KEY_NSBluetoothAlwaysUsageDescription?: string;

  /** Privacy - Bluetooth Peripheral Usage Description */
  INFOPLIST_KEY_NSBluetoothPeripheralUsageDescription?: string;

  /** Privacy - Bluetooth While In Use Usage Description */
  INFOPLIST_KEY_NSBluetoothWhileInUseUsageDescription?: string;

  /** Privacy - Calendars Full Access Usage Description */
  INFOPLIST_KEY_NSCalendarsFullAccessUsageDescription?: string;

  /** Privacy - Calendars Usage Description */
  INFOPLIST_KEY_NSCalendarsUsageDescription?: string;

  /** Privacy - Calendars Write Only Usage Description */
  INFOPLIST_KEY_NSCalendarsWriteOnlyAccessUsageDescription?: string;

  /** Privacy - Camera Usage Description */
  INFOPLIST_KEY_NSCameraUsageDescription?: string;

  /** Privacy - Contacts Usage Description */
  INFOPLIST_KEY_NSContactsUsageDescription?: string;

  /** Privacy - Critical Messaging Usage Description */
  INFOPLIST_KEY_NSCriticalMessagingUsageDescription?: string;

  /** Privacy - Desktop Folder Usage Description */
  INFOPLIST_KEY_NSDesktopFolderUsageDescription?: string;

  /** Privacy - Documents Folder Usage Description */
  INFOPLIST_KEY_NSDocumentsFolderUsageDescription?: string;

  /** Privacy - Downloads Folder Usage Description */
  INFOPLIST_KEY_NSDownloadsFolderUsageDescription?: string;

  /** Privacy - Face ID Usage Description */
  INFOPLIST_KEY_NSFaceIDUsageDescription?: string;

  /** Privacy - Fall Detection Usage Description */
  INFOPLIST_KEY_NSFallDetectionUsageDescription?: string;

  /** Privacy - Access to a File Provide Domain Usage Description */
  INFOPLIST_KEY_NSFileProviderDomainUsageDescription?: string;

  /** Privacy - File Provider Presence Usage Description */
  INFOPLIST_KEY_NSFileProviderPresenceUsageDescription?: string;

  /** Privacy - Financial Data Usage Description */
  INFOPLIST_KEY_NSFinancialDataUsageDescription?: string;

  /** Privacy - Focus Status Usage Description */
  INFOPLIST_KEY_NSFocusStatusUsageDescription?: string;

  /** Privacy - GameKit Friend List Usage Description */
  INFOPLIST_KEY_NSGKFriendListUsageDescription?: string;

  /** Privacy - Hands Tracking Usage Description */
  INFOPLIST_KEY_NSHandsTrackingUsageDescription?: string;

  /** Privacy - Health Records Usage Description */
  INFOPLIST_KEY_NSHealthClinicalHealthRecordsShareUsageDescription?: string;

  /** Privacy - Health Share Usage Description */
  INFOPLIST_KEY_NSHealthShareUsageDescription?: string;

  /** Privacy - Health Update Usage Description */
  INFOPLIST_KEY_NSHealthUpdateUsageDescription?: string;

  /** Privacy - HomeKit Usage Description */
  INFOPLIST_KEY_NSHomeKitUsageDescription?: string;

  /** Copyright (Human-Readable) */
  INFOPLIST_KEY_NSHumanReadableCopyright?: string;

  /** Privacy - Identity Usage Description */
  INFOPLIST_KEY_NSIdentityUsageDescription?: string;

  /** Privacy - Local Network Usage Description */
  INFOPLIST_KEY_NSLocalNetworkUsageDescription?: string;

  /** Privacy - Location Always and When In Use Usage Description */
  INFOPLIST_KEY_NSLocationAlwaysAndWhenInUseUsageDescription?: string;

  /** Privacy - Location Always Usage Description */
  INFOPLIST_KEY_NSLocationAlwaysUsageDescription?: string;

  /** Privacy - Location Temporary Usage Description Dictionary */
  INFOPLIST_KEY_NSLocationTemporaryUsageDescriptionDictionary?: string;

  /** Privacy - Location Usage Description */
  INFOPLIST_KEY_NSLocationUsageDescription?: string;

  /** Privacy - Location When In Use Usage Description */
  INFOPLIST_KEY_NSLocationWhenInUseUsageDescription?: string;

  /** Privacy - Main Camera Usage Description */
  INFOPLIST_KEY_NSMainCameraUsageDescription?: string;

  /** Main Nib File Base Name */
  INFOPLIST_KEY_NSMainNibFile?: string;

  /** AppKit Main Storyboard File Base Name */
  INFOPLIST_KEY_NSMainStoryboardFile?: string;

  /** Privacy - Microphone Usage Description */
  INFOPLIST_KEY_NSMicrophoneUsageDescription?: string;

  /** Privacy - Motion Usage Description */
  INFOPLIST_KEY_NSMotionUsageDescription?: string;

  /** Privacy - Nearby Interaction Allow Once Usage Description */
  INFOPLIST_KEY_NSNearbyInteractionAllowOnceUsageDescription?: string;

  /** Privacy - Nearby Interaction Usage Description */
  INFOPLIST_KEY_NSNearbyInteractionUsageDescription?: string;

  /** Privacy - Network Volumes Usage Description */
  INFOPLIST_KEY_NSNetworkVolumesUsageDescription?: string;

  /** Privacy - Photo Library Additions Usage Description */
  INFOPLIST_KEY_NSPhotoLibraryAddUsageDescription?: string;

  /** Privacy - Photo Library Usage Description */
  INFOPLIST_KEY_NSPhotoLibraryUsageDescription?: string;

  /** Principal Class */
  INFOPLIST_KEY_NSPrincipalClass?: string;

  /** Privacy - Reminders Full Access Usage Description */
  INFOPLIST_KEY_NSRemindersFullAccessUsageDescription?: string;

  /** Privacy - Reminders Usage Description */
  INFOPLIST_KEY_NSRemindersUsageDescription?: string;

  /** Privacy - Removable Volumes Usage Description */
  INFOPLIST_KEY_NSRemovableVolumesUsageDescription?: string;

  /** Privacy - SensorKit Privacy Policy URL */
  INFOPLIST_KEY_NSSensorKitPrivacyPolicyURL?: string;

  /** Privacy - SensorKit Usage Description */
  INFOPLIST_KEY_NSSensorKitUsageDescription?: string;

  /** Privacy - Siri Usage Description */
  INFOPLIST_KEY_NSSiriUsageDescription?: string;

  /** Privacy - Speech Recognition Usage Description */
  INFOPLIST_KEY_NSSpeechRecognitionUsageDescription?: string;

  /** Sticker Sharing Level */
  INFOPLIST_KEY_NSStickerSharingLevel?: string;

  /** Supports Live Activities */
  INFOPLIST_KEY_NSSupportsLiveActivities?: BoolString;

  /** Supports Frequent Updates of Live Activities */
  INFOPLIST_KEY_NSSupportsLiveActivitiesFrequentUpdates?: BoolString;

  /** Privacy - System Administration Usage Description */
  INFOPLIST_KEY_NSSystemAdministrationUsageDescription?: string;

  /** Privacy - System Extension Usage Description */
  INFOPLIST_KEY_NSSystemExtensionUsageDescription?: string;

  /** Privacy - Tracking Usage Description */
  INFOPLIST_KEY_NSUserTrackingUsageDescription?: string;

  /** Privacy - TV Provider Usage Description */
  INFOPLIST_KEY_NSVideoSubscriberAccountUsageDescription?: string;

  /** Privacy - VoIP Usage Description */
  INFOPLIST_KEY_NSVoIPUsageDescription?: string;

  /** Privacy - World Sensing Usage Description */
  INFOPLIST_KEY_NSWorldSensingUsageDescription?: string;

  /** Privacy - Driver Extension Usage Description */
  INFOPLIST_KEY_OSBundleUsageDescription?: string;

  /** Application Scene Manifest (Generation) */
  INFOPLIST_KEY_UIApplicationSceneManifest_Generation?: BoolString;

  /** Supports Indirect Events */
  INFOPLIST_KEY_UIApplicationSupportsIndirectInputEvents?: BoolString;

  /** Launch Screen (Generation) */
  INFOPLIST_KEY_UILaunchScreen_Generation?: BoolString;

  /** Launch Screen Interface File Base Name */
  INFOPLIST_KEY_UILaunchStoryboardName?: string;

  /** UIKit Main Storyboard File Base Name */
  INFOPLIST_KEY_UIMainStoryboardFile?: string;

  /** Required Device Capabilities */
  INFOPLIST_KEY_UIRequiredDeviceCapabilities?: string;

  /** Requires Full Screen */
  INFOPLIST_KEY_UIRequiresFullScreen?: BoolString;

  /** Status Bar Initially Hidden */
  INFOPLIST_KEY_UIStatusBarHidden?: BoolString;

  /** Status Bar Style */
  INFOPLIST_KEY_UIStatusBarStyle?: string;

  /** Supported Interface Orientations */
  INFOPLIST_KEY_UISupportedInterfaceOrientations?: string;

  /** Supported Interface Orientations (iPad) */
  INFOPLIST_KEY_UISupportedInterfaceOrientations_iPad?: string;

  /** Supported Interface Orientations (iPhone) */
  INFOPLIST_KEY_UISupportedInterfaceOrientations_iPhone?: string;

  /** Supports Document Browser */
  INFOPLIST_KEY_UISupportsDocumentBrowser?: BoolString;

  /** User Interface Style */
  INFOPLIST_KEY_UIUserInterfaceStyle?: string;

  /** WatchKit Companion App Bundle Identifier */
  INFOPLIST_KEY_WKCompanionAppBundleIdentifier?: string;

  /** WatchKit Extension Delegate Class Name */
  INFOPLIST_KEY_WKExtensionDelegateClassName?: string;

  /** App Can Run Independently of Companion iPhone App */
  INFOPLIST_KEY_WKRunsIndependentlyOfCompanionApp?: BoolString;

  /** Supports Launch for Live Activity Attribute Types */
  INFOPLIST_KEY_WKSupportsLiveActivityLaunchAttributeTypes?: string;

  /** App is Available Only on Apple Watch */
  INFOPLIST_KEY_WKWatchOnly?: BoolString;

  // Platform-specific Info.plist key overrides
  "INFOPLIST_KEY_UIApplicationSceneManifest_Generation[sdk=iphoneos*]"?: BoolString;
  "INFOPLIST_KEY_UIApplicationSceneManifest_Generation[sdk=iphonesimulator*]"?: BoolString;
  "INFOPLIST_KEY_UIApplicationSupportsIndirectInputEvents[sdk=iphoneos*]"?: BoolString;
  "INFOPLIST_KEY_UIApplicationSupportsIndirectInputEvents[sdk=iphonesimulator*]"?: BoolString;
  "INFOPLIST_KEY_UILaunchScreen_Generation[sdk=iphoneos*]"?: BoolString;
  "INFOPLIST_KEY_UILaunchScreen_Generation[sdk=iphonesimulator*]"?: BoolString;
  "INFOPLIST_KEY_UIStatusBarStyle[sdk=iphoneos*]"?: string;
  "INFOPLIST_KEY_UIStatusBarStyle[sdk=iphonesimulator*]"?: string;

  // ============================================================================
  // Code Signing
  // ============================================================================

  /** The path to a file specifying code-signing entitlements. */
  CODE_SIGN_ENTITLEMENTS?: string;

  /** The name of a valid code-signing certificate in a keychain. */
  CODE_SIGN_IDENTITY?: string;

  /** SDK-specific code signing identity override. */
  "CODE_SIGN_IDENTITY[sdk=iphoneos*]"?: "iPhone Developer" | (string & {});

  /** Automatically inject entitlements from the platform's BaseEntitlements.plist. */
  CODE_SIGN_INJECT_BASE_ENTITLEMENTS?: BoolString;

  /** This setting specifies the method used to acquire and locate signing assets. */
  CODE_SIGN_STYLE?: "Automatic" | "Manual" | (string & {});

  /** The team ID of a development team to use for signing certificates and provisioning profiles. */
  DEVELOPMENT_TEAM?: string;

  /** Must contain a profile name (or UUID). */
  PROVISIONING_PROFILE_SPECIFIER?: string;

  // ============================================================================
  // Swift Settings
  // ============================================================================

  /** A list of compilation conditions to enable for conditional compilation expressions. */
  SWIFT_ACTIVE_COMPILATION_CONDITIONS?: string;

  /** Enables upcoming features that aim to provide a more approachable path to Swift Concurrency. */
  SWIFT_APPROACHABLE_CONCURRENCY?: BoolString;

  /** This setting controls the way the Swift files in a module are rebuilt. */
  SWIFT_COMPILATION_MODE?: "singlefile" | "wholemodule" | (string & {});

  /** Controls default actor isolation for unannotated code. */
  SWIFT_DEFAULT_ACTOR_ISOLATION?: "MainActor" | "nonisolated" | (string & {});

  /** Disable runtime safety checks when optimizing. */
  SWIFT_DISABLE_SAFETY_CHECKS?: BoolString;

  /** A list of protocol names whose conformances the Swift compiler is to emit compile-time-known values for. */
  SWIFT_EMIT_CONST_VALUE_PROTOCOLS?: string[];

  /** When enabled, the Swift compiler will be used to extract Swift string literal and interpolation types during localization export. */
  SWIFT_EMIT_LOC_STRINGS?: BoolString;

  /** Enables the use of the forward slash syntax for regular-expressions. */
  SWIFT_ENABLE_BARE_SLASH_REGEX?: BoolString;

  /** Emit the extracted compile-time known values from the Swift compiler. */
  SWIFT_ENABLE_EMIT_CONST_VALUES?: BoolString;

  /** Coordinates the build of the main module's modular dependencies via explicit tasks. */
  SWIFT_ENABLE_EXPLICIT_MODULES?: BoolString;

  /** Enforce exclusive access at run-time. */
  SWIFT_ENFORCE_EXCLUSIVE_ACCESS?: "on" | "off" | "full" | (string & {});

  /** A list of paths to be searched by the Swift compiler for additional Swift modules. */
  SWIFT_INCLUDE_PATHS?: string | string[];

  /** For frameworks, install the Swift module so it can be accessed from Swift code. */
  SWIFT_INSTALL_MODULE?: BoolString;

  /** For frameworks, install the C++/Objective-C generated header. */
  SWIFT_INSTALL_OBJC_HEADER?: BoolString;

  /** Automatically link frameworks and libraries that are referenced using `import`. */
  SWIFT_MODULES_AUTOLINK?: BoolString;

  /** Path to the header defining the Objective-C interfaces to be exposed in Swift. */
  SWIFT_OBJC_BRIDGING_HEADER?: string;

  /** Name to use for the header that is generated by the Swift compiler. */
  SWIFT_OBJC_INTERFACE_HEADER_NAME?: string;

  /** Determines whether Swift can interoperate with C++ in addition to Objective-C. */
  SWIFT_OBJC_INTEROP_MODE?: "objc" | "objcxx" | (string & {});

  /** Optimization level for Swift compiler. */
  SWIFT_OPTIMIZATION_LEVEL?: "-Onone" | "-O" | "-Osize" | (string & {});

  /** An identifier that allows grouping of modules with access to symbols with a package access modifier. */
  SWIFT_PACKAGE_NAME?: string;

  /** Generate a precompiled header for the Objective-C bridging header. */
  SWIFT_PRECOMPILE_BRIDGING_HEADER?: BoolString;

  /** This setting controls the level of reflection metadata the Swift compiler emits. */
  SWIFT_REFLECTION_METADATA_LEVEL?: "all" | "without-names" | "none" | (string & {});

  /** When enabled, does not automatically link any frameworks which are referenced using `import`. */
  SWIFT_SKIP_AUTOLINKING_ALL_FRAMEWORKS?: BoolString;

  /** A list of framework names which should not be automatically linked. */
  SWIFT_SKIP_AUTOLINKING_FRAMEWORKS?: string[];

  /** A list of library names which should not be automatically linked. */
  SWIFT_SKIP_AUTOLINKING_LIBRARIES?: string[];

  /** Enables strict concurrency checking to produce warnings for possible data races. */
  SWIFT_STRICT_CONCURRENCY?: "minimal" | "targeted" | "complete" | (string & {});

  /** Enable strict memory safety checking. */
  SWIFT_STRICT_MEMORY_SAFETY?: BoolString;

  /** Don't emit any warnings. */
  SWIFT_SUPPRESS_WARNINGS?: BoolString;

  /** A list of paths to be searched by the Swift compiler for additional system Swift modules. */
  SWIFT_SYSTEM_INCLUDE_PATHS?: string | string[];

  /** Treat all warnings as errors. */
  SWIFT_TREAT_WARNINGS_AS_ERRORS?: BoolString;

  /** The language version used to compile the target's Swift code. */
  SWIFT_VERSION?: string;

  /** Specify diagnostic groups that should be treated as errors. */
  SWIFT_WARNINGS_AS_ERRORS_GROUPS?: string;

  /** Specify diagnostic groups that should remain warnings. */
  SWIFT_WARNINGS_AS_WARNINGS_GROUPS?: string;

  // Swift Upcoming Features
  SWIFT_UPCOMING_FEATURE_CONCISE_MAGIC_FILE?: BoolString;
  SWIFT_UPCOMING_FEATURE_DEPRECATE_APPLICATION_MAIN?: BoolString;
  SWIFT_UPCOMING_FEATURE_DISABLE_OUTWARD_ACTOR_ISOLATION?: BoolString;
  SWIFT_UPCOMING_FEATURE_DYNAMIC_ACTOR_ISOLATION?: BoolString;
  SWIFT_UPCOMING_FEATURE_EXISTENTIAL_ANY?: BoolString;
  SWIFT_UPCOMING_FEATURE_FORWARD_TRAILING_CLOSURES?: BoolString;
  SWIFT_UPCOMING_FEATURE_GLOBAL_ACTOR_ISOLATED_TYPES_USABILITY?: BoolString;
  SWIFT_UPCOMING_FEATURE_GLOBAL_CONCURRENCY?: BoolString;
  SWIFT_UPCOMING_FEATURE_IMPLICIT_OPEN_EXISTENTIALS?: BoolString;
  SWIFT_UPCOMING_FEATURE_IMPORT_OBJC_FORWARD_DECLS?: BoolString;
  SWIFT_UPCOMING_FEATURE_INFER_ISOLATED_CONFORMANCES?: BoolString;
  SWIFT_UPCOMING_FEATURE_INFER_SENDABLE_FROM_CAPTURES?: BoolString;
  SWIFT_UPCOMING_FEATURE_INTERNAL_IMPORTS_BY_DEFAULT?: BoolString;
  SWIFT_UPCOMING_FEATURE_ISOLATED_DEFAULT_VALUES?: BoolString;
  SWIFT_UPCOMING_FEATURE_MEMBER_IMPORT_VISIBILITY?: BoolString;
  SWIFT_UPCOMING_FEATURE_NONFROZEN_ENUM_EXHAUSTIVITY?: BoolString;
  SWIFT_UPCOMING_FEATURE_NONISOLATED_NONSENDING_BY_DEFAULT?: BoolString;
  SWIFT_UPCOMING_FEATURE_REGION_BASED_ISOLATION?: BoolString;

  // ============================================================================
  // Clang Settings
  // ============================================================================

  /** Choose a standard or non-standard C++ language dialect. */
  CLANG_CXX_LANGUAGE_STANDARD?:
    | "c++98"
    | "gnu++98"
    | "c++11"
    | "gnu++11"
    | "c++14"
    | "gnu++14"
    | "c++17"
    | "gnu++17"
    | "c++20"
    | "gnu++20"
    | "c++23"
    | "gnu++23"
    | "gnu++0x"
    | (string & {});

  /** Enable hardening in the C++ standard library. */
  CLANG_CXX_STANDARD_LIBRARY_HARDENING?: "none" | "fast" | "extensive" | "debug" | (string & {});

  /** Toggles the amount of debug information emitted when debug symbols are enabled. */
  CLANG_DEBUG_INFORMATION_LEVEL?: "default" | "line-tables-only" | (string & {});

  /** Enables compiler rewriting of allocation calls in C++ to provide type information to the allocator. */
  CLANG_ENABLE_CPLUSPLUS_TYPED_ALLOCATOR_SUPPORT?: BoolString;

  /** Controls whether variables with static or thread storage duration should have their exit-time destructors run. */
  CLANG_ENABLE_CPP_STATIC_DESTRUCTORS?: BoolString;

  /** Enables compiler rewriting of allocation calls in C to provide type information to the allocator. */
  CLANG_ENABLE_C_TYPED_ALLOCATOR_SUPPORT?: BoolString;

  /** Enables the use of modules for system APIs. */
  CLANG_ENABLE_MODULES?: BoolString;

  /** When enabled, `clang` will use the shared debug info available in `clang` modules and precompiled headers. */
  CLANG_ENABLE_MODULE_DEBUGGING?: BoolString;

  /** Compiles reference-counted Objective-C code to use Automatic Reference Counting. */
  CLANG_ENABLE_OBJC_ARC?: BoolString;

  /** This setting causes clang to use exception-handler-safe code when synthesizing retains and releases. */
  CLANG_ENABLE_OBJC_ARC_EXCEPTIONS?: BoolString;

  /** Compiles Objective-C code to enable weak references for code compiled with manual retain release semantics. */
  CLANG_ENABLE_OBJC_WEAK?: BoolString;

  /** Automatically initializes stack variables to zero as a security protection. */
  CLANG_ENABLE_STACK_ZERO_INIT?: BoolString;

  /** When linking a target using Objective-C code, implicitly link in Foundation. */
  CLANG_LINK_OBJC_RUNTIME?: BoolString;

  /** Automatically link SDK frameworks that are referenced using `#import` or `#include`. */
  CLANG_MODULES_AUTOLINK?: BoolString;

  /** Disable warnings related to the recommended use of private module naming. */
  CLANG_MODULES_DISABLE_PRIVATE_WARNING?: BoolString;

  /** The path to the file of the profile data to use when `CLANG_USE_OPTIMIZATION_PROFILE` is enabled. */
  CLANG_OPTIMIZATION_PROFILE_FILE?: string;

  /** The depth the static analyzer uses during the Build action. */
  CLANG_STATIC_ANALYZER_MODE?: "shallow" | "deep" | (string & {});

  /** The depth the static analyzer uses during the Analyze action. */
  CLANG_STATIC_ANALYZER_MODE_ON_ANALYZE_ACTION?: "shallow" | "deep" | (string & {});

  /** Specify whether stack variables should be uninitialized or pattern-initialized. */
  CLANG_TRIVIAL_AUTO_VAR_INIT?: "uninitialized" | "pattern" | (string & {});

  /** Check for unsigned integer overflow in addition to checks for signed integer overflow. */
  CLANG_UNDEFINED_BEHAVIOR_SANITIZER_INTEGER?: BoolString;

  /** Check for violations of nullability annotations. */
  CLANG_UNDEFINED_BEHAVIOR_SANITIZER_NULLABILITY?: BoolString;

  /** When enabled, `clang` will use the optimization profile collected for a target. */
  CLANG_USE_OPTIMIZATION_PROFILE?: BoolString;

  /** When enabled, the build system will use response files to share common arguments. */
  CLANG_USE_RESPONSE_FILE?: BoolString;

  /** Enables the use of extended vector instructions. */
  CLANG_X86_VECTOR_INSTRUCTIONS?: "default" | "sse3" | "ssse3" | "sse4.1" | "sse4.2" | "avx" | "avx2" | "avx512" | (string & {});

  /** Check for C++ container overflow when Address Sanitizer is enabled. */
  CLANG_ADDRESS_SANITIZER_CONTAINER_OVERFLOW?: BoolString;

  /** Enabling this setting allows non-modular includes to be used from within framework modules. */
  CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES?: BoolString;

  // ============================================================================
  // Clang Static Analyzer
  // ============================================================================

  /** Check for values stored to variables and never read again. */
  CLANG_ANALYZER_DEADCODE_DEADSTORES?: BoolString;

  /** Check for division by zero. */
  CLANG_ANALYZER_DIVIDE_BY_ZERO?: BoolString;

  /** Check for misuses of the Grand Central Dispatch API. */
  CLANG_ANALYZER_GCD?: BoolString;

  /** Check for Grand Central Dispatch idioms that may lead to poor performance. */
  CLANG_ANALYZER_GCD_PERFORMANCE?: BoolString;

  /** Finds leaks and over-releases associated with objects inheriting from OSObject. */
  CLANG_ANALYZER_LIBKERN_RETAIN_COUNT?: BoolString;

  /** Warn when a call to an `NSLocalizedString()` macro is missing a context comment. */
  CLANG_ANALYZER_LOCALIZABILITY_EMPTY_CONTEXT?: BoolString;

  /** Warn when a nonlocalized string is passed to a user interface method expecting a localized string. */
  CLANG_ANALYZER_LOCALIZABILITY_NONLOCALIZED?: BoolString;

  /** Warn about memory leaks, use-after-free, and other API misuses. */
  CLANG_ANALYZER_MEMORY_MANAGEMENT?: BoolString;

  /** Warn when a MIG routine violates memory management conventions. */
  CLANG_ANALYZER_MIG_CONVENTIONS?: BoolString;

  /** Check for misuses of `nonnull` parameter and return types. */
  CLANG_ANALYZER_NONNULL?: BoolString;

  /** Check for dereferences of null pointers. */
  CLANG_ANALYZER_NULL_DEREFERENCE?: BoolString;

  /** Warn when a number object is compared or converted to a primitive value. */
  CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION?: BoolString;

  /** Warn on `nil` pointers used as mutexes for `@synchronized`. */
  CLANG_ANALYZER_OBJC_ATSYNC?: BoolString;

  /** Warn if `CF` collections are created with non-pointer-size values. */
  CLANG_ANALYZER_OBJC_COLLECTIONS?: BoolString;

  /** Warn when an instance is improperly cleaned up in `-dealloc`. */
  CLANG_ANALYZER_OBJC_DEALLOC?: BoolString;

  /** Warn if a specialized generic type is converted to an incompatible type. */
  CLANG_ANALYZER_OBJC_GENERICS?: BoolString;

  /** Warn about Objective-C method signatures with type incompatibilities. */
  CLANG_ANALYZER_OBJC_INCOMP_METHOD_TYPES?: BoolString;

  /** Warn if functions accepting `CFErrorRef` or `NSError` cannot indicate that an error occurred. */
  CLANG_ANALYZER_OBJC_NSCFERROR?: BoolString;

  /** Warn on leaks and improper reference count management. */
  CLANG_ANALYZER_OBJC_RETAIN_COUNT?: BoolString;

  /** Check that `super init` is properly called within an Objective-C initialization method. */
  CLANG_ANALYZER_OBJC_SELF_INIT?: BoolString;

  /** Warn about private ivars that are never used. */
  CLANG_ANALYZER_OBJC_UNUSED_IVARS?: BoolString;

  /** Warn when a C-style cast is used for downcasting a pointer to an OSObject. */
  CLANG_ANALYZER_OSOBJECT_C_STYLE_CAST?: BoolString;

  /** Check for potential buffer overflows. (EXPERIMENTAL) */
  CLANG_ANALYZER_SECURITY_BUFFER_OVERFLOW_EXPERIMENTAL?: BoolString;

  /** Warn on using a floating point value as a loop counter. */
  CLANG_ANALYZER_SECURITY_FLOATLOOPCOUNTER?: BoolString;

  /** Warn on uses of `getpw` and `gets`. */
  CLANG_ANALYZER_SECURITY_INSECUREAPI_GETPW_GETS?: BoolString;

  /** Warn on uses of `mktemp`, which produces predictable temporary files. */
  CLANG_ANALYZER_SECURITY_INSECUREAPI_MKSTEMP?: BoolString;

  /** Warn on uses of `rand`, `random`, and related functions. */
  CLANG_ANALYZER_SECURITY_INSECUREAPI_RAND?: BoolString;

  /** Warn on uses of the `strcpy` and `strcat` functions. */
  CLANG_ANALYZER_SECURITY_INSECUREAPI_STRCPY?: BoolString;

  /** Warn on uses of sensitive functions whose return values must be always checked. */
  CLANG_ANALYZER_SECURITY_INSECUREAPI_UNCHECKEDRETURN?: BoolString;

  /** Warn on uses of the `vfork` function. */
  CLANG_ANALYZER_SECURITY_INSECUREAPI_VFORK?: BoolString;

  /** Check for leaks of keychain attribute lists and data buffers. */
  CLANG_ANALYZER_SECURITY_KEYCHAIN_API?: BoolString;

  /** Warn when a C++ object is used after it has been moved from. */
  CLANG_ANALYZER_USE_AFTER_MOVE?: BoolString;

  // ============================================================================
  // Clang Tidy
  // ============================================================================

  /** Warn when condition of assert or NSAssert has a side effect. */
  CLANG_TIDY_BUGPRONE_ASSERT_SIDE_EFFECT?: BoolString;

  /** Warn when a loop is discovered to have no termination condition. */
  CLANG_TIDY_BUGPRONE_INFINITE_LOOP?: BoolString;

  /** Warn when use of std::move on a universal reference would cause non-expiring lvalue arguments to be moved. */
  CLANG_TIDY_BUGPRONE_MOVE_FORWARDING_REFERENCE?: BoolString;

  /** Warn when an if-statement is redundant because its condition is equivalent to an enclosing if-statement. */
  CLANG_TIDY_BUGPRONE_REDUNDANT_BRANCH_CONDITION?: BoolString;

  /** Warn when a sub-expression of an arithmetic or logic expression can be omitted. */
  CLANG_TIDY_MISC_REDUNDANT_EXPRESSION?: BoolString;

  // ============================================================================
  // Clang Warnings
  // ============================================================================

  /** Warn about assigning integer constants to enum values that are out of range. */
  CLANG_WARN_ASSIGN_ENUM?: BoolString;

  /** Warns when an atomic is used with an implicitly sequentially-consistent memory order. */
  CLANG_WARN_ATOMIC_IMPLICIT_SEQ_CST?: BoolString;

  /** Warn about block captures of implicitly autoreleasing parameters. */
  CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING?: BoolString;

  /** Warn about implicit conversions to boolean values that are suspicious. */
  CLANG_WARN_BOOL_CONVERSION?: BoolString;

  /** Warn about suspicious uses of the comma operator. */
  CLANG_WARN_COMMA?: BoolString;

  /** Warn when a function-like parameter annotated as a completion handler is called more than once or not at all. */
  CLANG_WARN_COMPLETION_HANDLER_MISUSE?: BoolString;

  /** Warn about implicit conversions of constant values that cause the constant value to change. */
  CLANG_WARN_CONSTANT_CONVERSION?: BoolString;

  /** When compiling C++ code using a language standard older than C++11, warn about the use of C++11 extensions. */
  CLANG_WARN_CXX0X_EXTENSIONS?: BoolString;

  /** Warn when deleting an instance of a polymorphic class with virtual functions but without a virtual destructor. */
  CLANG_WARN_DELETE_NON_VIRTUAL_DTOR?: BoolString;

  /** Warn if an Objective-C class either subclasses a deprecated class or overrides a deprecated method. */
  CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS?: BoolString;

  /** Warn about direct accesses to the Objective-C `isa` pointer. */
  CLANG_WARN_DIRECT_OBJC_ISA_USAGE?: BoolString;

  /** Warns about issues in documentation comments. */
  CLANG_WARN_DOCUMENTATION_COMMENTS?: BoolString;

  /** Warn about loop bodies that are suspiciously empty. */
  CLANG_WARN_EMPTY_BODY?: BoolString;

  /** Warn about implicit conversions between different kinds of enum values. */
  CLANG_WARN_ENUM_CONVERSION?: BoolString;

  /** Warn about implicit conversions that turn floating-point numbers into integers. */
  CLANG_WARN_FLOAT_CONVERSION?: BoolString;

  /** Warns when a public framework header includes a private framework header. */
  CLANG_WARN_FRAMEWORK_INCLUDE_PRIVATE_FROM_PUBLIC?: BoolString;

  /** Warn about implicit fallthrough in switch statement. */
  CLANG_WARN_IMPLICIT_FALLTHROUGH?: BoolString;

  /** Warn about implicit integer conversions that change the signedness of an integer value. */
  CLANG_WARN_IMPLICIT_SIGN_CONVERSION?: BoolString;

  /** Warn if all paths through a function call itself. */
  CLANG_WARN_INFINITE_RECURSION?: BoolString;

  /** Warn about implicit conversions between pointers and integers. */
  CLANG_WARN_INT_CONVERSION?: BoolString;

  /** Warn about noescape annotations that are missing in a method's signature. */
  CLANG_WARN_MISSING_NOESCAPE?: BoolString;

  /** Warn about non-literal expressions that evaluate to zero being treated as a null pointer. */
  CLANG_WARN_NON_LITERAL_NULL_CONVERSION?: BoolString;

  /** Warns when a nullable expression is used somewhere it's not allowed. */
  CLANG_WARN_NULLABLE_TO_NONNULL_CONVERSION?: BoolString;

  /** Warn about implicit ownership types on Objective-C object references as out parameters. */
  CLANG_WARN_OBJC_EXPLICIT_OWNERSHIP_TYPE?: BoolString;

  /** Warn about `@property` declarations that are implicitly atomic. */
  CLANG_WARN_OBJC_IMPLICIT_ATOMIC_PROPERTIES?: BoolString;

  /** Warn about implicit retains of `self` within blocks. */
  CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF?: BoolString;

  /** Warn about instance variable declarations in `@interface`. */
  CLANG_WARN_OBJC_INTERFACE_IVARS?: BoolString;

  /** Warn about implicit conversions from Objective-C literals to values of incompatible type. */
  CLANG_WARN_OBJC_LITERAL_CONVERSION?: BoolString;

  /** Warn about properties that are not explicitly synthesized. */
  CLANG_WARN_OBJC_MISSING_PROPERTY_SYNTHESIS?: BoolString;

  /** Warn about repeatedly using a weak reference without assigning the weak reference to a strong reference. */
  CLANG_WARN_OBJC_REPEATED_USE_OF_WEAK?: BoolString;

  /** Warn about classes that unintentionally do not subclass a root class. */
  CLANG_WARN_OBJC_ROOT_CLASS?: BoolString;

  /** Warn when a translation unit is missing terminating '#pragma pack (pop)' directives. */
  CLANG_WARN_PRAGMA_PACK?: BoolString;

  /** Warn about private modules that do not use the recommended private module layout. */
  CLANG_WARN_PRIVATE_MODULE?: BoolString;

  /** Warns when a quoted include is used instead of a framework style include in a framework header. */
  CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER?: BoolString;

  /** Warn about ranged-based for loops. */
  CLANG_WARN_RANGE_LOOP_ANALYSIS?: BoolString;

  /** Warn about ignored semicolon between a method implementation's signature and body. */
  CLANG_WARN_SEMICOLON_BEFORE_METHOD_BODY?: BoolString;

  /** Warn about non-prototype declarations. */
  CLANG_WARN_STRICT_PROTOTYPES?: BoolString;

  /** Warn about various implicit conversions that can lose information or are otherwise suspicious. */
  CLANG_WARN_SUSPICIOUS_IMPLICIT_CONVERSION?: BoolString;

  /** Warn about suspicious uses of `std::move`. */
  CLANG_WARN_SUSPICIOUS_MOVE?: BoolString;

  /** Warn if an API that is newer than the deployment target is used without guards. */
  CLANG_WARN_UNGUARDED_AVAILABILITY?: BoolString;

  /** Warns about potentially unreachable code. */
  CLANG_WARN_UNREACHABLE_CODE?: BoolString;

  /** Warn about a parsing ambiguity between a variable declaration and a function-style cast. */
  CLANG_WARN_VEXING_PARSE?: BoolString;

  /** Warn about using `__bridge` casts when not using ARC. */
  CLANG_WARN__ARC_BRIDGE_CAST_NONARC?: BoolString;

  /** Warn about declaring the same method more than once within the same `@interface`. */
  CLANG_WARN__DUPLICATE_METHOD_MATCH?: BoolString;

  /** Warn about destructors for C++ objects that are called when an application is terminating. */
  CLANG_WARN__EXIT_TIME_DESTRUCTORS?: BoolString;

  // ============================================================================
  // GCC Settings
  // ============================================================================

  /** Enabling this setting causes `char` to be unsigned by default. */
  GCC_CHAR_IS_UNSIGNED_CHAR?: BoolString;

  /** Enable the CodeWarrior/Microsoft syntax for inline assembly code. */
  GCC_CW_ASM_SYNTAX?: BoolString;

  /** Choose a standard or non-standard C language dialect. */
  GCC_C_LANGUAGE_STANDARD?:
    | "ansi"
    | "c89"
    | "gnu89"
    | "c99"
    | "gnu99"
    | "c11"
    | "gnu11"
    | "c17"
    | "gnu17"
    | "c23"
    | "gnu23"
    | (string & {});

  /** Faster function calls for applications. Not appropriate for shared libraries. */
  GCC_DYNAMIC_NO_PIC?: BoolString;

  /** Controls whether `asm`, `inline`, and `typeof` are treated as keywords. */
  GCC_ENABLE_ASM_KEYWORD?: BoolString;

  /** Controls whether builtin functions that do not begin with `__builtin_` are recognized. */
  GCC_ENABLE_BUILTIN_FUNCTIONS?: BoolString;

  /** Enable C++ exception handling. */
  GCC_ENABLE_CPP_EXCEPTIONS?: BoolString;

  /** Enable generation of information for C++ runtime type identification. */
  GCC_ENABLE_CPP_RTTI?: BoolString;

  /** Enable exception handling. */
  GCC_ENABLE_EXCEPTIONS?: BoolString;

  /** Generate output containing library calls for floating point. */
  GCC_ENABLE_FLOATING_POINT_LIBRARY_CALLS?: BoolString;

  /** Activating this setting enables kernel development mode. */
  GCC_ENABLE_KERNEL_DEVELOPMENT?: BoolString;

  /** This setting enables `@try`/`@catch`/`@throw` syntax for handling exceptions in Objective-C code. */
  GCC_ENABLE_OBJC_EXCEPTIONS?: BoolString;

  /** Recognize and construct Pascal-style string literals. */
  GCC_ENABLE_PASCAL_STRINGS?: BoolString;

  /** Specifies whether the binary uses the builtin functions that provide access to the SSE3 extensions. */
  GCC_ENABLE_SSE3_EXTENSIONS?: BoolString;

  /** Specifies whether the binary uses the builtin functions that provide access to the SSE4.1 extensions. */
  GCC_ENABLE_SSE41_EXTENSIONS?: BoolString;

  /** Specifies whether the binary uses the builtin functions that provide access to the SSE4.2 extensions. */
  GCC_ENABLE_SSE42_EXTENSIONS?: BoolString;

  /** Controls whether or not trigraphs are permitted in the source code. */
  GCC_ENABLE_TRIGRAPHS?: BoolString;

  /** Enables some floating point optimizations that are not IEEE754-compliant. */
  GCC_FAST_MATH?: BoolString;

  /** Enables or disables generation of debug symbols. */
  GCC_GENERATE_DEBUGGING_SYMBOLS?: BoolString;

  /** Activating this setting causes a `notes` file to be produced that the `gcov` code-coverage utility can use. */
  GCC_GENERATE_TEST_COVERAGE_FILES?: BoolString;

  /** Enabling this option will enable increased sharing of precompiled headers among targets. */
  GCC_INCREASE_PRECOMPILED_HEADER_SHARING?: BoolString;

  /** When enabled, out-of-line copies of inline methods are declared `private extern`. */
  GCC_INLINES_ARE_PRIVATE_EXTERN?: BoolString;

  /** Specifies whether to compile each source file according to its file type. */
  GCC_INPUT_FILETYPE?: string;

  /** Activating this setting indicates that code should be added so program flow arcs are instrumented. */
  GCC_INSTRUMENT_PROGRAM_FLOW_ARCS?: BoolString;

  /** Enabling this option allows linking with the shared libraries. */
  GCC_LINK_WITH_DYNAMIC_LIBRARIES?: BoolString;

  /** In C, allocate even uninitialized global variables in the data section of the object file. */
  GCC_NO_COMMON_BLOCKS?: BoolString;

  /** Specifies the degree to which the generated code is optimized for speed and binary size. */
  GCC_OPTIMIZATION_LEVEL?: "0" | "1" | "2" | "3" | "s" | "fast" | "z" | (string & {});

  /** Generates a precompiled header for the prefix header. */
  GCC_PRECOMPILE_PREFIX_HEADER?: BoolString;

  /** Implicitly include the named header. */
  GCC_PREFIX_HEADER?: string;

  /** Space-separated list of preprocessor macros of the form `foo` or `foo=bar`. */
  GCC_PREPROCESSOR_DEFINITIONS?: string | string[];

  /** Space-separated list of preprocessor macros not used in precompiled headers. */
  GCC_PREPROCESSOR_DEFINITIONS_NOT_USED_IN_PRECOMPS?: string[];

  /** Reuse string literals. */
  GCC_REUSE_STRINGS?: BoolString;

  /** Make enums only as large as needed for the range of possible values. */
  GCC_SHORT_ENUMS?: BoolString;

  /** Optimize code by making more aggressive assumptions about whether pointers can point to the same objects. */
  GCC_STRICT_ALIASING?: BoolString;

  /** When enabled, all symbols are declared `private extern` unless explicitly marked to be exported. */
  GCC_SYMBOLS_PRIVATE_EXTERN?: BoolString;

  /** Emits extra code to use the routines specified in the C++ ABI for thread-safe initialization of local statics. */
  GCC_THREADSAFE_STATICS?: BoolString;

  /** Causes warnings about missing function prototypes to be treated as errors. */
  GCC_TREAT_IMPLICIT_FUNCTION_DECLARATIONS_AS_ERRORS?: BoolString;

  /** Enabling this option causes warnings about incompatible pointer types to be treated as errors. */
  GCC_TREAT_INCOMPATIBLE_POINTER_TYPE_WARNINGS_AS_ERRORS?: BoolString;

  /** Enabling this option causes all warnings to be treated as errors. */
  GCC_TREAT_WARNINGS_AS_ERRORS?: BoolString;

  /** Unrolls loops. */
  GCC_UNROLL_LOOPS?: BoolString;

  /** Controls whether the standard system directories are searched for header files. */
  GCC_USE_STANDARD_INCLUDE_SEARCHING?: BoolString;

  /** The compiler to use for C, C++, and Objective-C. */
  GCC_VERSION?: string;

  // ============================================================================
  // GCC Warnings
  // ============================================================================

  /** Warn if a value is implicitly converted from a 64-bit type to a 32-bit type. */
  GCC_WARN_64_TO_32_BIT_CONVERSION?: BoolString;

  /** Warn about the use of deprecated functions, variables, and types. */
  GCC_WARN_ABOUT_DEPRECATED_FUNCTIONS?: BoolString;

  /** Suppress warnings from applying the `offsetof` macro to a non-POD type. */
  GCC_WARN_ABOUT_INVALID_OFFSETOF_MACRO?: BoolString;

  /** Warn if a structure's initializer has some fields missing. */
  GCC_WARN_ABOUT_MISSING_FIELD_INITIALIZERS?: BoolString;

  /** Warn when a source file does not end with a newline. */
  GCC_WARN_ABOUT_MISSING_NEWLINE?: BoolString;

  /** Causes warnings to be emitted about missing prototypes. */
  GCC_WARN_ABOUT_MISSING_PROTOTYPES?: BoolString;

  /** Warn when pointers passed via arguments or assigned to a variable differ in sign. */
  GCC_WARN_ABOUT_POINTER_SIGNEDNESS?: BoolString;

  /** Causes warnings to be emitted when a function with a defined return type contains a return statement without a return-value. */
  GCC_WARN_ABOUT_RETURN_TYPE?: BoolString;

  /** Warn if methods required by a protocol are not implemented in the class adopting it. */
  GCC_WARN_ALLOW_INCOMPLETE_PROTOCOL?: BoolString;

  /** Warn whenever a switch statement has an index of enumeral type and lacks a case. */
  GCC_WARN_CHECK_SWITCH_STATEMENTS?: BoolString;

  /** Warn about four-char literals. */
  GCC_WARN_FOUR_CHARACTER_CONSTANTS?: BoolString;

  /** Warn when a function declaration hides virtual functions from a base class. */
  GCC_WARN_HIDDEN_VIRTUAL_FUNCTIONS?: BoolString;

  /** Inhibit all warning messages. */
  GCC_WARN_INHIBIT_ALL_WARNINGS?: BoolString;

  /** Warn if an aggregate or union initializer is not fully bracketed. */
  GCC_WARN_INITIALIZER_NOT_FULLY_BRACKETED?: BoolString;

  /** Warn if parentheses are omitted in certain contexts. */
  GCC_WARN_MISSING_PARENTHESES?: BoolString;

  /** Warn when a class declares a nonvirtual destructor that should probably be virtual. */
  GCC_WARN_NON_VIRTUAL_DESTRUCTOR?: BoolString;

  /** Issue all the warnings demanded by strict ISO C and ISO C++. */
  GCC_WARN_PEDANTIC?: BoolString;

  /** Warn whenever a local variable shadows another local variable, parameter or global variable. */
  GCC_WARN_SHADOW?: BoolString;

  /** Warn when a comparison between signed and unsigned values could produce an incorrect result. */
  GCC_WARN_SIGN_COMPARE?: BoolString;

  /** Warn if multiple methods with differing argument and/or return types are found for a given selector. */
  GCC_WARN_STRICT_SELECTOR_MATCH?: BoolString;

  /** Check calls to `printf` and `scanf` to make sure that the arguments supplied have types appropriate to the format string. */
  GCC_WARN_TYPECHECK_CALLS_TO_PRINTF?: BoolString;

  /** Warn if a `@selector(...)` expression referring to an undeclared selector is found. */
  GCC_WARN_UNDECLARED_SELECTOR?: BoolString;

  /** Warn if a variable might be clobbered by a `setjmp` call or if an automatic variable is used without prior initialization. */
  GCC_WARN_UNINITIALIZED_AUTOS?: BoolString;

  /** Warn when a `#pragma` directive is encountered that is not understood by GCC. */
  GCC_WARN_UNKNOWN_PRAGMAS?: BoolString;

  /** Warn whenever a static function is declared but not defined or a non-inline static function is unused. */
  GCC_WARN_UNUSED_FUNCTION?: BoolString;

  /** Warn whenever a label is declared but not used. */
  GCC_WARN_UNUSED_LABEL?: BoolString;

  /** Warn whenever a function parameter is unused aside from its declaration. */
  GCC_WARN_UNUSED_PARAMETER?: BoolString;

  /** Warn whenever a statement computes a result that is explicitly not used. */
  GCC_WARN_UNUSED_VALUE?: BoolString;

  /** Warn whenever a local variable or nonconstant static variable is unused aside from its declaration. */
  GCC_WARN_UNUSED_VARIABLE?: BoolString;

  // ============================================================================
  // Linking
  // ============================================================================

  /** Specifies the executable that will load the bundle output file being linked. */
  BUNDLE_LOADER?: string;

  /** Activating this setting causes the `-dead_strip` flag to be passed to `ld`. */
  DEAD_CODE_STRIPPING?: BoolString;

  /** This is a project-relative path to a file that lists the symbols to export. */
  EXPORTED_SYMBOLS_FILE?: string;

  /** This is a list of paths to folders containing frameworks to be searched by the compiler. */
  FRAMEWORK_SEARCH_PATHS?: string | string[];

  /** This is a list of paths to folders to be searched by the compiler for included or imported header files. */
  HEADER_SEARCH_PATHS?: string | string[];

  /** Activating this setting will preserve private external symbols. */
  KEEP_PRIVATE_EXTERNS?: BoolString;

  /** This setting passes the value with `-client_name` when linking the executable. */
  LD_CLIENT_NAME?: string;

  /** This setting defines the path to which the linker should emit information about what files it used as inputs. */
  LD_DEPENDENCY_INFO_FILE?: string;

  /** This setting restricts the clients allowed to link a dylib. */
  LD_DYLIB_ALLOWABLE_CLIENTS?: string[];

  /** Sets an internal `install path` (`LC_ID_DYLIB`) in a dynamic library. */
  LD_DYLIB_INSTALL_NAME?: string;

  /** This setting allows `key=value` pairs of `dyld` environment variables to be embedded. */
  LD_ENVIRONMENT?: string[];

  /** Export symbols from the binaries. */
  LD_EXPORT_SYMBOLS?: BoolString;

  /** Activating this setting will cause the linker to write a map file to disk. */
  LD_GENERATE_MAP_FILE?: BoolString;

  /** This setting defines the path to the map file written by the linker. */
  LD_MAP_FILE_PATH?: string;

  /** Activating this setting will prevent Xcode from building a main executable that is position independent (PIE). */
  LD_NO_PIE?: BoolString;

  /** This setting controls whether arguments to the linker should be quoted using `-Xlinker`. */
  LD_QUOTE_LINKER_ARGUMENTS_FOR_COMPILER_DRIVER?: BoolString;

  /** This is a list of paths to be added to the `runpath` search path list for the image being created. */
  LD_RUNPATH_SEARCH_PATHS?: string | string[];
  "LD_RUNPATH_SEARCH_PATHS[sdk=macosx*]"?: string | string[];

  /** Warn for linking the same library multiple times. */
  LD_WARN_DUPLICATE_LIBRARIES?: BoolString;

  /** Warn for any dylib linked to but not used. */
  LD_WARN_UNUSED_DYLIBS?: BoolString;

  /** This is a list of paths to folders to be searched by the linker for libraries used by the product. */
  LIBRARY_SEARCH_PATHS?: string | string[];

  /** Activating this setting causes the linker to display mangled names for C++ symbols. */
  LINKER_DISPLAYS_MANGLED_NAMES?: BoolString;

  /** When this setting is enabled, the compiler driver will automatically pass its standard libraries to the linker. */
  LINK_WITH_STANDARD_LIBRARIES?: BoolString;

  /** Enabling this setting allows optimization across file boundaries during linking. */
  LLVM_LTO?: "NO" | "YES" | "YES_THIN" | (string & {});

  /** This setting determines the format of the produced binary. */
  MACH_O_TYPE?: "mh_execute" | "mh_dylib" | "mh_bundle" | "staticlib" | "mh_object" | (string & {});

  /** The path to a file that alters the order in which functions and data are laid out. */
  ORDER_FILE?: string;

  /** Options defined in this setting are passed to invocations of the linker. */
  OTHER_LDFLAGS?: string | string[];

  /** Options defined in this setting are passed to all invocations of the archive librarian. */
  OTHER_LIBTOOLFLAGS?: string | string[];

  /** A project-relative path to a file that lists the symbols not to export. */
  UNEXPORTED_SYMBOLS_FILE?: string;

  // ============================================================================
  // Build Directories & Paths
  // ============================================================================

  /** Identifies the directory under which all the product's files can be found. */
  BUILT_PRODUCTS_DIR?: string;

  /** The base path where build products will be placed during a build for a given configuration. */
  CONFIGURATION_BUILD_DIR?: string;

  /** The base path where intermediates will be placed during a build for a given configuration. */
  CONFIGURATION_TEMP_DIR?: string;

  /** Specifies the directory inside the generated bundle that contains the product's files. */
  CONTENTS_FOLDER_PATH?: string;

  /** Identifies the directory into which derived source files are placed. */
  DERIVED_FILE_DIR?: string;

  /** Identifies the directory that contains the bundle's documentation files. */
  DOCUMENTATION_FOLDER_PATH?: string;

  /** The path at which all products will be rooted when performing an install build. */
  DSTROOT?: string;

  /** Sets the base value for the internal `install path` (`LC_ID_DYLIB`) in a dynamic library. */
  DYLIB_INSTALL_NAME_BASE?: string;

  /** Identifies the directory that contains additional binary files. */
  EXECUTABLES_FOLDER_PATH?: string;

  /** Identifies the directory that contains the binary the target builds. */
  EXECUTABLE_FOLDER_PATH?: string;

  /** Specifies the name of the binary the target produces. */
  EXECUTABLE_NAME?: string;

  /** Specifies the path to the binary the target produces within its bundle. */
  EXECUTABLE_PATH?: string;

  /** Specifies the directory that contains the product's embedded frameworks. */
  FRAMEWORKS_FOLDER_PATH?: string;

  /** Identifies the directory in the developer's filesystem into which the installed product is placed. */
  INSTALL_DIR?: string;

  /** The directory in which to install the build products. */
  INSTALL_PATH?: string;

  /** Specifies the directory that contains the product's Clang module maps and Swift module content. */
  MODULES_FOLDER_PATH?: string;

  /** Absolute path of folder in which compiler stores its cached modules. */
  MODULE_CACHE_DIR?: string;

  /** Partially identifies the directory into which variant object files are placed. */
  OBJECT_FILE_DIR?: string;

  /** The path where intermediate files will be placed during a build. */
  OBJROOT?: string;

  /** Specifies the directory that contains the product's plugins. */
  PLUGINS_FOLDER_PATH?: string;

  /** The location to copy the private headers to during building. */
  PRIVATE_HEADERS_FOLDER_PATH?: string;

  /** The location to copy the public headers to during building. */
  PUBLIC_HEADERS_FOLDER_PATH?: string;

  /** Identifies the directory containing the target's source files. */
  SRCROOT?: string;

  /** Identifies the root of the directory hierarchy that contains the product's files. */
  TARGET_BUILD_DIR?: string;

  /** Identifies the directory containing the target's intermediate build files. */
  TARGET_TEMP_DIR?: string;

  /** The path at which all products will be placed when performing a build. */
  SYMROOT?: string;

  /** Specifies the directory that contains the product's scripts. */
  SCRIPTS_FOLDER_PATH?: string;

  /** Specifies the directory that contains the product's shared frameworks. */
  SHARED_FRAMEWORKS_FOLDER_PATH?: string;

  /** The path where precompiled prefix header files are placed during a build. */
  SHARED_PRECOMPS_DIR?: string;

  /** Specifies the directory that contains the product's unlocalized resources. */
  UNLOCALIZED_RESOURCES_FOLDER_PATH?: string;

  // ============================================================================
  // Build Options
  // ============================================================================

  /** Always embed the Swift standard libraries in the target's products. */
  ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES?: BoolString;

  /** This setting is deprecated as of Xcode 8.3 and may not be supported in future versions. */
  ALWAYS_SEARCH_USER_PATHS?: BoolString;

  /** When enabled, this causes the compiler and linker to disallow use of APIs that are not available to app extensions. */
  APPLICATION_EXTENSION_API_ONLY?: BoolString;

  /** Enabling this setting will cause files in the target's Copy Files build phases to be processed by build rules. */
  APPLY_RULES_IN_COPY_FILES?: BoolString;

  /** Enabling this setting will cause all Public and Private headers in the target's Copy Headers build phase to be processed by build rules. */
  APPLY_RULES_IN_COPY_HEADERS?: BoolString;

  /** Ensures that your libraries are built for distribution. */
  BUILD_LIBRARY_FOR_DISTRIBUTION?: BoolString;

  /** A list of the build variants of the linked binary that will be produced. */
  BUILD_VARIANTS?: string[];

  /** Combines image files at different resolutions into one multi-page TIFF file. */
  COMBINE_HIDPI_IMAGES?: BoolString;

  /** Caches the results of compilations for a particular set of inputs. */
  COMPILATION_CACHE_ENABLE_CACHING?: BoolString;

  /** Emits diagnostic information for cached compilation tasks. */
  COMPILATION_CACHE_ENABLE_DIAGNOSTIC_REMARKS?: BoolString;

  /** Control whether the compiler should emit index data while building. */
  COMPILER_INDEX_STORE_ENABLE?: BoolString;

  /** If enabled, PNG resource files are compressed as they are copied. */
  COMPRESS_PNG_FILES?: BoolString;

  /** Causes the copying of resources to preserve resource forks and Finder info. */
  COPYING_PRESERVES_HFS_DATA?: BoolString;

  /** If enabled, headers are run through the `unifdef(1)` tool when copied to the product. */
  COPY_HEADERS_RUN_UNIFDEF?: BoolString;

  /** Specifies the flags to pass to `unifdef(1)` when copying headers. */
  COPY_HEADERS_UNIFDEF_FLAGS?: string;

  /** Specifies whether binary files that are copied during the build should be stripped of debugging symbols. */
  COPY_PHASE_STRIP?: BoolString;

  /** The type of debug information to produce. */
  DEBUG_INFORMATION_FORMAT?: "dwarf" | "dwarf-with-dsym" | (string & {});

  /** The format of the debug information to produce. */
  DEBUG_INFORMATION_VERSION?: "compiler-default" | "dwarf4" | "dwarf5" | (string & {});

  /** If enabled, the product will be treated as defining its own module. */
  DEFINES_MODULE?: BoolString;

  /** If enabled, built products are placed in their installed locations in addition to the built products folder. */
  DEPLOYMENT_LOCATION?: BoolString;

  /** If enabled, indicates that binaries should be stripped and file mode, owner, and group information should be set to standard values. */
  DEPLOYMENT_POSTPROCESSING?: BoolString;

  /** When enabled, Xcode will automatically derive a bundle identifier for this target from its original bundle identifier when building for Mac Catalyst. */
  DERIVE_MACCATALYST_PRODUCT_BUNDLE_IDENTIFIER?: BoolString;

  /** Files and directories used only for development. Archive and install builds will exclude this content. */
  DEVELOPMENT_ASSET_PATHS?: string;

  /** If enabled, the build system will emit a TBD file for Swift-only framework and dynamic library targets. */
  EAGER_LINKING?: BoolString;

  /** Embed all the built asset packs inside the product bundle. */
  EMBED_ASSET_PACKS_IN_PRODUCT_BUNDLE?: BoolString;

  /** When set, enables App Sandbox for a target. */
  ENABLE_APP_SANDBOX?: BoolString;

  /** Enables building with code coverage instrumentation. */
  ENABLE_CODE_COVERAGE?: BoolString;

  /** Enables a strict programming model that guarantees bounds safety in C++. */
  ENABLE_CPLUSPLUS_BOUNDS_SAFE_BUFFERS?: BoolString;

  /** Enables the -fbounds-safety language extension, which guarantees bounds safety for C. */
  ENABLE_C_BOUNDS_SAFETY?: BoolString;

  /** If enabled, debug builds of app and app extension targets will be built with the main binary code in a separate dylib. */
  ENABLE_DEBUG_DYLIB?: BoolString;

  /** Enables a set of security build settings. */
  ENABLE_ENHANCED_SECURITY?: BoolString;

  /** This setting indicates whether App Sandbox allows access to files in the user's downloads directory. */
  ENABLE_FILE_ACCESS_DOWNLOADS_FOLDER?: BoolString;

  /** This setting indicates whether App Sandbox allows access to files in the user's movies directory. */
  ENABLE_FILE_ACCESS_MOVIES_FOLDER?: BoolString;

  /** This setting indicates whether App Sandbox allows access to files in the user's music directory. */
  ENABLE_FILE_ACCESS_MUSIC_FOLDER?: BoolString;

  /** This setting indicates whether App Sandbox allows access to files in the user's pictures directory. */
  ENABLE_FILE_ACCESS_PICTURE_FOLDER?: BoolString;

  /** Enable hardened runtime restrictions. */
  ENABLE_HARDENED_RUNTIME?: BoolString;

  /** Specifies whether to automatically track dependencies on included header files. */
  ENABLE_HEADER_DEPENDENCIES?: BoolString;

  /** When set, enables incoming network connections. */
  ENABLE_INCOMING_NETWORK_CONNECTIONS?: BoolString;

  /** Enabled the incremental `distill` option in the asset catalog compiler. */
  ENABLE_INCREMENTAL_DISTILL?: BoolString;

  /** Enables clang module verification for frameworks. */
  ENABLE_MODULE_VERIFIER?: BoolString;

  /** Controls whether assertion logic provided by `NSAssert` is included in the preprocessed source code. */
  ENABLE_NS_ASSERTIONS?: BoolString;

  /** Omit inapplicable resources when building for a single device. */
  ENABLE_ONLY_ACTIVE_RESOURCES?: BoolString;

  /** If enabled, tagged assets are built into asset packs based on their combination of tags. */
  ENABLE_ON_DEMAND_RESOURCES?: BoolString;

  /** When set, enables outgoing network connections. */
  ENABLE_OUTGOING_NETWORK_CONNECTIONS?: BoolString;

  /** Builds the target with pointer authentication enabled. */
  ENABLE_POINTER_AUTHENTICATION?: BoolString;

  /** When enabled, literal strings in SwiftUI will be extracted during localization export. */
  ENABLE_PREVIEWS?: BoolString;

  /** When set, enables capture of audio with the built-in and external microphones. */
  ENABLE_RESOURCE_ACCESS_AUDIO_INPUT?: BoolString;

  /** When set, enables communication with connected Bluetooth devices. */
  ENABLE_RESOURCE_ACCESS_BLUETOOTH?: BoolString;

  /** When set, enables read-write access to the user's calendar. */
  ENABLE_RESOURCE_ACCESS_CALENDARS?: BoolString;

  /** When set, enables capture of images and movies with the built-in and external cameras. */
  ENABLE_RESOURCE_ACCESS_CAMERA?: BoolString;

  /** When set, enables read-write access to the user's Contacts database. */
  ENABLE_RESOURCE_ACCESS_CONTACTS?: BoolString;

  /** When set, enables access to determine the user's location using Location Services. */
  ENABLE_RESOURCE_ACCESS_LOCATION?: BoolString;

  /** A Boolean value that indicates whether the app has read-write access to the user's Photos library. */
  ENABLE_RESOURCE_ACCESS_PHOTO_LIBRARY?: BoolString;

  /** When set, enables access to print documents and media. */
  ENABLE_RESOURCE_ACCESS_PRINTING?: BoolString;

  /** When set, enables communication with connected USB devices. */
  ENABLE_RESOURCE_ACCESS_USB?: BoolString;

  /** Enables a set of security-relevant compiler warnings. */
  ENABLE_SECURITY_COMPILER_WARNINGS?: BoolString;

  /** Controls whether `objc_msgSend` calls must be cast to the appropriate function pointer type before being called. */
  ENABLE_STRICT_OBJC_MSGSEND?: BoolString;

  /** Enabling this setting will build the target with options appropriate for running automated tests. */
  ENABLE_TESTABILITY?: BoolString;

  /** Specifies whether the build system should add the search paths necessary for compiling and linking against testing-related libraries. */
  ENABLE_TESTING_SEARCH_PATHS?: BoolString;

  /** If enabled, the build system will sandbox user scripts to disallow undeclared input/output dependencies. */
  ENABLE_USER_SCRIPT_SANDBOXING?: BoolString;

  /** This setting indicates whether App Sandbox allows access to files the user selects. */
  ENABLE_USER_SELECTED_FILES?: "none" | "read-only" | "read-write" | (string & {});

  /** This is the extension used for the executable product generated by the target. */
  EXECUTABLE_EXTENSION?: string;

  /** The prefix used for the executable product generated by the target. */
  EXECUTABLE_PREFIX?: string;

  /** Specifies the suffix of the binary filename. */
  EXECUTABLE_SUFFIX?: string;

  /** Framework bundles are versioned by having contents in subfolders of a version folder. */
  FRAMEWORK_VERSION?: string;

  /** If enabled, consecutive run script phases will be allowed to run in parallel. */
  FUSE_BUILD_SCRIPT_PHASES?: BoolString;

  /** Automatically generate an Info.plist file. */
  GENERATE_INFOPLIST_FILE_?: BoolString;

  /** Enables the generation of intermediate Text-Based stubs for dynamic libraries and frameworks. */
  GENERATE_INTERMEDIATE_TEXT_BASED_STUBS?: BoolString;

  /** Forces the `PkgInfo` file to be written to wrapped products even if this file is not expected. */
  GENERATE_PKGINFO_FILE?: BoolString;

  /** Activating this setting will cause the object files built by a target to be prelinked using `ld -r`. */
  GENERATE_PRELINK_OBJECT_FILE?: BoolString;

  /** Activating this setting will cause the compiler and linker to generate profiling code. */
  GENERATE_PROFILING_CODE?: BoolString;

  /** Enables the generation of Text-Based stubs for dynamic libraries and frameworks. */
  GENERATE_TEXT_BASED_STUBS?: BoolString;

  /** Specifies whether the header map contains a name/path entry for every header in the target being built. */
  HEADERMAP_INCLUDES_FLAT_ENTRIES_FOR_TARGET_BEING_BUILT?: BoolString;

  /** Specifies whether the header map contains a framework-name/path entry for every header in the target being built. */
  HEADERMAP_INCLUDES_FRAMEWORK_ENTRIES_FOR_ALL_PRODUCT_TYPES?: BoolString;

  /** Specifies whether the header map contains a name/path entry for every header in the project. */
  HEADERMAP_INCLUDES_PROJECT_HEADERS?: BoolString;

  /** This setting allows for better control of sharing precompiled prefix header files between projects. */
  PRECOMPS_INCLUDE_HEADERS_FROM_BUILT_PRODUCTS_DIR?: BoolString;

  /** If enabled, don't install built products even if deployment locations are active. */
  SKIP_INSTALL?: BoolString;

  /** Activating this setting will cause Xcode to run the `Clang` static analysis tool on qualifying source files during every build. */
  RUN_CLANG_STATIC_ANALYZER?: BoolString;

  /** Also build documentation as part of the 'Build' action. */
  RUN_DOCUMENTATION_COMPILER?: BoolString;

  /** Activating this setting will cause all source files to be scanned for includes when computing the dependency graph. */
  SCAN_ALL_SOURCE_FILES_FOR_INCLUDES?: BoolString;

  /** If enabled, perform validation checks on the product as part of the build process. */
  VALIDATE_PRODUCT?: BoolString;

  /** Specifies whether the target's Copy Files build phases generate additional information when copying files. */
  VERBOSE_PBXCP?: BoolString;

  // ============================================================================
  // Stripping
  // ============================================================================

  /** Additional flags to be passed when stripping the linked product of the build. */
  STRIPFLAGS?: string;

  /** If enabled, the linked product of the build will be stripped of symbols when performing deployment postprocessing. */
  STRIP_INSTALLED_PRODUCT?: BoolString;

  /** Metadata in the form of text chunks in PNG files will be removed to reduce their footprint on disk. */
  STRIP_PNG_TEXT?: BoolString;

  /** The level of symbol stripping to be performed on the linked product of the build. */
  STRIP_STYLE?: "all" | "non-global" | "debugging" | (string & {});

  /** Adjust the level of symbol stripping so that when the linked product is stripped, all Swift symbols will be removed. */
  STRIP_SWIFT_SYMBOLS?: BoolString;

  // ============================================================================
  // Asset Catalog
  // ============================================================================

  /** A set of additional app icon set names to include in the built product. */
  ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES?: string;

  /** Name of an app icon set for the target's default app icon. */
  ASSETCATALOG_COMPILER_APPICON_NAME?: string;

  /** The name of a watch complication to use from the asset catalog. */
  ASSETCATALOG_COMPILER_COMPLICATION_NAME?: string;

  /** Generate asset symbols for each color and image in the catalog. */
  ASSETCATALOG_COMPILER_GENERATE_ASSET_SYMBOLS?: BoolString;

  /** Generate asset symbol support for the specified UI frameworks. */
  ASSETCATALOG_COMPILER_GENERATE_ASSET_SYMBOL_FRAMEWORKS?: string;

  /** Generate asset symbol extensions on Apple framework color and image types. */
  ASSETCATALOG_COMPILER_GENERATE_SWIFT_ASSET_SYMBOL_EXTENSIONS?: BoolString;

  /** The name of a color resource to use as the target's accent color. */
  ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME?: string;

  /** When true, all app icon assets from the target's Asset Catalogs will be included in the built product. */
  ASSETCATALOG_COMPILER_INCLUDE_ALL_APPICON_ASSETS?: BoolString;

  /** When enabled, includes the localization information of the selected assets in the generated partial Info.plist file. */
  ASSETCATALOG_COMPILER_INCLUDE_INFOPLIST_LOCALIZATIONS?: BoolString;

  /** Name of an asset catalog launch image set whose contents will be merged into the `Info.plist`. */
  ASSETCATALOG_COMPILER_LAUNCHIMAGE_NAME?: string;

  /** Leaderboards in the asset catalog may optionally specify a Game Center identifier. */
  ASSETCATALOG_COMPILER_LEADERBOARD_IDENTIFIER_PREFIX?: string;

  /** Leaderboard sets in the asset catalog may optionally specify a Game Center identifier. */
  ASSETCATALOG_COMPILER_LEADERBOARD_SET_IDENTIFIER_PREFIX?: string;

  /** With no value, the compiler uses the default optimization. */
  ASSETCATALOG_COMPILER_OPTIMIZATION?: "" | "time" | "space" | (string & {});

  /** Whether to perform App Store-specific behaviors such as validations. */
  ASSETCATALOG_COMPILER_SKIP_APP_STORE_DEPLOYMENT?: BoolString;

  /** Controls whether loose PNG or ICNS files are created for the primary app icon. */
  ASSETCATALOG_COMPILER_STANDALONE_ICON_BEHAVIOR?: "default" | "all" | "none" | (string & {});

  /** Sticker Packs in the asset catalog may optionally specify an identifier. */
  ASSETCATALOG_COMPILER_STICKER_PACK_IDENTIFIER_PREFIX?: string;

  /** The name of a color resource to use as the background color for a widget. */
  ASSETCATALOG_COMPILER_WIDGET_BACKGROUND_COLOR_NAME?: string;

  /** Show notices encountered during the compilation of asset catalogs. */
  ASSETCATALOG_NOTICES?: BoolString;

  /** Pass additional flags through to the asset catalog compiler. */
  ASSETCATALOG_OTHER_FLAGS?: string;

  /** Show warnings encountered during the compilation of asset catalogs. */
  ASSETCATALOG_WARNINGS?: BoolString;

  /** If set to anything other than the empty string, every URL in the `AssetPackManifest.plist` file will consist of this string with the name of the asset pack appended. */
  ASSET_PACK_MANIFEST_URL_PREFIX?: string;

  // ============================================================================
  // Metal
  // ============================================================================

  /** Space-separated list of metal linker flags */
  MTLLINKER_FLAGS?: string;

  /** Space-separated list of compiler flags */
  MTL_COMPILER_FLAGS?: string;

  /** Debugging information is required for shader debugging and profiling. */
  MTL_ENABLE_DEBUG_INFO?: BoolString | "INCLUDE_SOURCE";

  /** Control whether the compiler should emit index data while building. */
  MTL_ENABLE_INDEX_STORE?: BoolString;

  /** Enable the use of modules. */
  MTL_ENABLE_MODULES?: "all" | "stdlib" | "none" | (string & {});

  /** Enable optimizations for floating-point arithmetic that may violate the IEEE 754 standard. */
  MTL_FAST_MATH?: BoolString;

  /** This is a list of paths to folders to be searched by the compiler for included or imported header files when compiling Metal. */
  MTL_HEADER_SEARCH_PATHS?: string | string[];

  /** Enabling this option causes all warnings to be ignored. */
  MTL_IGNORE_WARNINGS?: BoolString;

  /** Determine the language revision to use. */
  MTL_LANGUAGE_REVISION?: string;

  /** Controls default math functions for single precision floating-point */
  MTL_MATH_FP32_FUNCTIONS?: string;

  /** Controls floating-point optimizations */
  MTL_MATH_MODE?: string;

  /** Optimization level for the Metal compiler. */
  MTL_OPTIMIZATION_LEVEL?: "default" | "s" | (string & {});

  /** Space-separated list of preprocessor macros of the form "foo" or "foo=bar". */
  MTL_PREPROCESSOR_DEFINITIONS?: string | string[];

  /** Enabling this option causes all warnings to be treated as errors. */
  MTL_TREAT_WARNINGS_AS_ERRORS?: BoolString;

  // ============================================================================
  // Other Compiler Flags
  // ============================================================================

  /** Space-separated list of additional flags to pass to the compiler for C and Objective-C files. */
  OTHER_CFLAGS?: string | string[];

  /** A list of additional options to pass to `codesign(1)`. */
  OTHER_CODE_SIGN_FLAGS?: string | string[];

  /** Space-separated list of additional flags to pass to the compiler for C++ and Objective-C++ files. */
  OTHER_CPLUSPLUSFLAGS?: string | string[];

  /** A list of additional flags to pass to DocC */
  OTHER_DOCC_FLAGS?: string | string[];

  /** Space-separated list of additional flags to pass to the `iig` invocation of clang. */
  OTHER_IIG_CFLAGS?: string;

  /** Space-separated list of additional flags to pass to the `iig` compiler. */
  OTHER_IIG_FLAGS?: string;

  /** Space-separated list of additional flags to pass to `mig`. */
  OTHER_MIGFLAGS?: string;

  /** Additional flags to pass to the modules-verifier tool. */
  OTHER_MODULE_VERIFIER_FLAGS?: string | string[];

  /** Space-separated list of additional flags to pass to `osacompile`. */
  OTHER_OSACOMPILEFLAGS?: string;

  /** Space-separated list of additional flags to pass to the `Rez` compiler. */
  OTHER_REZFLAGS?: string;

  /** A list of additional flags to pass to the Swift compiler. */
  OTHER_SWIFT_FLAGS?: string | string[];

  /** Options defined in this setting are passed to invocations of the `Text-Based InstallAPI` tool. */
  OTHER_TAPI_FLAGS?: string | string[];

  /** Space-separated list of additional warning flags to pass to the compiler. */
  WARNING_CFLAGS?: string | string[];

  // ============================================================================
  // Localization
  // ============================================================================

  /** When enabled, localizable content in this target/project can be exported. */
  LOCALIZATION_EXPORT_SUPPORTED?: BoolString;

  /** When enabled, string tables generated in a localization export will prefer the String Catalog format. */
  LOCALIZATION_PREFERS_STRING_CATALOGS?: BoolString;

  /** The base names for NSLocalizedString-like macros or functions used to produce localized strings in source code. */
  LOCALIZED_STRING_MACRO_NAMES?: string;

  /** When enabled, literal strings in SwiftUI will be extracted during localization export. */
  LOCALIZED_STRING_SWIFTUI_SUPPORT?: BoolString;

  /** The location to write .stringsdata files to when SWIFT_EMIT_LOC_STRINGS is enabled. */
  STRINGSDATA_DIR?: string;

  /** The location to traverse and collect .stringsdata files from when exporting for localization. */
  STRINGSDATA_ROOT?: string;

  /** If enabled, renames .strings files whose basename matches that of the target's Info.plist file. */
  STRINGS_FILE_INFOPLIST_RENAME?: BoolString;

  /** Specify the output encoding to be used for Strings files. */
  STRINGS_FILE_OUTPUT_ENCODING?: string;

  /** When enabled, symbols will be generated for manually-managed strings in String Catalogs. */
  STRING_CATALOG_GENERATE_SYMBOLS?: BoolString;

  // ============================================================================
  // Testing
  // ============================================================================

  /** Path to the executable into which a bundle of tests is injected. */
  TEST_HOST?: string;

  /** When running tests that measure performance via `XCTestCase`, report missing baselines as test failures. */
  TREAT_MISSING_BASELINES_AS_TEST_FAILURES?: BoolString;

  // ============================================================================
  // Miscellaneous
  // ============================================================================

  /** When enabled, generates assets needed for App Shortcuts Flexible Matching. */
  APP_SHORTCUTS_ENABLE_FLEXIBLE_MATCHING?: BoolString;

  /** A Boolean value that indicates whether the app may prompt the user for permission to send Apple events. */
  AUTOMATION_APPLE_EVENTS?: BoolString;

  /** C++ Standard Library to use. */
  CLANG_CXX_LIBRARY?: "libc++" | "libstdc++" | (string & {});

  /** The Source-code language to use for generated CoreML model class. */
  COREML_CODEGEN_LANGUAGE?: "Automatic" | "Swift" | "Objective-C" | "None" | (string & {});

  /** Generate Swift model classes that are marked with @objc and are descendants of NSObject. */
  COREML_CODEGEN_SWIFT_GLOBAL_MODULE?: BoolString;

  /** Other flags to pass to the C preprocessor when using the standalone C Preprocessor rule. */
  CPP_OTHER_PREPROCESSOR_FLAGS?: string;

  /** Space-separated list of preprocessor macros for the standalone C Preprocessor rule. */
  CPP_PREPROCESSOR_DEFINITIONS?: string;

  /** The name of the active variant being processed. */
  CURRENT_VARIANT?: string;

  /** Build Documentation for C++/Objective-C++ */
  DOCC_ENABLE_CXX_SUPPORT?: BoolString;

  /** Include documentation for symbols defined within an extension to a type that is not defined in the current module. */
  DOCC_EXTRACT_EXTENSION_SYMBOLS?: BoolString;

  /** Extract Objective-C symbol information for targets that contain only Swift code. */
  DOCC_EXTRACT_OBJC_INFO_FOR_SWIFT_SYMBOLS?: BoolString;

  /** Extract Swift symbol information for targets that contain only Objective-C code. */
  DOCC_EXTRACT_SWIFT_INFO_FOR_OBJC_SYMBOLS?: BoolString;

  /** The base path your documentation website will be hosted at. */
  DOCC_HOSTING_BASE_PATH?: string;

  /** Space-separated list of additional flags to pass to the `dtrace` compiler. */
  DTRACE_OTHER_FLAGS?: string;

  /** A list of patterns specifying the names of explicit target dependencies to exclude. */
  EXCLUDED_EXPLICIT_TARGET_DEPENDENCIES?: string[];

  /** This is a list of `fnmatch()`-style patterns of file or directory names to exclude when performing a recursive search. */
  EXCLUDED_RECURSIVE_SEARCH_PATH_SUBDIRECTORIES?: string[];

  /** A list of patterns specifying the names of source files to explicitly exclude. */
  EXCLUDED_SOURCE_FILE_NAMES?: string[];

  /** A list of patterns specifying the names of explicit target dependencies to include. */
  INCLUDED_EXPLICIT_TARGET_DEPENDENCIES?: string[];

  /** This is a list of `fnmatch()`-style patterns of file or directory names to include when performing a recursive search. */
  INCLUDED_RECURSIVE_SEARCH_PATH_SUBDIRECTORIES?: string[];

  /** A list of patterns specifying the names of source files to explicitly include. */
  INCLUDED_SOURCE_FILE_NAMES?: string[];

  /** The domain in which the target will match or be matched for implicit dependencies. */
  IMPLICIT_DEPENDENCY_DOMAIN?: string;

  /** The group name or `gid` for installed products. */
  INSTALL_GROUP?: string;

  /** Permissions used for installed product files. */
  INSTALL_MODE_FLAG?: string;

  /** The owner name or `uid` for installed products. */
  INSTALL_OWNER?: string;

  /** The Source-code language to use for generated Intent class. */
  INTENTS_CODEGEN_LANGUAGE?: "Automatic" | "Swift" | "Objective-C" | (string & {});

  /** Build Mergeable Library */
  MERGEABLE_LIBRARY?: BoolString;

  /** Create Merged Binary */
  MERGED_BINARY_TYPE?: "none" | "automatic" | "manual" | (string & {});

  /** This is the project-relative path to the LLVM module map file that defines the module structure for the compiler. */
  MODULEMAP_FILE?: string;

  /** This is the project-relative path to the LLVM module map file that defines the module structure for private headers. */
  MODULEMAP_PRIVATE_FILE?: string;

  /** This is the identifier of the kernel module listed in the generated stub. */
  MODULE_NAME?: string;

  /** This defines the name of the kernel module start routine. */
  MODULE_START?: string;

  /** This defines the name of the kernel module stop routine. */
  MODULE_STOP?: string;

  /** Languages to verify the module. */
  MODULE_VERIFIER_SUPPORTED_LANGUAGES?: string[];

  /** Language dialects to verify the module. */
  MODULE_VERIFIER_SUPPORTED_LANGUAGE_STANDARDS?: string[];

  /** This is the version of the kernel module listed in the generated stub. */
  MODULE_VERSION?: string;

  /** The name of the current project. */
  PROJECT_NAME?: string;

  /** Identifies the directory in which the project's intermediate build files are placed. */
  PROJECT_TEMP_DIR?: string;

  /** Specifies whether to keep copies of unstripped binaries available. */
  RETAIN_RAW_BINARIES?: BoolString;

  /** Enables private framework inlining for Text-Based Stubs. */
  INLINE_PRIVATE_FRAMEWORKS?: BoolString;

  /** Specifies whether the target's Copy Files build phases are executed in `installhdr` builds. */
  INSTALLHDRS_COPY_PHASE?: BoolString;

  /** Specifies whether the target's Run Script build phases are executed in `installhdr` builds. */
  INSTALLHDRS_SCRIPT_PHASE?: BoolString;

  /** Enable the use of Header Maps. */
  USE_HEADERMAP?: BoolString;

  /** This is a list of paths to folders to be searched by the compiler for included or imported user header files. */
  USER_HEADER_SEARCH_PATHS?: string | string[];

  /** This is a list of paths to folders containing system frameworks to be searched by the compiler. */
  SYSTEM_FRAMEWORK_SEARCH_PATHS?: string | string[];

  /** This is a list of paths to folders to be searched by the compiler for included or imported system header files. */
  SYSTEM_HEADER_SEARCH_PATHS?: string | string[];

  /** The name of the current target. */
  TARGET_NAME?: string;

  /** Enabling this option causes warnings about incremental build performance issues to be treated as errors. */
  TREAT_MISSING_SCRIPT_PHASE_OUTPUTS_AS_ERRORS?: BoolString;

  /** The extension used for product wrappers. */
  WRAPPER_EXTENSION?: string;

  /** Specifies the filename, including the appropriate extension, of the product bundle. */
  WRAPPER_NAME?: string;

  /** Specifies the suffix of the product bundle name. */
  WRAPPER_SUFFIX?: string;

  /** Defined a set of initial On Demand Resources tags to be downloaded and installed with your application. */
  ON_DEMAND_RESOURCES_INITIAL_INSTALL_TAGS?: string[];

  /** Once your app is installed, this defined a set of On Demand Resources tags that should be downloaded. */
  ON_DEMAND_RESOURCES_PREFETCH_ORDER?: string[];

  // ============================================================================
  // Legacy / Deprecated
  // ============================================================================

  ENABLE_BITCODE?: BoolString;
  PREBINDING?: BoolString;

  // ============================================================================
  // Catch-all for any additional settings
  // ============================================================================

  [key: string]: any;
}
