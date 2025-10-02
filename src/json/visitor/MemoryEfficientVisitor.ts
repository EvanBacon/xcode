import { BaseVisitor } from "../parser/parser";
import { XcodeProject } from "../types";

/**
 * Ultra-memory efficient visitor that doesn't build the complete object in memory
 * Only extracts essential metadata and counts, avoiding full object construction
 */
export class MemoryEfficientVisitor extends BaseVisitor {
  // Instead of building full context, just extract key metadata
  metadata: {
    archiveVersion?: number;
    objectVersion?: number;
    rootObject?: string;
    objectCount: number;
    fileTypeCount: Record<string, number>;
    objectTypeCount: Record<string, number>;
    targetNames: string[];
    estimatedMemoryMB: number;
  } = {
    objectCount: 0,
    fileTypeCount: {},
    objectTypeCount: {},
    targetNames: [],
    estimatedMemoryMB: 0
  };

  private currentObjectType: string | null = null;
  private currentObjectData: any = {};
  private memoryEstimate = 0;
  private progressCallback?: (processed: number, total: number, stage: string) => void;
  private processedObjects = 0;

  constructor(options: {
    progressCallback?: (processed: number, total: number, stage: string) => void;
  } = {}) {
    super();
    this.validateVisitor();
    this.progressCallback = options.progressCallback;
  }

  head(ctx: any) {
    console.log('🔬 Memory-efficient analysis starting...');
    console.time('🧠 Memory-efficient parsing');
    
    if (ctx.array) {
      this.visit(ctx.array);
    } else if (ctx.object) {
      this.visit(ctx.object);
    }
    
    console.timeEnd('🧠 Memory-efficient parsing');
    
    // Estimate final memory usage
    this.metadata.estimatedMemoryMB = Math.round(this.memoryEstimate / 1024 / 1024);
    
    console.log(`📊 Analysis complete:`);
    console.log(`   Objects processed: ${this.metadata.objectCount.toLocaleString()}`);
    console.log(`   Memory footprint: ${this.metadata.estimatedMemoryMB}MB (estimated)`);
    console.log(`   Object types: ${Object.keys(this.metadata.objectTypeCount).length}`);
    console.log(`   File types: ${Object.keys(this.metadata.fileTypeCount).length}`);
  }

  // Override to avoid building full objects
  object(ctx: any) {
    if (!ctx.objectItem) {
      return null; // Return null instead of empty object
    }

    this.metadata.objectCount++;
    this.processedObjects++;
    
    // Reset current object tracking
    this.currentObjectType = null;
    this.currentObjectData = {};
    
    // Process items to extract metadata only
    const items = ctx.objectItem;
    for (const item of items) {
      this.visit(item);
    }
    
    // Analyze current object
    this.analyzeCurrentObject();
    
    // Progress reporting
    if (this.processedObjects % 1000 === 0) {
      this.progressCallback?.(this.processedObjects, this.metadata.objectCount, 'analyzing objects');
      
      // Estimate memory usage (very rough)
      this.memoryEstimate = this.processedObjects * 100; // ~100 bytes per object estimate
    }
    
    // Don't return the full object - save memory
    return null;
  }

  // Override to avoid building arrays
  array(ctx: any) {
    if (!ctx.value) {
      return null;
    }

    // Just process for analysis without building array
    const values = ctx.value;
    for (const value of values) {
      this.visit(value);
    }
    
    return null; // Don't build the actual array
  }

  // Track object properties for analysis
  objectItem(ctx: any) {
    const key = this.visit(ctx.identifier);
    const value = this.visit(ctx.value);
    
    // Store in current object data for analysis
    if (key && value !== null) {
      this.currentObjectData[key] = value;
    }
    
    return null; // Don't build the actual object item
  }

  // Extract essential data from current object
  private analyzeCurrentObject() {
    const { isa, name, lastKnownFileType, explicitFileType, targets } = this.currentObjectData;
    
    // Track object type
    if (isa) {
      this.currentObjectType = isa;
      this.metadata.objectTypeCount[isa] = (this.metadata.objectTypeCount[isa] || 0) + 1;
      
      // Extract special metadata
      switch (isa) {
        case 'PBXProject':
          // This is the root project
          if (this.currentObjectData.archiveVersion) {
            this.metadata.archiveVersion = this.currentObjectData.archiveVersion;
          }
          if (this.currentObjectData.objectVersion) {
            this.metadata.objectVersion = this.currentObjectData.objectVersion;
          }
          break;
          
        case 'PBXNativeTarget':
        case 'PBXAggregateTarget':
        case 'PBXLegacyTarget':
          if (name && typeof name === 'string') {
            this.metadata.targetNames.push(name);
          }
          break;
          
        case 'PBXFileReference':
          const fileType = lastKnownFileType || explicitFileType || 'unknown';
          this.metadata.fileTypeCount[fileType] = (this.metadata.fileTypeCount[fileType] || 0) + 1;
          break;
      }
    }
    
    // Clear current object data to save memory
    this.currentObjectData = {};
  }

  // Optimized identifier processing
  identifier(ctx: any) {
    if (ctx.QuotedString) {
      return ctx.QuotedString[0].payload ?? ctx.QuotedString[0].image;
    } else if (ctx.StringLiteral) {
      const literal = ctx.StringLiteral[0].payload ?? ctx.StringLiteral[0].image;
      return parseType(literal);
    }
    throw new Error("unhandled identifier: " + JSON.stringify(ctx));
  }

  // Optimized value processing
  value(ctx: any) {
    if (ctx.identifier) {
      return this.visit(ctx.identifier);
    } else if (ctx.DataLiteral) {
      return ctx.DataLiteral[0].payload ?? ctx.DataLiteral[0].image;
    } else if (ctx.object) {
      return this.visit(ctx.object);
    } else if (ctx.array) {
      return this.visit(ctx.array);
    }
    throw new Error("unhandled value: " + JSON.stringify(ctx));
  }

  // Get analysis results without the full parsed object
  getAnalysis() {
    return {
      ...this.metadata,
      topFileTypes: Object.entries(this.metadata.fileTypeCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10),
      topObjectTypes: Object.entries(this.metadata.objectTypeCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
    };
  }

  // Minimal XcodeProject structure for compatibility
  getMinimalProject(): Partial<XcodeProject> {
    return {
      archiveVersion: this.metadata.archiveVersion || 1,
      objectVersion: this.metadata.objectVersion || 55,
      objects: {}, // Empty - we didn't build the full object tree
      rootObject: this.metadata.rootObject || '',
      classes: {}
    };
  }
}

// Optimized parseType function
function parseType(literal: string): number | string {
  // Fast common value check
  if (literal.length < 30) {
    switch (literal) {
      case 'PBXProject':
      case 'PBXNativeTarget':
      case 'PBXFileReference':
      case 'PBXGroup':
      case 'PBXSourcesBuildPhase':
      case '<group>':
      case 'SDKROOT':
        return literal;
    }
  }
  
  // Simplified number parsing
  if (/^\d+$/.test(literal)) {
    const num = parseInt(literal, 10);
    if (!isNaN(num)) return num;
  }
  
  return literal;
}
