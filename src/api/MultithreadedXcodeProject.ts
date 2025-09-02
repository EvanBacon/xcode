import { readFileSync } from "fs";
import path from "path";
import os from "os";
import { XcodeProject } from "./XcodeProject";
import { WorkerPool } from "../utils/WorkerPool";
import { parse } from "../json";
import * as json from "../json/types";

export interface MultithreadedOptions {
  maxWorkers?: number;
  chunkSize?: number;
  progressCallback?: (processed: number, total: number, workerStats?: any) => void;
}

export class MultithreadedXcodeProject extends XcodeProject {
  private workerPool?: WorkerPool;

  /**
   * Opens an Xcode project with multithreaded optimizations
   */
  static async openMultithreaded(
    filePath: string,
    options: MultithreadedOptions = {}
  ): Promise<MultithreadedXcodeProject> {
    const {
      maxWorkers = Math.max(2, os.cpus().length - 1),
      chunkSize = 1000,
      progressCallback
    } = options;

    console.log(`🚀 Opening project with ${maxWorkers} worker threads...`);
    
    // Step 1: Read and parse (still single-threaded, but optimized)
    progressCallback?.(0, 100, { stage: 'reading' });
    console.time('📁 File read');
    const contents = readFileSync(filePath, "utf8");
    console.timeEnd('📁 File read');
    console.log(`   File size: ${(contents.length / 1024 / 1024).toFixed(2)} MB`);

    progressCallback?.(20, 100, { stage: 'parsing' });
    console.time('🔍 JSON parsing');
    const jsonData = parse(contents);
    console.timeEnd('🔍 JSON parsing');

    const objectCount = Object.keys(jsonData.objects || {}).length;
    console.log(`   Objects found: ${objectCount.toLocaleString()}`);

    // Step 2: Create project with lazy loading
    progressCallback?.(40, 100, { stage: 'creating' });
    const project = new MultithreadedXcodeProject(filePath, jsonData, {
      skipFullInflation: true
    });

    // Step 3: Set up worker pool
    project.workerPool = new WorkerPool({
      maxWorkers,
      workerScript: path.join(__dirname, '../workers/object-inflation-worker.js')
    });

    progressCallback?.(50, 100, { stage: 'ready' });
    console.log('✅ Multithreaded project ready');

    return project;
  }

  /**
   * Analyzes the project using multiple worker threads
   */
  async analyzeParallel(options: {
    chunkSize?: number;
    progressCallback?: (processed: number, total: number) => void;
  } = {}): Promise<{
    totalObjects: number;
    fileTypes: Record<string, number>;
    objectTypes: Record<string, number>;
    processingTime: number;
    threadsUsed: number;
  }> {
    if (!this.workerPool) {
      throw new Error('Worker pool not initialized. Use openMultithreaded() first.');
    }

    const { chunkSize = 1000, progressCallback } = options;
    const uninflatedObjects = this.getUninflatedObjects();
    const objectEntries = Object.entries(uninflatedObjects);
    
    if (objectEntries.length === 0) {
      console.log('ℹ️  No uninflated objects to analyze');
      return {
        totalObjects: 0,
        fileTypes: {},
        objectTypes: {},
        processingTime: 0,
        threadsUsed: 0
      };
    }

    console.log(`🔄 Analyzing ${objectEntries.length.toLocaleString()} objects in parallel...`);
    console.time('🧵 Parallel analysis');

    // Split objects into chunks for parallel processing
    const chunks: Array<{ chunkId: number; objects: Record<string, json.AbstractObject<any>> }> = [];
    
    for (let i = 0; i < objectEntries.length; i += chunkSize) {
      const chunkEntries = objectEntries.slice(i, i + chunkSize);
      const chunkObjects = Object.fromEntries(chunkEntries);
      
      chunks.push({
        chunkId: i / chunkSize,
        objects: chunkObjects
      });
    }

    console.log(`   Split into ${chunks.length} chunks of ~${chunkSize} objects each`);

    // Process chunks in parallel
    const startTime = Date.now();
    let processed = 0;

    try {
      const tasks = chunks.map(chunk => ({
        objectChunk: chunk.objects,
        chunkId: chunk.chunkId
      }));

      // Execute all tasks in parallel
      const results = await this.workerPool.executeAll<{
        chunkId: number;
        inflatedCount: number;
        error?: string;
        stats?: {
          fileTypes: Record<string, number>;
          objectTypes: Record<string, number>;
        };
      }>(tasks);

      // Aggregate results
      const aggregatedResult = {
        totalObjects: 0,
        fileTypes: {} as Record<string, number>,
        objectTypes: {} as Record<string, number>,
        processingTime: Date.now() - startTime,
        threadsUsed: this.workerPool.getStats().totalWorkers
      };

      for (const result of results) {
        if (result.error) {
          console.error(`❌ Chunk ${result.chunkId} failed:`, result.error);
          continue;
        }

        aggregatedResult.totalObjects += result.inflatedCount;

        // Merge file types
        if (result.stats?.fileTypes) {
          for (const [type, count] of Object.entries(result.stats.fileTypes)) {
            aggregatedResult.fileTypes[type] = (aggregatedResult.fileTypes[type] || 0) + count;
          }
        }

        // Merge object types
        if (result.stats?.objectTypes) {
          for (const [type, count] of Object.entries(result.stats.objectTypes)) {
            aggregatedResult.objectTypes[type] = (aggregatedResult.objectTypes[type] || 0) + count;
          }
        }

        processed += result.inflatedCount;
        progressCallback?.(processed, objectEntries.length);
      }

      console.timeEnd('🧵 Parallel analysis');
      console.log(`   Processed ${aggregatedResult.totalObjects.toLocaleString()} objects`);
      console.log(`   Used ${aggregatedResult.threadsUsed} worker threads`);
      console.log(`   Processing time: ${aggregatedResult.processingTime}ms`);

      return aggregatedResult;

    } catch (error) {
      console.error('❌ Parallel analysis failed:', error);
      throw error;
    }
  }

