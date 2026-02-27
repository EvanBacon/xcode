import { readFileSync } from "fs";
import path from "path";

import { parse, build, parseManagement, buildManagement } from "../index";
import type { XCScheme } from "../types";

const fixturesDir = path.join(__dirname, "fixtures");

function readFixture(name: string): string {
  return readFileSync(path.join(fixturesDir, name), "utf-8");
}

describe("scheme parser", () => {
  describe("parse", () => {
    it("parses MinimalInformation.xcscheme", () => {
      const xml = readFixture("MinimalInformation.xcscheme");
      const scheme = parse(xml);

      expect(scheme.version).toBe("1.3");
      expect(scheme.lastUpgradeVersion).toBeUndefined();

      // Build action
      expect(scheme.buildAction).toBeDefined();
      expect(scheme.buildAction!.entries).toHaveLength(1);
      expect(scheme.buildAction!.entries![0].buildForRunning).toBe(false);
      expect(scheme.buildAction!.entries![0].buildForTesting).toBe(true);
      expect(
        scheme.buildAction!.entries![0].buildableReference?.blueprintIdentifier
      ).toBe("651BA89E1E459798004EAFE5");
      expect(
        scheme.buildAction!.entries![0].buildableReference?.buildableName
      ).toBe("ais.xctest");

      // Test action
      expect(scheme.testAction).toBeDefined();
      expect(scheme.testAction!.buildConfiguration).toBe("Debug");
      expect(scheme.testAction!.testables).toHaveLength(1);
      expect(
        scheme.testAction!.testables![0].buildableReference?.buildableName
      ).toBe("ais.xctest");

      // Launch action with environment variables
      expect(scheme.launchAction).toBeDefined();
      expect(scheme.launchAction!.useCustomWorkingDirectory).toBe(false);
      expect(scheme.launchAction!.environmentVariables).toHaveLength(1);
      expect(scheme.launchAction!.environmentVariables![0].key).toBe(
        "AI_TEST_MODE"
      );
      expect(scheme.launchAction!.environmentVariables![0].value).toBe(
        "integration"
      );
      expect(scheme.launchAction!.environmentVariables![0].isEnabled).toBe(
        true
      );
    });

    it("parses iOS.xcscheme with full structure", () => {
      const xml = readFixture("iOS.xcscheme");
      const scheme = parse(xml);

      expect(scheme.version).toBe("2.0");
      expect(scheme.lastUpgradeVersion).toBe("0830");

      // Build action with pre/post actions
      expect(scheme.buildAction!.parallelizeBuildables).toBe(true);
      expect(scheme.buildAction!.buildImplicitDependencies).toBe(true);
      expect(scheme.buildAction!.preActions).toHaveLength(1);
      expect(scheme.buildAction!.preActions![0].actionContent?.title).toBe(
        "Build Pre-action"
      );
      expect(scheme.buildAction!.preActions![0].actionContent?.scriptText).toBe(
        "echo prebuild"
      );
      expect(scheme.buildAction!.postActions).toHaveLength(1);
      expect(
        scheme.buildAction!.postActions![0].actionContent?.shellToInvoke
      ).toBe("/bin/sh");

      // Build action entry
      expect(scheme.buildAction!.entries).toHaveLength(1);
      const entry = scheme.buildAction!.entries![0];
      expect(entry.buildForTesting).toBe(true);
      expect(entry.buildForRunning).toBe(true);
      expect(entry.buildForProfiling).toBe(true);
      expect(entry.buildForArchiving).toBe(true);
      expect(entry.buildForAnalyzing).toBe(true);
      expect(entry.buildableReference?.blueprintName).toBe("iOS");
      expect(entry.buildableReference?.referencedContainer).toBe(
        "container:Project.xcodeproj"
      );

      // Test action
      expect(scheme.testAction!.codeCoverageEnabled).toBe(true);
      expect(scheme.testAction!.onlyGenerateCoverageForSpecifiedTargets).toBe(
        true
      );
      expect(scheme.testAction!.preferredScreenCaptureFormat).toBe(
        "screenshots"
      );
      expect(scheme.testAction!.testPlans).toHaveLength(1);
      expect(scheme.testAction!.testPlans![0].reference).toBe(
        "container:iOS.xctestplan"
      );
      expect(scheme.testAction!.testPlans![0].default).toBe(true);
      expect(scheme.testAction!.preActions).toHaveLength(2);
      expect(scheme.testAction!.postActions).toHaveLength(2);
      expect(scheme.testAction!.commandLineArguments).toHaveLength(1);
      expect(scheme.testAction!.commandLineArguments![0].argument).toBe(
        "MyTestArgument"
      );
      expect(scheme.testAction!.macroExpansion?.blueprintName).toBe("iOS");

      // Launch action
      expect(scheme.launchAction!.launchStyle).toBe("2");
      expect(scheme.launchAction!.debugServiceExtension).toBe("internal");
      expect(scheme.launchAction!.customLaunchCommand).toBe("custom command");
      expect(scheme.launchAction!.buildableProductRunnable).toBeDefined();
      expect(
        scheme.launchAction!.buildableProductRunnable?.runnableDebuggingMode
      ).toBe("0");
      expect(scheme.launchAction!.locationScenarioReference).toBeDefined();
      expect(
        scheme.launchAction!.locationScenarioReference?.identifier
      ).toBe(
        "com.apple.dt.IDEFoundation.CurrentLocationScenarioIdentifier"
      );
      expect(
        scheme.launchAction!.storeKitConfigurationFileReference?.identifier
      ).toBe("../../Configuration.storekit");

      // Profile action
      expect(scheme.profileAction!.buildConfiguration).toBe("Release");
      expect(scheme.profileAction!.postActions).toHaveLength(1);

      // Analyze action
      expect(scheme.analyzeAction!.buildConfiguration).toBe("Debug");

      // Archive action
      expect(scheme.archiveAction!.buildConfiguration).toBe("Release");
      expect(scheme.archiveAction!.customArchiveName).toBe("TestName");
      expect(scheme.archiveAction!.revealArchiveInOrganizer).toBe(true);
    });

    it("parses AppClip.xcscheme with app clip features", () => {
      const xml = readFixture("AppClip.xcscheme");
      const scheme = parse(xml);

      expect(scheme.lastUpgradeVersion).toBe("1600");
      expect(scheme.version).toBe("1.7");

      expect(scheme.buildAction!.buildArchitectures).toBe("Automatic");

      expect(scheme.launchAction!.appClipInvocationURLString).toBe(
        "https://example.com/"
      );
      expect(scheme.profileAction!.appClipInvocationURLString).toBe(
        "https://example.com/"
      );
      expect(scheme.testAction!.shouldAutocreateTestPlan).toBe(true);
    });

    it("parses RunPostActionsOnFailure.xcscheme", () => {
      const xml = readFixture("RunPostActionsOnFailure.xcscheme");
      const scheme = parse(xml);

      expect(scheme.buildAction!.runPostActionsOnFailure).toBe(true);
    });

    it("parses RunnableWithoutBuildableReference.xcscheme with RemoteRunnable", () => {
      const xml = readFixture("RunnableWithoutBuildableReference.xcscheme");
      const scheme = parse(xml);

      expect(scheme.launchAction!.remoteRunnable).toBeDefined();
      expect(scheme.launchAction!.remoteRunnable?.runnableDebuggingMode).toBe(
        "1"
      );
      expect(scheme.launchAction!.remoteRunnable?.bundleIdentifier).toBe(
        "me.ava.Ava-Staging"
      );
      expect(scheme.launchAction!.remoteRunnable?.remotePath).toBe(
        "/var/containers/Bundle/Application/018F0933-05E8-4359-9955-39E0523C4246/Ava.app"
      );

      expect(scheme.launchAction!.askForAppToLaunch).toBe(true);
      expect(scheme.launchAction!.launchAutomaticallySubstyle).toBe("2");
      expect(scheme.launchAction!.customWorkingDirectory).toBe(
        "/customWorkingDirectory"
      );

      expect(scheme.profileAction!.askForAppToLaunch).toBe(true);
      expect(scheme.profileAction!.launchAutomaticallySubstyle).toBe("2");
    });

    it("parses NoBlueprintID.xcscheme without blueprintIdentifier", () => {
      const xml = readFixture("NoBlueprintID.xcscheme");
      const scheme = parse(xml);

      expect(scheme).toBeDefined();
      // Scheme with missing blueprint identifier should still parse
      const entry = scheme.buildAction?.entries?.[0];
      expect(entry?.buildableReference).toBeDefined();
      // blueprintIdentifier should be empty string when missing
      expect(entry?.buildableReference?.blueprintIdentifier).toBe("");
    });

    it("parses BuildArchitectures.xcscheme with buildArchitectures", () => {
      const xml = readFixture("BuildArchitectures.xcscheme");
      const scheme = parse(xml);

      expect(scheme.buildAction?.buildArchitectures).toBe("Automatic");
    });

    it("parses WatchApp.xcscheme with watch extension RemoteRunnable", () => {
      const xml = readFixture("WatchApp.xcscheme");
      const scheme = parse(xml);

      expect(scheme.launchAction?.remoteRunnable).toBeDefined();
      expect(scheme.launchAction?.remoteRunnable?.bundleIdentifier).toBe(
        "com.apple.Carousel"
      );
      expect(scheme.launchAction?.remoteRunnable?.runnableDebuggingMode).toBe(
        "2"
      );
      expect(scheme.launchAction?.remoteRunnable?.remotePath).toBe(
        "/AppWithExtensions"
      );
    });

    it("parses multiple build action entries", () => {
      const xml = readFixture("RunnableWithoutBuildableReference.xcscheme");
      const scheme = parse(xml);

      expect(scheme.buildAction?.entries).toHaveLength(2);

      // First entry - app target
      expect(scheme.buildAction?.entries?.[0].buildForRunning).toBe(true);
      expect(scheme.buildAction?.entries?.[0].buildForTesting).toBe(true);
      expect(scheme.buildAction?.entries?.[0].buildableReference?.buildableName).toBe(
        "Ava.app"
      );

      // Second entry - test target
      expect(scheme.buildAction?.entries?.[1].buildForRunning).toBe(false);
      expect(scheme.buildAction?.entries?.[1].buildForTesting).toBe(true);
      expect(scheme.buildAction?.entries?.[1].buildableReference?.buildableName).toBe(
        "AvaTests.xctest"
      );
    });

    it("parses macroExpansion in launchAction", () => {
      const xml = readFixture("RunnableWithoutBuildableReference.xcscheme");
      const scheme = parse(xml);

      expect(scheme.launchAction?.macroExpansion).toBeDefined();
      expect(scheme.launchAction?.macroExpansion?.blueprintIdentifier).toBe(
        "FE7C11D21B6DB70D0041DF02"
      );
      expect(scheme.launchAction?.macroExpansion?.buildableName).toBe("Ava.app");
    });

    it("parses environmentBuildable in pre/post actions", () => {
      const xml = readFixture("iOS.xcscheme");
      const scheme = parse(xml);

      // LaunchAction pre-action has environmentBuildable
      const preAction = scheme.launchAction?.preActions?.[0];
      expect(preAction?.actionContent?.environmentBuildable).toBeDefined();
      expect(
        preAction?.actionContent?.environmentBuildable?.blueprintIdentifier
      ).toBe("23766C111EAA3484007A9026");
      expect(preAction?.actionContent?.environmentBuildable?.buildableName).toBe(
        "iOS.app"
      );

      // LaunchAction post-action has environmentBuildable
      const postAction = scheme.launchAction?.postActions?.[0];
      expect(postAction?.actionContent?.environmentBuildable).toBeDefined();
      expect(
        postAction?.actionContent?.environmentBuildable?.blueprintIdentifier
      ).toBe("23766C251EAA3484007A9026");
    });
  });

  describe("parsing stability", () => {
    it("produces identical results on multiple parses", () => {
      const xml = readFixture("iOS.xcscheme");
      const parses = Array.from({ length: 5 }, () => parse(xml));

      // All parses should be identical
      for (let i = 1; i < parses.length; i++) {
        expect(parses[i]).toEqual(parses[0]);
      }
    });
  });

  describe("build", () => {
    it("builds a basic scheme", () => {
      const scheme: XCScheme = {
        version: "1.3",
        buildAction: {
          entries: [
            {
              buildForRunning: true,
              buildForTesting: true,
              buildableReference: {
                buildableIdentifier: "primary",
                blueprintIdentifier: "ABC123",
                buildableName: "App.app",
                blueprintName: "App",
                referencedContainer: "container:App.xcodeproj",
              },
            },
          ],
        },
        testAction: {
          buildConfiguration: "Debug",
        },
        launchAction: {
          buildConfiguration: "Debug",
        },
        profileAction: {
          buildConfiguration: "Release",
        },
        analyzeAction: {
          buildConfiguration: "Debug",
        },
        archiveAction: {
          buildConfiguration: "Release",
          revealArchiveInOrganizer: true,
        },
      };

      const xml = build(scheme);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain("<Scheme");
      expect(xml).toContain('version = "1.3"');
      expect(xml).toContain("<BuildAction>");
      expect(xml).toContain("<BuildActionEntries>");
      expect(xml).toContain('BlueprintIdentifier = "ABC123"');
      expect(xml).toContain('BuildableName = "App.app"');
      expect(xml).toContain('buildConfiguration = "Debug"');
      expect(xml).toContain('revealArchiveInOrganizer = "YES"');
    });

    it("builds scheme with environment variables", () => {
      const scheme: XCScheme = {
        version: "1.3",
        launchAction: {
          environmentVariables: [
            { key: "API_URL", value: "https://api.example.com", isEnabled: true },
            { key: "DEBUG", value: "1", isEnabled: false },
          ],
        },
      };

      const xml = build(scheme);

      expect(xml).toContain("<EnvironmentVariables>");
      expect(xml).toContain('key = "API_URL"');
      expect(xml).toContain('value = "https://api.example.com"');
      expect(xml).toContain('isEnabled = "YES"');
      expect(xml).toContain('key = "DEBUG"');
      expect(xml).toContain('isEnabled = "NO"');
    });

    it("builds scheme with pre/post actions", () => {
      const scheme: XCScheme = {
        version: "2.0",
        buildAction: {
          preActions: [
            {
              actionType:
                "Xcode.IDEStandardExecutionActionsCore.ExecutionActionType.ShellScriptAction",
              actionContent: {
                title: "Pre-build",
                scriptText: "echo prebuild",
              },
            },
          ],
          postActions: [
            {
              actionType:
                "Xcode.IDEStandardExecutionActionsCore.ExecutionActionType.ShellScriptAction",
              actionContent: {
                title: "Post-build",
                scriptText: "echo postbuild",
                shellToInvoke: "/bin/zsh",
              },
            },
          ],
        },
      };

      const xml = build(scheme);

      expect(xml).toContain("<PreActions>");
      expect(xml).toContain('title = "Pre-build"');
      expect(xml).toContain('scriptText = "echo prebuild"');
      expect(xml).toContain("<PostActions>");
      expect(xml).toContain('title = "Post-build"');
      expect(xml).toContain('shellToInvoke = "/bin/zsh"');
    });

    it("escapes XML special characters", () => {
      const scheme: XCScheme = {
        version: "1.3",
        buildAction: {
          entries: [
            {
              buildableReference: {
                buildableIdentifier: "primary",
                blueprintIdentifier: "ABC123",
                buildableName: "Test & Demo.app",
                blueprintName: "Test <Demo>",
                referencedContainer: 'container:"Test".xcodeproj',
              },
            },
          ],
        },
      };

      const xml = build(scheme);

      expect(xml).toContain('BuildableName = "Test &amp; Demo.app"');
      expect(xml).toContain('BlueprintName = "Test &lt;Demo&gt;"');
      expect(xml).toContain(
        'ReferencedContainer = "container:&quot;Test&quot;.xcodeproj"'
      );
    });
  });

  describe("round-trip", () => {
    const fixtures = [
      "MinimalInformation.xcscheme",
      "AppClip.xcscheme",
      "RunPostActionsOnFailure.xcscheme",
      "RunnableWithoutBuildableReference.xcscheme",
      "BuildArchitectures.xcscheme",
    ];

    for (const fixture of fixtures) {
      it(`round-trips ${fixture}`, () => {
        const xml = readFixture(fixture);
        const scheme = parse(xml);
        const rebuilt = build(scheme);
        const reparsed = parse(rebuilt);

        // Deep equality check on the parsed structures
        expect(reparsed).toEqual(scheme);
      });
    }
  });

  describe("build additional scenarios", () => {
    it("builds scheme with RemoteRunnable", () => {
      const scheme: XCScheme = {
        version: "2.0",
        launchAction: {
          buildConfiguration: "Debug",
          remoteRunnable: {
            runnableDebuggingMode: "1",
            bundleIdentifier: "com.example.app",
            remotePath: "/var/containers/Bundle/Application/App.app",
            buildableReference: {
              buildableIdentifier: "primary",
              blueprintIdentifier: "ABC123",
              buildableName: "App.app",
              blueprintName: "App",
              referencedContainer: "container:App.xcodeproj",
            },
          },
        },
      };

      const xml = build(scheme);

      expect(xml).toContain("<RemoteRunnable");
      expect(xml).toContain('runnableDebuggingMode = "1"');
      expect(xml).toContain('BundleIdentifier = "com.example.app"');
      expect(xml).toContain('RemotePath = "/var/containers/Bundle/Application/App.app"');
    });

    it("builds scheme with testables", () => {
      const scheme: XCScheme = {
        version: "1.7",
        testAction: {
          buildConfiguration: "Debug",
          testables: [
            {
              skipped: false,
              buildableReference: {
                buildableIdentifier: "primary",
                blueprintIdentifier: "TEST123",
                buildableName: "AppTests.xctest",
                blueprintName: "AppTests",
                referencedContainer: "container:App.xcodeproj",
              },
            },
          ],
        },
      };

      const xml = build(scheme);

      expect(xml).toContain("<Testables>");
      expect(xml).toContain("<TestableReference");
      expect(xml).toContain('skipped = "NO"');
      expect(xml).toContain('BuildableName = "AppTests.xctest"');
    });

    it("builds scheme with command line arguments", () => {
      const scheme: XCScheme = {
        version: "1.7",
        launchAction: {
          buildConfiguration: "Debug",
          commandLineArguments: [
            { argument: "-verbose", isEnabled: true },
            { argument: "-debug", isEnabled: false },
          ],
        },
      };

      const xml = build(scheme);

      expect(xml).toContain("<CommandLineArguments>");
      expect(xml).toContain('argument = "-verbose"');
      expect(xml).toContain('isEnabled = "YES"');
      expect(xml).toContain('argument = "-debug"');
      expect(xml).toContain('isEnabled = "NO"');
    });

    it("builds scheme with macroExpansion", () => {
      const scheme: XCScheme = {
        version: "2.0",
        launchAction: {
          buildConfiguration: "Debug",
          macroExpansion: {
            buildableIdentifier: "primary",
            blueprintIdentifier: "ABC123",
            buildableName: "App.app",
            blueprintName: "App",
            referencedContainer: "container:App.xcodeproj",
          },
        },
      };

      const xml = build(scheme);

      expect(xml).toContain("<MacroExpansion>");
      expect(xml).toContain("<BuildableReference");
      expect(xml).toContain('BlueprintIdentifier = "ABC123"');
      expect(xml).toContain("</MacroExpansion>");
    });

    it("builds scheme with test plans", () => {
      const scheme: XCScheme = {
        version: "2.0",
        testAction: {
          buildConfiguration: "Debug",
          testPlans: [
            { reference: "container:MyTests.xctestplan", default: true },
            { reference: "container:Integration.xctestplan", default: false },
          ],
        },
      };

      const xml = build(scheme);

      expect(xml).toContain("<TestPlans>");
      expect(xml).toContain("<TestPlanReference");
      expect(xml).toContain('reference = "container:MyTests.xctestplan"');
      expect(xml).toContain('default = "YES"');
      expect(xml).toContain('default = "NO"');
    });

    it("builds scheme with location scenario reference", () => {
      const scheme: XCScheme = {
        version: "2.0",
        launchAction: {
          buildConfiguration: "Debug",
          locationScenarioReference: {
            identifier: "com.apple.dt.IDEFoundation.CurrentLocationScenarioIdentifier",
            referenceType: "1",
          },
        },
      };

      const xml = build(scheme);

      expect(xml).toContain("<LocationScenarioReference");
      expect(xml).toContain(
        'identifier = "com.apple.dt.IDEFoundation.CurrentLocationScenarioIdentifier"'
      );
      expect(xml).toContain('referenceType = "1"');
    });

    it("builds scheme with StoreKit configuration reference", () => {
      const scheme: XCScheme = {
        version: "2.0",
        launchAction: {
          buildConfiguration: "Debug",
          storeKitConfigurationFileReference: {
            identifier: "../../Configuration.storekit",
          },
        },
      };

      const xml = build(scheme);

      expect(xml).toContain("<StoreKitConfigurationFileReference");
      expect(xml).toContain('identifier = "../../Configuration.storekit"');
    });
  });
});

