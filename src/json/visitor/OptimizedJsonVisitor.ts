import { BaseVisitor } from "../parser/parser";
import { XcodeProject } from "../types";

/** 
 * Performance-optimized JsonVisitor for large pbxproj files
 * Key optimizations:
 * - Eliminates expensive object spread operations
 * - Adds progress reporting for large objects  
 * - Pre-allocates objects when possible
 * - Reduces memory allocations
 */
export class OptimizedJsonVisitor extends BaseVisitor {
  context: Partial<XcodeProject> = {};
  
  // Progress tracking for large files
  private itemsProcessed = 0;
  private totalEstimate = 0;
  private lastProgressReport = Date.now();
  private progressCallback?: (processed: number, total: number, stage: string) => void;
  
  // Performance counters
  private objectCount = 0;
  private arrayCount = 0;
  
  constructor(options: {
    progressCallback?: (processed: number, total: number, stage: string) => void;
    estimatedObjects?: number;
  } = {}) {
    super();
    this.validateVisitor();
    this.progressCallback = options.progressCallback;
    this.totalEstimate = options.estimatedObjects || 0;
  }

  private reportProgress(stage: string) {
    const now = Date.now();
    // Report every 100ms or every 1000 items to avoid overwhelming the callback
    if (now - this.lastProgressReport > 100 || this.itemsProcessed % 1000 === 0) {
      this.progressCallback?.(this.itemsProcessed, this.totalEstimate, stage);
      this.lastProgressReport = now;
    }
  }

  head(ctx: any) {
    console.time('🔍 JSON visitor processing');
    if (ctx.array) {
      this.context = this.visit(ctx.array);
    } else if (ctx.object) {
      this.context = this.visit(ctx.object);
    }
    console.timeEnd('🔍 JSON visitor processing');
    console.log(`   Objects processed: ${this.objectCount.toLocaleString()}`);
    console.log(`   Arrays processed: ${this.arrayCount.toLocaleString()}`);
  }

  // MAJOR OPTIMIZATION: Replace expensive object spread with direct assignment
  object(ctx: any) {
    if (!ctx.objectItem) {
      return {};
    }

    this.objectCount++;
    this.itemsProcessed++;
    
    // Pre-allocate object instead of using spread operator
    const result: any = {};
    const items = ctx.objectItem;
    
    // Direct property assignment is much faster than object spread
    for (let i = 0; i < items.length; i++) {
      const item = this.visit(items[i]);
      // Object.assign or direct assignment is faster than spread
      if (item && typeof item === 'object') {
        const keys = Object.keys(item);
        for (let j = 0; j < keys.length; j++) {
          const key = keys[j];
          result[key] = item[key];
        }
      }
    }

    // Progress reporting for large objects
    if (this.objectCount % 500 === 0) {
      this.reportProgress('parsing objects');
    }

    return result;
  }

  // Optimized array processing
  array(ctx: any) {
    if (!ctx.value) {
      return [];
    }

    this.arrayCount++;
    this.itemsProcessed++;

    const values = ctx.value;
    // Pre-allocate array with known length
    const result = new Array(values.length);
    
    // Use for loop instead of map for better performance
    for (let i = 0; i < values.length; i++) {
      result[i] = this.visit(values[i]);
    }

    if (this.arrayCount % 100 === 0) {
      this.reportProgress('parsing arrays');
    }

    return result;
  }

  // Optimized object item processing
  objectItem(ctx: any) {
    const key = this.visit(ctx.identifier);
    const value = this.visit(ctx.value);
    
    // Create object directly instead of using computed property
    const result: any = {};
    result[key] = value;
    return result;
  }

  // Optimized identifier processing with caching for common values
  private static readonly COMMON_IDENTIFIERS: Record<string, any> = {
    'isa': 'isa',
    'children': 'children',
    'name': 'name',
    'path': 'path',
    'sourceTree': 'sourceTree',
    'fileRef': 'fileRef',
    'files': 'files',
    'buildPhases': 'buildPhases',
    'buildSettings': 'buildSettings',
    'targets': 'targets',
    'objects': 'objects',
    'rootObject': 'rootObject',
  };

  identifier(ctx: any) {
    let literal: string;
    
    if (ctx.QuotedString) {
      literal = ctx.QuotedString[0].payload ?? ctx.QuotedString[0].image;
    } else if (ctx.StringLiteral) {
      literal = ctx.StringLiteral[0].payload ?? ctx.StringLiteral[0].image;
    } else {
      throw new Error("unhandled identifier: " + JSON.stringify(ctx));
    }
    
    // Use cached common identifiers to reduce memory allocations
    return OptimizedJsonVisitor.COMMON_IDENTIFIERS[literal] || parseType(literal);
  }

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

  getStats() {
    return {
      objectCount: this.objectCount,
      arrayCount: this.arrayCount,
      itemsProcessed: this.itemsProcessed
    };
  }
}

// Optimized parseType function with better number handling
const numberRegex = /^[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)$/;
const integerRegex = /^\d+$/;
const octalRegex = /^0\d+$/;

function parseType(literal: string): number | string {
  // Fast path for common string values to avoid regex
  if (literal.length < 20) {
    switch (literal) {
      case 'PBXProject':
      case 'PBXNativeTarget': 
      case 'PBXFileReference':
      case 'PBXGroup':
      case 'PBXSourcesBuildPhase':
      case 'PBXFrameworksBuildPhase':
      case 'PBXResourcesBuildPhase':
      case '<group>':
      case '<absolute>':
      case 'SDKROOT':
      case 'SOURCE_ROOT':
      case 'BUILT_PRODUCTS_DIR':
        return literal;
    }
  }
  
  // Preserve octal literals with leading zeros
  if (octalRegex.test(literal)) {
    return literal;
  }
  
  // Handle decimal numbers but preserve trailing zeros
  if (numberRegex.test(literal)) {
    if (literal.endsWith('0') && literal.includes('.')) {
      return literal; // Preserve trailing zero
    }
    const num = parseFloat(literal);
    if (!isNaN(num)) return num;
  }
  
  // Handle integers - most common numeric case
  if (integerRegex.test(literal)) {
    const num = parseInt(literal, 10);
    if (!isNaN(num)) return num;
  }
  
  return literal;
}
