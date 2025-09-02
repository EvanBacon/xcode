import * as parser from "./parser/parser";
import { XcodeProject } from "./types";
import { JsonVisitor } from "./visitor/JsonVisitor";
import { OptimizedJsonVisitor } from "./visitor/OptimizedJsonVisitor";
import { StreamingJsonVisitor } from "./visitor/StreamingJsonVisitor";
import { MemoryEfficientVisitor } from "./visitor/MemoryEfficientVisitor";
import { Writer } from "./writer";

export interface ParseOptions {
  progressCallback?: (processed: number, total: number, stage: string, memoryMB?: number) => void;
  chunkSize?: number;
  maxMemoryMB?: number;
  forceStreaming?: boolean;
  forceOptimized?: boolean;
  estimateObjects?: boolean;
}

/**
 * Auto-selects the best parsing strategy based on input size and options
 * - Small files (<1MB): Original JsonVisitor
 * - Medium files (1-20MB): OptimizedJsonVisitor  
 * - Large files (>20MB): StreamingJsonVisitor
 */
export function parseOptimized(
  text: string, 
  options: ParseOptions = {}
): Partial<XcodeProject> {
  const fileSizeMB = text.length / 1024 / 1024;
  const {
    progressCallback,
    chunkSize = 1000,
    maxMemoryMB = 1024,
    forceStreaming = false,
    forceOptimized = false,
    estimateObjects = true
  } = options;

  console.log(`📊 Input analysis:`);
  console.log(`   File size: ${fileSizeMB.toFixed(2)} MB`);
  console.log(`   Characters: ${text.length.toLocaleString()}`);

  // Estimate object count for progress reporting
  let estimatedObjects = 0;
  if (estimateObjects) {
    // Quick estimation based on pattern matching
    const objectMatches = text.match(/isa\s*=/g);
    estimatedObjects = objectMatches ? objectMatches.length : Math.floor(text.length / 1000);
    console.log(`   Estimated objects: ${estimatedObjects.toLocaleString()}`);
  }

  // Choose parsing strategy
  let strategy: 'original' | 'optimized' | 'streaming';
  
  if (forceStreaming) {
    strategy = 'streaming';
  } else if (forceOptimized) {
    strategy = 'optimized';
  } else if (fileSizeMB > 50) {
    strategy = 'streaming';
  } else if (fileSizeMB > 5) {
    strategy = 'optimized';
  } else {
    strategy = 'original';
  }

  console.log(`   Strategy: ${strategy}`);
  console.log();

  // Parse with selected strategy
  console.time('⚡ Total parsing time');
  
  let cst;
  console.time('🔍 CST generation');
  try {
    cst = parser.parse(text);
  } catch (error) {
    console.timeEnd('🔍 CST generation');
    console.error('❌ CST parsing failed:', error);
    throw error;
  }
  console.timeEnd('🔍 CST generation');

  let visitor: JsonVisitor | OptimizedJsonVisitor | StreamingJsonVisitor;
  let result: Partial<XcodeProject>;

  try {
    switch (strategy) {
      case 'streaming':
        console.log('🌊 Using StreamingJsonVisitor for large file');
        visitor = new StreamingJsonVisitor({
          chunkSize,
          maxMemoryMB,
          progressCallback: (processed, total, memoryMB) => {
            progressCallback?.(processed, total, 'streaming', memoryMB);
          },
          estimatedObjects
        });
        break;
        
      case 'optimized':
        console.log('⚡ Using OptimizedJsonVisitor for medium file');
        visitor = new OptimizedJsonVisitor({
          progressCallback: (processed, total, stage) => {
            progressCallback?.(processed, total, stage);
          },
          estimatedObjects
        });
        break;
        
      default:
        console.log('📝 Using original JsonVisitor for small file');
        visitor = new JsonVisitor();
        break;
    }

    visitor.visit(cst);
    result = visitor.context;

    // Show performance stats
    if ('getStats' in visitor) {
      const stats = visitor.getStats();
      console.log('📊 Parsing statistics:', stats);
    }

  } catch (error) {
    console.error('❌ Visitor processing failed:', error);
    throw error;
  }

  console.timeEnd('⚡ Total parsing time');
  
  const finalMemoryMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  console.log(`   Final memory usage: ${finalMemoryMB}MB`);
  
  return result;
}

/**
 * Parse with explicit strategy selection
 */
export function parseWithStrategy(
  text: string,
  strategy: 'original' | 'optimized' | 'streaming',
  options: ParseOptions = {}
): Partial<XcodeProject> {
  return parseOptimized(text, {
    ...options,
    forceOptimized: strategy === 'optimized',
    forceStreaming: strategy === 'streaming'
  });
}

/**
 * Performance benchmark comparing all parsing strategies
 */
