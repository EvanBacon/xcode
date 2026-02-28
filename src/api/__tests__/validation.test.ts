import { XcodeProject, validateProject, PBXCopyFilesBuildPhase } from "..";
import * as path from "path";

const WATCH_FIXTURE = path.join(
  __dirname,
  "../../json/__tests__/fixtures/watch.pbxproj"
);

describe("validateProject", () => {
  describe("Watch app embedding", () => {
    it("should pass validation for correctly configured watch app", () => {
      const project = XcodeProject.open(WATCH_FIXTURE);
      const issues = validateProject(project);

      // The watch fixture should be correctly configured
      const watchIssues = issues.filter((i) => i.code.startsWith("WATCH_"));
      expect(watchIssues).toHaveLength(0);
    });

    it("should detect missing Embed Watch Content phase", () => {
      const project = XcodeProject.open(WATCH_FIXTURE);

      // Remove the embed watch content phase from main target
      const mainTarget = project.rootObject.getMainAppTarget("ios")!;
      const embedPhase = mainTarget.props.buildPhases.find(
        (phase) =>
          PBXCopyFilesBuildPhase.is(phase) &&
          phase.props.name === "Embed Watch Content"
      );

      if (embedPhase) {
        const idx = mainTarget.props.buildPhases.indexOf(embedPhase);
        mainTarget.props.buildPhases.splice(idx, 1);
      }

      const issues = validateProject(project);
      const watchIssues = issues.filter((i) => i.code === "WATCH_EMBED_MISSING");
      expect(watchIssues.length).toBeGreaterThan(0);
      expect(watchIssues[0].message).toContain("not embedded");
    });

    it("should detect wrong dstPath", () => {
      const project = XcodeProject.open(WATCH_FIXTURE);

      // Modify the embed phase to have wrong dstPath
      const mainTarget = project.rootObject.getMainAppTarget("ios")!;
      const embedPhase = mainTarget.props.buildPhases.find(
        (phase) =>
          PBXCopyFilesBuildPhase.is(phase) &&
          phase.props.name === "Embed Watch Content"
      ) as PBXCopyFilesBuildPhase;

      if (embedPhase) {
        // This simulates the misconfiguration
        embedPhase.props.dstPath = "";
      }

      const issues = validateProject(project);
      const watchIssues = issues.filter(
        (i) => i.code === "WATCH_EMBED_WRONG_PATH"
      );
      expect(watchIssues.length).toBeGreaterThan(0);
      expect(watchIssues[0].message).toContain(
        "should be under Watch"
      );
    });

    it("should detect wrong dstSubfolderSpec", () => {
      const project = XcodeProject.open(WATCH_FIXTURE);

      const mainTarget = project.rootObject.getMainAppTarget("ios")!;
      const embedPhase = mainTarget.props.buildPhases.find(
        (phase) =>
          PBXCopyFilesBuildPhase.is(phase) &&
          phase.props.name === "Embed Watch Content"
      ) as PBXCopyFilesBuildPhase;

      if (embedPhase) {
        // Set wrong subfolder spec (13 = PlugIns, should be 16 = Products Directory)
        embedPhase.props.dstSubfolderSpec = 13;
      }

      const issues = validateProject(project);
      const watchIssues = issues.filter(
        (i) => i.code === "WATCH_EMBED_WRONG_SUBFOLDER"
      );
      expect(watchIssues.length).toBeGreaterThan(0);
      expect(watchIssues[0].message).toContain("dstSubfolderSpec");
    });
  });
});
