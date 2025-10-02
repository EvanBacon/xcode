import { BaseVisitor } from "../parser/parser";
import { XcodeProject } from "../types";

/**
 * Streaming JsonVisitor for extremely large pbxproj files
 * Processes objects in chunks to reduce memory pressure
 */
export class StreamingJsonVisitor extends BaseVisitor {
  context: Partial<XcodeProject> = {};
  
  // Streaming configuration
  private chunkSize: number;
  private processedChunks = 0;
  private currentChunk: any[] = [];
  private deferredObjects: any[] = [];
  
  // Memory management
  private maxMemoryMB: number;
  private startMemory: number;
  
  // Progress tracking
  private progressCallback?: (processed: number, total: number, memoryMB: number) => void;
  private itemsProcessed = 0;
  private totalEstimate = 0;

  constructor(options: {
    chunkSize?: number;
    maxMemoryMB?: number;
    progressCallback?: (processed: number, total: number, memoryMB: number) => void;
    estimatedObjects?: number;
  } = {}) {
    super();
    this.validateVisitor();
    
    this.chunkSize = options.chunkSize || 1000;
    this.maxMemoryMB = options.maxMemoryMB || 512; // Default 512MB limit
    this.progressCallback = options.progressCallback;
    this.totalEstimate = options.estimatedObjects || 0;
    this.startMemory = this.getMemoryUsageMB();
    
    console.log(`🌊 Streaming parser initialized:`);
    console.log(`   Chunk size: ${this.chunkSize.toLocaleString()}`);
    console.log(`   Memory limit: ${this.maxMemoryMB}MB`);
    console.log(`   Starting memory: ${this.startMemory}MB`);
  }

  private getMemoryUsageMB(): number {
    const usage = process.memoryUsage();
    return Math.round(usage.heapUsed / 1024 / 1024);
  }

  private checkMemoryPressure(): boolean {
    const currentMemory = this.getMemoryUsageMB();
    const memoryIncrease = currentMemory - this.startMemory;
    
    if (memoryIncrease > this.maxMemoryMB) {
      console.log(`⚠️  Memory pressure detected: ${currentMemory}MB (+${memoryIncrease}MB)`);
      return true;
    }
    
    return false;
  }

  private reportProgress() {
    const currentMemory = this.getMemoryUsageMB();
    this.progressCallback?.(this.itemsProcessed, this.totalEstimate, currentMemory);
  }

  head(ctx: any) {
    console.time('🌊 Streaming JSON parsing');
    
    if (ctx.array) {
      this.context = this.visit(ctx.array);
    } else if (ctx.object) {
      this.context = this.visit(ctx.object);
    }
    
    // Process any remaining deferred objects
    this.flushDeferredObjects();
    
    console.timeEnd('🌊 Streaming JSON parsing');
    console.log(`   Chunks processed: ${this.processedChunks}`);
    console.log(`   Items processed: ${this.itemsProcessed.toLocaleString()}`);
    console.log(`   Final memory: ${this.getMemoryUsageMB()}MB`);
  }

  // Streaming object processing with memory management
  object(ctx: any) {
    if (!ctx.objectItem) {
      return {};
    }

    const items = ctx.objectItem;
    
    // For very large objects, process in streaming fashion
    if (items.length > this.chunkSize) {
      return this.processLargeObject(items);
    }
    
    // Regular processing for smaller objects
    return this.processRegularObject(items);
  }

  private processLargeObject(items: any[]): any {
    console.log(`🔄 Processing large object with ${items.length.toLocaleString()} items`);
    
    const result: any = {};
    let processedItems = 0;
    
    // Process items in chunks
    for (let i = 0; i < items.length; i += this.chunkSize) {
      const chunk = items.slice(i, i + this.chunkSize);
      
      // Process chunk
      for (const item of chunk) {
        const processedItem = this.visit(item);
        if (processedItem && typeof processedItem === 'object') {
          Object.assign(result, processedItem);
        }
        processedItems++;
        this.itemsProcessed++;
      }
      
      this.processedChunks++;
      
      // Memory pressure check
      if (this.checkMemoryPressure()) {
        // Force garbage collection hint
        if (global.gc) {
          global.gc();
          console.log(`   Triggered garbage collection at chunk ${this.processedChunks}`);
        }
      }
      
      // Progress reporting
      if (this.processedChunks % 10 === 0) {
        console.log(`   Processed ${processedItems.toLocaleString()}/${items.length.toLocaleString()} items (${((processedItems/items.length)*100).toFixed(1)}%)`);
        this.reportProgress();
      }
    }
    
    return result;
  }