export async function benchmarkParsing(
  text: string,
  options: { warmupRuns?: number; testRuns?: number } = {}
): Promise<{
  original: { time: number; memory: number };
  optimized: { time: number; memory: number };
  streaming: { time: number; memory: number };
}> {
  const { warmupRuns = 1, testRuns = 3 } = options;
  const fileSizeMB = text.length / 1024 / 1024;
  
  console.log(`🏁 Benchmarking parsing strategies (${fileSizeMB.toFixed(2)}MB file)`);
  console.log(`   Warmup runs: ${warmupRuns}, Test runs: ${testRuns}`);

  const strategies = ['original', 'optimized', 'streaming'] as const;
  const results: any = {};

  for (const strategy of strategies) {
    console.log(`\n🔄 Testing ${strategy} strategy...`);
    
    // Warmup runs
    for (let i = 0; i < warmupRuns; i++) {
      try {
        parseWithStrategy(text, strategy);
        if (global.gc) global.gc(); // Force cleanup between runs
      } catch (error) {
        console.warn(`   Warmup ${i + 1} failed for ${strategy}:`, error);
      }
    }

    // Test runs
    const times: number[] = [];
    const memories: number[] = [];
    
    for (let i = 0; i < testRuns; i++) {
      if (global.gc) global.gc(); // Start with clean memory
      
      const startMemory = process.memoryUsage().heapUsed;
      const startTime = process.hrtime();
      
      try {
        parseWithStrategy(text, strategy, { 
          progressCallback: undefined // Disable progress for cleaner benchmarks
        });
        
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const time = seconds * 1000 + nanoseconds / 1000000; // Convert to ms
        const endMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = Math.round((endMemory - startMemory) / 1024 / 1024);
        
        times.push(time);
        memories.push(memoryIncrease);
        
        console.log(`   Run ${i + 1}: ${time.toFixed(2)}ms, +${memoryIncrease}MB`);
        
      } catch (error) {
        console.error(`   Run ${i + 1} failed for ${strategy}:`, error);
        times.push(Infinity);
        memories.push(Infinity);
      }
    }
    
    // Calculate averages (excluding failed runs)
    const validTimes = times.filter(t => t !== Infinity);
    const validMemories = memories.filter(m => m !== Infinity);
    
    results[strategy] = {
      time: validTimes.length > 0 ? validTimes.reduce((a, b) => a + b) / validTimes.length : Infinity,
      memory: validMemories.length > 0 ? validMemories.reduce((a, b) => a + b) / validMemories.length : Infinity
    };
  }

  // Display summary
  console.log('\n📊 Benchmark Results Summary:');
  console.log('Strategy     | Avg Time (ms) | Avg Memory (MB)');
  console.log('-------------|---------------|----------------');
  
  for (const strategy of strategies) {
    const result = results[strategy];
    const timeStr = result.time === Infinity ? 'FAILED' : result.time.toFixed(2).padStart(8);
    const memStr = result.memory === Infinity ? 'FAILED' : result.memory.toFixed(2).padStart(8);
    console.log(`${strategy.padEnd(12)} | ${timeStr}     | ${memStr}`);
  }

  // Find best strategy
  const validResults = Object.entries(results).filter(([_, r]: any) => r.time !== Infinity);
  if (validResults.length > 0) {
    const fastest = validResults.reduce((best, current) => {
      const currentResult = current[1] as { time: number; memory: number };
      const bestResult = best[1] as { time: number; memory: number };
      return currentResult.time < bestResult.time ? current : best;
    });
    const mostMemoryEfficient = validResults.reduce((best, current) => {
      const currentResult = current[1] as { time: number; memory: number };
      const bestResult = best[1] as { time: number; memory: number };
      return currentResult.memory < bestResult.memory ? current : best;
    });
    
    const fastestResult = fastest[1] as { time: number; memory: number };
    const memEffResult = mostMemoryEfficient[1] as { time: number; memory: number };
    
    console.log(`\n🏆 Fastest: ${fastest[0]} (${fastestResult.time.toFixed(2)}ms)`);
    console.log(`🏆 Most memory efficient: ${mostMemoryEfficient[0]} (+${memEffResult.memory.toFixed(2)}MB)`);
  }

  return results;
}

/**
 * Memory-efficient analysis that doesn't build the full object tree
 * Perfect for very large files where you only need metadata/statistics
 */
export function analyzeProjectMetadata(
  text: string,
  options: { progressCallback?: (processed: number, total: number, stage: string) => void } = {}
): {
  archiveVersion?: number;
  objectVersion?: number;
  rootObject?: string;
  objectCount: number;
  fileTypeCount: Record<string, number>;
  objectTypeCount: Record<string, number>;
  targetNames: string[];
  estimatedMemoryMB: number;
  topFileTypes: [string, number][];
  topObjectTypes: [string, number][];
  parsingTimeMs: number;
} {
  const fileSizeMB = text.length / 1024 / 1024;
  const { progressCallback } = options;

  console.log(`🔬 Memory-efficient analysis of ${fileSizeMB.toFixed(2)}MB file`);
  console.log(`   Strategy: Extract metadata only, avoid building full object tree`);

  const startTime = Date.now();
  
  // Parse CST
  console.time('🔍 CST generation');
  const cst = parser.parse(text);
  console.timeEnd('🔍 CST generation');

  // Use memory-efficient visitor
  const visitor = new MemoryEfficientVisitor({ progressCallback });
  visitor.visit(cst);

  const analysisResult = visitor.getAnalysis();
  const parsingTime = Date.now() - startTime;

  return {
    ...analysisResult,
    parsingTimeMs: parsingTime
  };
}

// Re-export for backward compatibility
export { parse } from "./index";
export function build(project: Partial<XcodeProject>): string {
  return new Writer(project).getResults();
}