  /**
   * Compares performance between single-threaded and multi-threaded analysis
   */
  async benchmarkAnalysis(chunkSize = 1000): Promise<{
    singleThreaded: { time: number; objects: number };
    multiThreaded: { time: number; objects: number; threads: number };
    speedup: number;
  }> {
    const uninflatedObjects = this.getUninflatedObjects();
    const objectCount = Object.keys(uninflatedObjects).length;

    if (objectCount < 100) {
      console.log('⚠️  Too few objects for meaningful benchmark');
    }

    console.log(`🏁 Benchmarking analysis performance (${objectCount.toLocaleString()} objects)...`);

    // Single-threaded benchmark
    console.log('   Running single-threaded analysis...');
    console.time('🔄 Single-threaded');
    
    const singleThreadedStart = Date.now();
    let fileTypes = {} as Record<string, number>;
    let objectTypes = {} as Record<string, number>;
    
    for (const [uuid, obj] of Object.entries(uninflatedObjects)) {
      objectTypes[obj.isa] = (objectTypes[obj.isa] || 0) + 1;
      
      if (obj.isa === 'PBXFileReference') {
        const fileRef = obj as any;
        const fileType = fileRef.lastKnownFileType || fileRef.explicitFileType || 'unknown';
        fileTypes[fileType] = (fileTypes[fileType] || 0) + 1;
      }
    }
    
    const singleThreadedTime = Date.now() - singleThreadedStart;
    console.timeEnd('🔄 Single-threaded');

    // Multi-threaded benchmark
    console.log('   Running multi-threaded analysis...');
    const multiThreadedResult = await this.analyzeParallel({ chunkSize });

    const speedup = singleThreadedTime / multiThreadedResult.processingTime;

    console.log('\n📊 Benchmark Results:');
    console.log(`   Single-threaded: ${singleThreadedTime}ms`);
    console.log(`   Multi-threaded:  ${multiThreadedResult.processingTime}ms (${multiThreadedResult.threadsUsed} threads)`);
    console.log(`   Speedup: ${speedup.toFixed(2)}x`);

    return {
      singleThreaded: { time: singleThreadedTime, objects: objectCount },
      multiThreaded: { 
        time: multiThreadedResult.processingTime, 
        objects: objectCount,
        threads: multiThreadedResult.threadsUsed 
      },
      speedup
    };
  }

  /**
   * Clean up worker pool
   */
  async cleanup(): Promise<void> {
    if (this.workerPool) {
      await this.workerPool.close();
      this.workerPool = undefined;
    }
  }

  /**
   * Get worker pool statistics
   */
  getWorkerStats() {
    return this.workerPool?.getStats() || null;
  }
}