  private processRegularObject(items: any[]): any {
    const result: any = {};
    
    for (const item of items) {
      const processedItem = this.visit(item);
      if (processedItem && typeof processedItem === 'object') {
        Object.assign(result, processedItem);
      }
    }
    
    this.itemsProcessed += items.length;
    return result;
  }

  // Optimized array processing with streaming
  array(ctx: any) {
    if (!ctx.value) {
      return [];
    }

    const values = ctx.value;
    
    // For large arrays, use streaming approach
    if (values.length > this.chunkSize) {
      return this.processLargeArray(values);
    }
    
    // Regular processing for smaller arrays
    const result = new Array(values.length);
    for (let i = 0; i < values.length; i++) {
      result[i] = this.visit(values[i]);
    }
    
    this.itemsProcessed += values.length;
    return result;
  }

  private processLargeArray(values: any[]): any[] {
    console.log(`🔄 Processing large array with ${values.length.toLocaleString()} items`);
    
    const result: any[] = [];
    
    for (let i = 0; i < values.length; i += this.chunkSize) {
      const chunk = values.slice(i, i + this.chunkSize);
      
      // Process chunk
      const processedChunk = chunk.map(value => this.visit(value));
      result.push(...processedChunk);
      
      this.itemsProcessed += chunk.length;
      this.processedChunks++;
      
      // Memory and progress management
      if (this.processedChunks % 5 === 0) {
        this.reportProgress();
        
        if (this.checkMemoryPressure() && global.gc) {
          global.gc();
        }
      }
    }
    
    return result;
  }

  // Deferred object processing for memory management
  private addDeferredObject(obj: any) {
    this.deferredObjects.push(obj);
    
    // Process deferred objects in batches
    if (this.deferredObjects.length >= this.chunkSize) {
      this.flushDeferredObjects();
    }
  }

  private flushDeferredObjects() {
    if (this.deferredObjects.length === 0) return;
    
    console.log(`🔄 Processing ${this.deferredObjects.length} deferred objects`);
    
    // Process all deferred objects
    for (const obj of this.deferredObjects) {
      // Process deferred object
      this.visit(obj);
    }
    
    // Clear deferred objects
    this.deferredObjects = [];
    
    // Trigger cleanup
    if (global.gc) {
      global.gc();
    }
  }

  // Same optimized methods as OptimizedJsonVisitor
  objectItem(ctx: any) {
    const key = this.visit(ctx.identifier);
    const value = this.visit(ctx.value);
    
    const result: any = {};
    result[key] = value;
    return result;
  }

  identifier(ctx: any) {
    if (ctx.QuotedString) {
      return ctx.QuotedString[0].payload ?? ctx.QuotedString[0].image;
    } else if (ctx.StringLiteral) {
      const literal = ctx.StringLiteral[0].payload ?? ctx.StringLiteral[0].image;
      return parseType(literal);
    }
    throw new Error("unhandled identifier: " + JSON.stringify(ctx));
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
      chunksProcessed: this.processedChunks,
      itemsProcessed: this.itemsProcessed,
      deferredObjects: this.deferredObjects.length,
      currentMemoryMB: this.getMemoryUsageMB(),
      memoryIncreaseMB: this.getMemoryUsageMB() - this.startMemory
    };
  }
}

// Shared optimized parseType function
function parseType(literal: string): number | string {
  // Fast path for common values
  if (literal.length < 20) {
    switch (literal) {
      case 'PBXProject':
      case 'PBXNativeTarget':
      case 'PBXFileReference':
      case 'PBXGroup':
      case '<group>':
      case 'SDKROOT':
        return literal;
    }
  }
  
  // Preserve octal literals
  if (/^0\d+$/.test(literal)) {
    return literal;
  }
  
  // Handle numbers
  if (/^[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)$/.test(literal)) {
    if (/0$/.test(literal)) {
      return literal; // Preserve trailing zero
    }
    const num = parseFloat(literal);
    if (!isNaN(num)) return num;
  }
  
  // Handle integers
  if (/^\d+$/.test(literal)) {
    const num = parseInt(literal, 10);
    if (!isNaN(num)) return num;
  }
  
  return literal;
}
