import { Worker } from 'worker_threads';
import path from 'path';
import os from 'os';

export interface WorkerPoolOptions {
  maxWorkers?: number;
  workerScript: string;
}

export class WorkerPool {
  private workers: Worker[] = [];
  private queue: Array<{
    data: any;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private activeWorkers = 0;

  constructor(private options: WorkerPoolOptions) {
    const maxWorkers = options.maxWorkers || Math.max(2, os.cpus().length - 1);
    console.log(`🧵 Initializing worker pool with ${maxWorkers} workers`);
    
    for (let i = 0; i < maxWorkers; i++) {
      this.createWorker();
    }
  }

  private createWorker(): Worker {
    const worker = new Worker(this.options.workerScript);
    
    worker.on('message', (result) => {
      this.activeWorkers--;
      
      // Find the corresponding task and resolve it
      const task = this.queue.shift();
      if (task) {
        task.resolve(result);
      }
      
      // Process next queued task
      this.processQueue();
    });

    worker.on('error', (error) => {
      this.activeWorkers--;
      console.error('Worker error:', error);
      
      const task = this.queue.shift();
      if (task) {
        task.reject(error);
      }
      
      // Replace the failed worker
      this.createWorker();
      this.processQueue();
    });

    this.workers.push(worker);
    return worker;
  }

  private processQueue() {
    if (this.queue.length === 0 || this.activeWorkers >= this.workers.length) {
      return;
    }

    const availableWorker = this.workers.find(w => !w.threadId || this.activeWorkers < this.workers.length);
    if (!availableWorker) return;

    const task = this.queue[this.activeWorkers];
    if (task) {
      this.activeWorkers++;
      availableWorker.postMessage(task.data);
    }
  }

  async execute<T>(workerData: any): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        data: workerData,
        resolve,
        reject
      });
      
      this.processQueue();
    });
  }

  async executeAll<T>(tasks: any[]): Promise<T[]> {
    const promises = tasks.map(task => this.execute<T>(task));
    return Promise.all(promises);
  }

  async close(): Promise<void> {
    console.log('🔚 Closing worker pool...');
    
    const terminationPromises = this.workers.map(worker => 
      worker.terminate().catch(err => {
        console.warn('Error terminating worker:', err);
      })
    );
    
    await Promise.allSettled(terminationPromises);
    this.workers = [];
    console.log('✅ Worker pool closed');
  }

  getStats() {
    return {
      totalWorkers: this.workers.length,
      activeWorkers: this.activeWorkers,
      queueLength: this.queue.length,
    };
  }
}
