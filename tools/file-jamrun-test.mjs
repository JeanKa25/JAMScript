#!/usr/bin/env zx
import os from 'os';
import process from 'process';

const TOTAL_REQUESTS = 75;
const CONCURRENCY = 5;
const FILE = 'jt1.jxe';
const APP = 'DEMO';
const BG = true;

let active = 0;
let completed = 0;
let failed = 0;
let queue = [];
const checkpoints = [];
const requestDurations = [];

console.time('Test Duration');

const runJamrun = async (i) => {
  const args = ['jamrun.mjs', FILE, `--app=${APP}`];
  if (BG) args.push('--bg');

  const start = Date.now();
  try {
    await $`zx ${args}`;
    const duration = Date.now() - start;
    requestDurations[i] = duration;
    console.log(`[${i}] Success`);
  } catch (err) {
    console.error(`[${i}] Failed: ${err.message}`);
    failed++;
  } finally {
    completed++;

    if (completed % 10 === 0) {
      const avgDuration = requestDurations
        .slice(completed - 10, completed)
        .reduce((a, b) => a + b, 0) / 10;

      const mem = process.memoryUsage();
      const cpu = os.loadavg()[0];

      checkpoints.push({
        requests: completed,
        avgDurationMs: avgDuration.toFixed(2),
        memoryMB: (mem.rss / 1024 / 1024).toFixed(2),
        cpuLoad: cpu.toFixed(2),
      });
    }
  }
};

const runTest = async () => {
  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    const task = runJamrun(i);
    queue.push(task);

    if (queue.length >= CONCURRENCY) {
      await Promise.all(queue);
      queue = [];
    }
  }

  await Promise.all(queue); // Finish remaining
};

await runTest();
console.timeEnd('Test Duration');

console.log(`\nResults: ${completed} completed, ${failed} failed.`);

// Output checkpoint table
console.log('\nCheckpoint Summary (Every 10 Requests)');
console.log('Reqs\tAvg Time (ms)\tMemory (MB)\tCPU Load');
checkpoints.forEach(cp => {
  console.log(`${cp.requests}\t${cp.avgDurationMs}\t\t${cp.memoryMB}\t\t${cp.cpuLoad}`);
});
