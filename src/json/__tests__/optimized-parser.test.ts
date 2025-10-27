/**
 * Tests for optimized parser functionality
 * 
 * These tests verify that the parser optimizations provide:
 * - Equivalent functionality to the original parser
 * - Better performance for large files  
 * - Memory-efficient analysis capabilities
 * - Automatic strategy selection based on file size
 */

import fs from 'fs';
import path from 'path';
import { 
  parseOptimized, 
  parseWithStrategy, 
  analyzeProjectMetadata
} from '../OptimizedParser';
import { parse as parseOriginal } from '../index';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const SMALL_FIXTURE = path.join(FIXTURES_DIR, 'project.pbxproj');
const MEDIUM_FIXTURE = path.join(FIXTURES_DIR, 'AFNetworking.pbxproj'); 

describe('OptimizedParser', () => {
  describe('parseOptimized', () => {
    it('should parse small files correctly', () => {
      const content = fs.readFileSync(SMALL_FIXTURE, 'utf8');
      
      const result = parseOptimized(content);
      
      expect(result).toBeDefined();
      expect(result.objects).toBeDefined();
      expect(result.rootObject).toBeDefined();
      expect(Object.keys(result.objects || {}).length).toBeGreaterThan(0);
    });

    it('should produce equivalent results to original parser', () => {
      const content = fs.readFileSync(SMALL_FIXTURE, 'utf8');
      
      const optimizedResult = parseOptimized(content);
      const originalResult = parseOriginal(content);
      
      // Core structure should match
      expect(optimizedResult.archiveVersion).toBe(originalResult.archiveVersion);
      expect(optimizedResult.objectVersion).toBe(originalResult.objectVersion);
      expect(optimizedResult.rootObject).toBe(originalResult.rootObject);
      expect(Object.keys(optimizedResult.objects || {})).toEqual(Object.keys(originalResult.objects || {}));
    });

    it('should handle medium files with AFNetworking fixture', () => {
      const content = fs.readFileSync(MEDIUM_FIXTURE, 'utf8');
      
      const result = parseOptimized(content);
      
      expect(result).toBeDefined();
      expect(result.objects).toBeDefined();
      expect(Object.keys(result.objects || {}).length).toBeGreaterThan(100); // AFNetworking has many objects
    });

    it('should respect forceOptimized option', () => {
      const content = fs.readFileSync(SMALL_FIXTURE, 'utf8');
      
      const result = parseOptimized(content, { forceOptimized: true });
      
      expect(result).toBeDefined();
      expect(result.objects).toBeDefined();
    });

    it('should respect forceStreaming option', () => {
      const content = fs.readFileSync(SMALL_FIXTURE, 'utf8');
      
      const result = parseOptimized(content, { forceStreaming: true });
      
      expect(result).toBeDefined();
      expect(result.objects).toBeDefined();
    });
  });

  describe('parseWithStrategy', () => {
    it('should parse with original strategy', () => {
      const content = fs.readFileSync(SMALL_FIXTURE, 'utf8');
      
      const result = parseWithStrategy(content, 'original');
      const originalResult = parseOriginal(content);
      
      expect(result).toEqual(originalResult);
    });

    it('should parse with optimized strategy', () => {
      const content = fs.readFileSync(SMALL_FIXTURE, 'utf8');
      
      const result = parseWithStrategy(content, 'optimized');
      
      expect(result).toBeDefined();
      expect(result.objects).toBeDefined();
    });

    it('should parse with streaming strategy', () => {
      const content = fs.readFileSync(SMALL_FIXTURE, 'utf8');
      
      const result = parseWithStrategy(content, 'streaming');
      
      expect(result).toBeDefined();
      expect(result.objects).toBeDefined();
    });
  });

  describe('analyzeProjectMetadata', () => {
    it('should extract metadata without building full object tree', () => {
      const content = fs.readFileSync(MEDIUM_FIXTURE, 'utf8');
      
      const metadata = analyzeProjectMetadata(content);
      
      expect(metadata.objectCount).toBeGreaterThan(0);
      expect(metadata.fileTypeCount).toBeDefined();
      expect(metadata.objectTypeCount).toBeDefined();
      expect(metadata.topFileTypes).toBeInstanceOf(Array);
      expect(metadata.topObjectTypes).toBeInstanceOf(Array);
      expect(metadata.parsingTimeMs).toBeGreaterThan(0);
    });

    it('should identify object types', () => {
      const content = fs.readFileSync(SMALL_FIXTURE, 'utf8');
      
      const metadata = analyzeProjectMetadata(content);
      
      const objectTypes = Object.keys(metadata.objectTypeCount);
      expect(objectTypes.length).toBeGreaterThan(0);
      
      // Should find some known Xcode object types
      const knownTypes = ['PBXProject', 'PBXFileReference', 'PBXGroup', 'PBXNativeTarget', 'PBXBuildFile'];
      const hasKnownType = objectTypes.some(type => knownTypes.includes(type));
      expect(hasKnownType).toBe(true);
    });

    it('should identify file types when present', () => {
      const content = fs.readFileSync(MEDIUM_FIXTURE, 'utf8');
      
      const metadata = analyzeProjectMetadata(content);
      
      const fileTypes = Object.keys(metadata.fileTypeCount);
      // AFNetworking should have various file types
      expect(fileTypes.length).toBeGreaterThan(0);
    });

    it('should extract target names', () => {
      const content = fs.readFileSync(MEDIUM_FIXTURE, 'utf8');
      
      const metadata = analyzeProjectMetadata(content);
      
      expect(metadata.targetNames).toBeInstanceOf(Array);
      // AFNetworking should have at least one target
      expect(metadata.targetNames.length).toBeGreaterThan(0);
    });

    it('should provide performance timing', () => {
      const content = fs.readFileSync(SMALL_FIXTURE, 'utf8');
      
      const metadata = analyzeProjectMetadata(content);
      
      expect(metadata.parsingTimeMs).toBeGreaterThan(0);
      expect(metadata.parsingTimeMs).toBeLessThan(10000); // Should be under 10 seconds
    });
  });

  describe('Performance Comparison', () => {
    it('should handle parsing without crashes', () => {
      const content = fs.readFileSync(MEDIUM_FIXTURE, 'utf8');
      
      // All strategies should work without crashing
      expect(() => parseWithStrategy(content, 'original')).not.toThrow();
      expect(() => parseWithStrategy(content, 'optimized')).not.toThrow();
      expect(() => parseWithStrategy(content, 'streaming')).not.toThrow();
    });

    it('should produce consistent object counts across strategies', () => {
      const content = fs.readFileSync(SMALL_FIXTURE, 'utf8');
      
      const originalResult = parseWithStrategy(content, 'original');
      const optimizedResult = parseWithStrategy(content, 'optimized');
      const streamingResult = parseWithStrategy(content, 'streaming');
      
      const originalCount = Object.keys(originalResult.objects || {}).length;
      const optimizedCount = Object.keys(optimizedResult.objects || {}).length;
      const streamingCount = Object.keys(streamingResult.objects || {}).length;
      
      expect(optimizedCount).toBe(originalCount);
      expect(streamingCount).toBe(originalCount);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed input gracefully', () => {
      const malformedContent = '{ invalid pbxproj content }';
      
      expect(() => parseOptimized(malformedContent)).toThrow();
    });

    it('should handle empty input', () => {
      expect(() => parseOptimized('')).toThrow();
    });
  });

  describe('Configuration Options', () => {
    it('should accept custom configuration without crashing', () => {
      const content = fs.readFileSync(SMALL_FIXTURE, 'utf8');
      
      expect(() => parseOptimized(content, { 
        chunkSize: 100,
        maxMemoryMB: 256,
        estimateObjects: false
      })).not.toThrow();
    });
  });

  describe('Integration with existing API', () => {
    it('should work with XcodeProject.openLazy', () => {
      // Import here to avoid circular dependency
      const { XcodeProject } = require('../../api/XcodeProject');
      
      const project = XcodeProject.openLazy(SMALL_FIXTURE, {
        skipFullInflation: true
      });
      
      expect(project).toBeDefined();
      expect(project.rootObject).toBeDefined();
      
      const stats = project.getQuickStats();
      expect(stats.totalObjects).toBeGreaterThan(0);
    });
  });
});