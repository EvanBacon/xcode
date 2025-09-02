import { parentPort, workerData } from 'worker_threads';
import * as json from '../json/types';

// Worker for inflating objects in parallel
interface WorkerData {
  objectChunk: Record<string, json.AbstractObject<any>>;
  chunkId: number;
}

interface WorkerResult {
  chunkId: number;
  inflatedCount: number;
  error?: string;
  stats?: {
    fileTypes: Record<string, number>;
    objectTypes: Record<string, number>;
  };
}

function analyzeObjectChunk(objects: Record<string, json.AbstractObject<any>>) {
  const stats = {
    fileTypes: {} as Record<string, number>,
    objectTypes: {} as Record<string, number>,
  };

  let inflatedCount = 0;

  for (const [uuid, obj] of Object.entries(objects)) {
    inflatedCount++;
    
    // Count object types
    stats.objectTypes[obj.isa] = (stats.objectTypes[obj.isa] || 0) + 1;
    
    // Analyze file references
    if (obj.isa === 'PBXFileReference') {
      const fileRef = obj as any;
      const fileType = fileRef.lastKnownFileType || fileRef.explicitFileType || 'unknown';
      stats.fileTypes[fileType] = (stats.fileTypes[fileType] || 0) + 1;
    }
  }

  return { inflatedCount, stats };
}

// Main worker execution
if (parentPort) {
  try {
    const { objectChunk, chunkId } = workerData as WorkerData;
    
    const result = analyzeObjectChunk(objectChunk);
    
    const workerResult: WorkerResult = {
      chunkId,
      inflatedCount: result.inflatedCount,
      stats: result.stats,
    };
    
    parentPort.postMessage(workerResult);
  } catch (error) {
    const workerResult: WorkerResult = {
      chunkId: workerData.chunkId,
      inflatedCount: 0,
      error: error instanceof Error ? error.message : String(error),
    };
    
    parentPort.postMessage(workerResult);
  }
}
