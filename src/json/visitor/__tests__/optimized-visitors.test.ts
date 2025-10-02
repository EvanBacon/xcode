/**
 * Tests for optimized JSON visitors
 * 
 * These tests verify that the new visitor implementations:
 * - Produce equivalent results to the original JsonVisitor
 * - Provide performance and memory optimizations
 * - Handle various file sizes correctly
 * - Maintain data integrity across parsing strategies
 */

import fs from 'fs';
import path from 'path';
import { parse as parseCST } from '../../parser/parser';
import { JsonVisitor } from '../JsonVisitor';
import { OptimizedJsonVisitor } from '../OptimizedJsonVisitor';
import { StreamingJsonVisitor } from '../StreamingJsonVisitor';
import { MemoryEfficientVisitor } from '../MemoryEfficientVisitor';

const FIXTURES_DIR = path.join(__dirname, '../../__tests__/fixtures');
const SMALL_FIXTURE = path.join(FIXTURES_DIR, 'project.pbxproj');
const MEDIUM_FIXTURE = path.join(FIXTURES_DIR, 'AFNetworking.pbxproj');

describe('Optimized Visitors', () => {
  describe('OptimizedJsonVisitor', () => {
    it('should produce equivalent results to original JsonVisitor', () => {
      const content = fs.readFileSync(SMALL_FIXTURE, 'utf8');
      const cst = parseCST(content);
      
      // Parse with original visitor
      const originalVisitor = new JsonVisitor();
      originalVisitor.visit(cst);
      const originalResult = originalVisitor.context;
      
      // Parse with optimized visitor
      const optimizedVisitor = new OptimizedJsonVisitor();
      optimizedVisitor.visit(cst);
      const optimizedResult = optimizedVisitor.context;
      
      // Core properties should match
      expect(optimizedResult.archiveVersion).toBe(originalResult.archiveVersion);
      expect(optimizedResult.objectVersion).toBe(originalResult.objectVersion);
      expect(optimizedResult.rootObject).toBe(originalResult.rootObject);
      expect(Object.keys(optimizedResult.objects || {})).toEqual(
        Object.keys(originalResult.objects || {})
      );
    });

    it('should provide processing statistics', () => {
      const content = fs.readFileSync(SMALL_FIXTURE, 'utf8');
      const cst = parseCST(content);
      
      const visitor = new OptimizedJsonVisitor();
      visitor.visit(cst);
      
      const stats = visitor.getStats();
      expect(stats).toBeDefined();
      expect(stats.objectCount).toBeGreaterThan(0);
      expect(stats.arrayCount).toBeGreaterThanOrEqual(0);
      expect(stats.itemsProcessed).toBeGreaterThan(0);
    });
  });

  describe('StreamingJsonVisitor', () => {
    it('should parse files correctly with streaming', () => {
      const content = fs.readFileSync(SMALL_FIXTURE, 'utf8');
      const cst = parseCST(content);
      
      const visitor = new StreamingJsonVisitor({
        chunkSize: 10 // Small chunks to test chunking logic
      });
      visitor.visit(cst);
      
      const result = visitor.context;
      expect(result).toBeDefined();
      expect(result.objects).toBeDefined();
      expect(Object.keys(result.objects || {}).length).toBeGreaterThan(0);
    });

    it('should provide streaming statistics', () => {
      const content = fs.readFileSync(SMALL_FIXTURE, 'utf8');
      const cst = parseCST(content);
      
      const visitor = new StreamingJsonVisitor({
        chunkSize: 50,
        maxMemoryMB: 100
      });
      visitor.visit(cst);
      
      const stats = visitor.getStats();
      expect(stats).toBeDefined();
      expect(stats.itemsProcessed).toBeGreaterThan(0);
      expect(stats.currentMemoryMB).toBeGreaterThan(0);
    });

    it('should handle custom configuration', () => {
      const content = fs.readFileSync(SMALL_FIXTURE, 'utf8');
      const cst = parseCST(content);
      
      const visitor = new StreamingJsonVisitor({
        chunkSize: 5,
        maxMemoryMB: 50
      });
      
      expect(() => visitor.visit(cst)).not.toThrow();
    });
  });

  describe('MemoryEfficientVisitor', () => {
    it('should extract metadata without full object construction', () => {
      const content = fs.readFileSync(MEDIUM_FIXTURE, 'utf8');
      const cst = parseCST(content);
      
      const visitor = new MemoryEfficientVisitor();
      visitor.visit(cst);
      
      const analysis = visitor.getAnalysis();
      
      expect(analysis.objectCount).toBeGreaterThan(0);
      expect(analysis.fileTypeCount).toBeDefined();
      expect(analysis.objectTypeCount).toBeDefined();
      expect(analysis.topFileTypes).toBeInstanceOf(Array);
      expect(analysis.topObjectTypes).toBeInstanceOf(Array);
    });

    it('should extract target names when present', () => {
      const content = fs.readFileSync(MEDIUM_FIXTURE, 'utf8');
      const cst = parseCST(content);
      
      const visitor = new MemoryEfficientVisitor();
      visitor.visit(cst);
      
      const analysis = visitor.getAnalysis();
      
      expect(analysis.targetNames).toBeInstanceOf(Array);
      expect(analysis.targetNames.length).toBeGreaterThan(0);
    });

    it('should return minimal project structure', () => {
      const content = fs.readFileSync(SMALL_FIXTURE, 'utf8');
      const cst = parseCST(content);
      
      const visitor = new MemoryEfficientVisitor();
      visitor.visit(cst);
      
      const minimalProject = visitor.getMinimalProject();
      
      expect(minimalProject.archiveVersion).toBeDefined();
      expect(minimalProject.objectVersion).toBeDefined();
      expect(minimalProject.objects).toEqual({});
      expect(minimalProject.classes).toEqual({});
    });
  });

  describe('Cross-Visitor Consistency', () => {
    it('all visitors should extract same object count from same input', () => {
      const content = fs.readFileSync(SMALL_FIXTURE, 'utf8');
      const cst = parseCST(content);
      
      // Original visitor
      const originalVisitor = new JsonVisitor();
      originalVisitor.visit(cst);
      const originalCount = Object.keys(originalVisitor.context.objects || {}).length;
      
      // Optimized visitor
      const optimizedVisitor = new OptimizedJsonVisitor();
      optimizedVisitor.visit(cst);
      const optimizedCount = Object.keys(optimizedVisitor.context.objects || {}).length;
      
      // Streaming visitor
      const streamingVisitor = new StreamingJsonVisitor();
      streamingVisitor.visit(cst);
      const streamingCount = Object.keys(streamingVisitor.context.objects || {}).length;
      
      // Memory-efficient visitor
      const memoryEfficientVisitor = new MemoryEfficientVisitor();
      memoryEfficientVisitor.visit(cst);
      const memoryEfficientCount = memoryEfficientVisitor.getAnalysis().objectCount;
      
      // All should extract the same number of objects
      expect(optimizedCount).toBe(originalCount);
      expect(streamingCount).toBe(originalCount);
      expect(memoryEfficientCount).toBe(originalCount);
    });

    it('optimized strategies should preserve data structure integrity', () => {
      const content = fs.readFileSync(SMALL_FIXTURE, 'utf8');
      const cst = parseCST(content);
      
      // Parse with original
      const originalVisitor = new JsonVisitor();
      originalVisitor.visit(cst);
      const original = originalVisitor.context;
      
      // Parse with optimized
      const optimizedVisitor = new OptimizedJsonVisitor();
      optimizedVisitor.visit(cst);
      const optimized = optimizedVisitor.context;
      
      // Key structural elements should match
      expect(optimized.archiveVersion).toBe(original.archiveVersion);
      expect(optimized.objectVersion).toBe(original.objectVersion);
      expect(optimized.rootObject).toBe(original.rootObject);
      
      // Verify a few sample objects maintain their isa property
      const originalObjects = original.objects || {};
      const optimizedObjects = optimized.objects || {};
      
      for (const [uuid, originalObj] of Object.entries(originalObjects).slice(0, 5)) {
        const optimizedObj = optimizedObjects[uuid];
        expect(optimizedObj).toBeDefined();
        expect((optimizedObj as any).isa).toBe((originalObj as any).isa);
      }
    });
  });

  describe('Error Handling', () => {
    it('visitors should handle parsing errors gracefully', () => {
      // Test with minimal valid content
      const simpleContent = '{ archiveVersion = 1; objects = {}; rootObject = ""; }';
      
      expect(() => {
        const cst = parseCST(simpleContent);
        const visitor = new OptimizedJsonVisitor();
        visitor.visit(cst);
      }).not.toThrow();
    });
  });

  describe('Real-world Compatibility', () => {
    const availableFixtures = [
      'project.pbxproj',
      'project-multitarget.pbxproj', 
      'AFNetworking.pbxproj'
    ].filter(fixture => {
      const fixturePath = path.join(FIXTURES_DIR, fixture);
      return fs.existsSync(fixturePath);
    });

    availableFixtures.forEach(fixture => {
      it(`should handle ${fixture} with all strategies`, () => {
        const fixturePath = path.join(FIXTURES_DIR, fixture);
        const content = fs.readFileSync(fixturePath, 'utf8');
        const cst = parseCST(content);
        
        // Test main visitors
        const visitors = [
          new JsonVisitor(),
          new OptimizedJsonVisitor(),
          new StreamingJsonVisitor({ chunkSize: 20 })
        ];
        
        const results = visitors.map(visitor => {
          try {
            visitor.visit(cst);
            return { 
              success: true, 
              objectCount: Object.keys(visitor.context.objects || {}).length 
            };
          } catch (error) {
            return { success: false, error };
          }
        });
        
        // All visitors should succeed
        results.forEach((result, index) => {
          expect(result.success).toBe(true);
        });
        
        // All should extract same number of objects
        const objectCounts = results.map(r => r.objectCount);
        const firstCount = objectCounts[0];
        objectCounts.forEach(count => {
          expect(count).toBe(firstCount);
        });
      });
    });
  });
});