describe("scheme management", () => {
  describe("parseManagement", () => {
    it("parses xcschememanagement.plist", () => {
      const plistStr = readFixture("xcschememanagement.plist");
      const management = parseManagement(plistStr);

      expect(management.SchemeUserState).toBeDefined();
      expect(management.SchemeUserState!["App.xcscheme"]).toEqual({
        isShown: false,
        orderHint: 0,
      });
      expect(management.SchemeUserState!["Test 0.xcscheme"]).toEqual({
        orderHint: 3,
      });
      expect(
        management.SchemeUserState!["Tuist.xcscheme_^#shared#^_"]
      ).toEqual({
        isShown: true,
        orderHint: 1,
      });

      expect(management.SuppressBuildableAutocreation).toBeDefined();
      expect(
        management.SuppressBuildableAutocreation!["E525238B16245A900012E2BA"]
      ).toEqual({
        primary: true,
      });
    });
  });

  describe("buildManagement", () => {
    it("builds xcschememanagement.plist", () => {
      const management = {
        SchemeUserState: {
          "App.xcscheme": { isShown: false, orderHint: 0 },
          "Test.xcscheme": { orderHint: 1 },
        },
        SuppressBuildableAutocreation: {
          ABC123: { primary: true },
        },
      };

      const plistStr = buildManagement(management);

      expect(plistStr).toContain("<plist");
      expect(plistStr).toContain("<key>SchemeUserState</key>");
      expect(plistStr).toContain("<key>App.xcscheme</key>");
      expect(plistStr).toContain("<key>isShown</key>");
      expect(plistStr).toContain("<false/>");
      expect(plistStr).toContain("<key>orderHint</key>");
      expect(plistStr).toContain("<integer>0</integer>");
      expect(plistStr).toContain("<key>SuppressBuildableAutocreation</key>");
      expect(plistStr).toContain("<key>ABC123</key>");
      expect(plistStr).toContain("<key>primary</key>");
      expect(plistStr).toContain("<true/>");
    });
  });

  describe("round-trip", () => {
    it("round-trips xcschememanagement.plist", () => {
      const plistStr = readFixture("xcschememanagement.plist");
      const management = parseManagement(plistStr);
      const rebuilt = buildManagement(management);
      const reparsed = parseManagement(rebuilt);

      expect(reparsed).toEqual(management);
    });
  });
});
