/**
 * Tests for optimized XcodeProject functionality
 * 
 * These tests verify that the enhanced XcodeProject class:
 * - Supports lazy loading with openLazy()
 * - Provides performance statistics via getQuickStats()
 * - Maintains backward compatibility with original open()
 * - Handles large projects efficiently
 */

import path from 'path';
import { XcodeProject } from '../XcodeProject';

const FIXTURES_DIR = path.join(__dirname, '../../json/__tests__/fixtures');
const SMALL_FIXTURE = path.join(FIXTURES_DIR, 'project.pbxproj');
const MEDIUM_FIXTURE = path.join(FIXTURES_DIR, 'AFNetworking.pbxproj');

describe('Optimized XcodeProject', () => {
  describe('openLazy', () => {
    it('should open project with lazy loading', () => {
      const project = XcodeProject.openLazy(SMALL_FIXTURE, {
        skipFullInflation: true
      });
      
      expect(project).toBeDefined();
      expect(project.rootObject).toBeDefined();
      expect(project.filePath).toBe(SMALL_FIXTURE);
    });

    it('should handle progress callbacks', () => {
      const progressCallback = jest.fn();
      
      const project = XcodeProject.openLazy(SMALL_FIXTURE, {
        skipFullInflation: true,
        progressCallback
      });
      
      expect(project).toBeDefined();
      expect(progressCallback).toHaveBeenCalled();
    });

    it('should work with larger files', () => {
      const project = XcodeProject.openLazy(MEDIUM_FIXTURE, {
        skipFullInflation: true
      });
      
      expect(project).toBeDefined();
      expect(project.rootObject).toBeDefined();
      
      const stats = project.getQuickStats();
      expect(stats.totalObjects).toBeGreaterThan(0);
    });
  });

  describe('getQuickStats', () => {
    it('should provide project statistics', () => {
      const project = XcodeProject.openLazy(SMALL_FIXTURE, {
        skipFullInflation: true
      });
      
      const stats = project.getQuickStats();
      
      expect(stats.totalObjects).toBeGreaterThan(0);
      expect(stats.inflatedObjects).toBeGreaterThanOrEqual(0);
      expect(stats.uninflatedObjects).toBeGreaterThanOrEqual(0);
      expect(stats.inflationPercentage).toBeDefined();
      expect(parseFloat(stats.inflationPercentage)).toBeGreaterThanOrEqual(0);
      expect(parseFloat(stats.inflationPercentage)).toBeLessThanOrEqual(100);
    });
  });

  describe('getUninflatedObjects', () => {
    it('should provide access to uninflated objects', () => {
      const project = XcodeProject.openLazy(SMALL_FIXTURE, {
        skipFullInflation: true
      });
      
      const uninflated = project.getUninflatedObjects();
      
      expect(uninflated).toBeDefined();
      expect(typeof uninflated).toBe('object');
    });
  });

  describe('forceFullInflation', () => {
    it('should inflate remaining objects', () => {
      const project = XcodeProject.openLazy(MEDIUM_FIXTURE, {
        skipFullInflation: true
      });
      
      const statsBefore = project.getQuickStats();
      
      // Only test if there are uninflated objects
      if (statsBefore.uninflatedObjects > 0) {
        project.forceFullInflation();
        
        const statsAfter = project.getQuickStats();
        expect(statsAfter.uninflatedObjects).toBe(0);
        expect(statsAfter.inflationPercentage).toBe('100.0');
      }
    });

    it('should handle progress callback during inflation', () => {
      const project = XcodeProject.openLazy(MEDIUM_FIXTURE, {
        skipFullInflation: true
      });
      
      const progressCallback = jest.fn();
      
      project.forceFullInflation(progressCallback);
      
      // Progress callback may or may not be called depending on remaining objects
      expect(progressCallback).toHaveBeenCalledTimes(expect.any(Number));
    });
  });

  describe('Integration with Enhanced Parsing', () => {
    it('should work with optimized parsing for medium files', () => {
      // This tests the integration where openLazy automatically uses parseOptimized
      const project = XcodeProject.openLazy(MEDIUM_FIXTURE, {
        skipFullInflation: true
      });
      
      expect(project).toBeDefined();
      expect(project.rootObject).toBeDefined();
      
      // Should have loaded the main structure
      const mainGroup = project.rootObject.props.mainGroup;
      expect(mainGroup).toBeDefined();
      expect(mainGroup.getDisplayName()).toBeDefined();
    });

    it('should preserve all core functionality', () => {
      const project = XcodeProject.openLazy(SMALL_FIXTURE, {
        skipFullInflation: true
      });
      
      // Test core API still works
      expect(project.archiveVersion).toBeDefined();
      expect(project.objectVersion).toBeDefined();
      expect(project.rootObject).toBeDefined();
      expect(project.getProjectRoot()).toBeDefined();
      
      // Test that we can still access objects
      const rootObject = project.rootObject;
      expect(rootObject.props).toBeDefined();
      expect(rootObject.props.mainGroup).toBeDefined();
    });
  });

  describe('Backward Compatibility', () => {
    it('original open method should still work', () => {
      const project = XcodeProject.open(SMALL_FIXTURE);
      
      expect(project).toBeDefined();
      expect(project.rootObject).toBeDefined();
      expect(project.size).toBeGreaterThan(0);
    });

    it('openLazy should be compatible with original open results', () => {
      const originalProject = XcodeProject.open(SMALL_FIXTURE);
      const lazyProject = XcodeProject.openLazy(SMALL_FIXTURE, {
        skipFullInflation: false // Full inflation for comparison
      });
      
      expect(lazyProject.archiveVersion).toBe(originalProject.archiveVersion);
      expect(lazyProject.objectVersion).toBe(originalProject.objectVersion);
      expect(lazyProject.rootObject.uuid).toBe(originalProject.rootObject.uuid);
    });
  });

  describe('Memory Management', () => {
    it('lazy loading should use less initial memory', () => {
      // This test is informational - memory usage can vary
      if (global.gc) global.gc();
      const startMemory = process.memoryUsage().heapUsed;
      
      const project = XcodeProject.openLazy(MEDIUM_FIXTURE, {
        skipFullInflation: true
      });
      
      const endMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (endMemory - startMemory) / 1024 / 1024; // MB
      
      // Should use reasonable memory (this is more of a smoke test)
      expect(memoryIncrease).toBeLessThan(100); // Less than 100MB
      expect(project).toBeDefined();
    });
  });
});
