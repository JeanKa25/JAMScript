#!/usr/bin/env zx
import fetch from 'node-fetch';

const TOTAL_REQUESTS = 500;
const CONCURRENCY = 20;
const endpoint = 'http://0.0.0.0:3000/jamlist';

const payload = {
  all: "all"
};

let active = 0;
let completed = 0;
let failed = 0;

const sendRequest = async (i) => {
  try {
    active++;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(`[${i}] Failed: ${res.status}`);
      failed++;
    } else {
      console.log(`[${i}] Success`);
    }
  } catch (err) {
    console.error(`[${i}] Failed: ${res.status}`);
    failed++;
  } finally {
    completed++;
    active--;
  }
};

const runLoadTest = async () => {
  console.time('Test Duration');
  let queue = [];

  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    const task = sendRequest(i);
    queue.push(task);

    if (queue.length >= CONCURRENCY) {
      await Promise.all(queue);
      queue = [];
    }
  }

  // Await any remaining requests
  await Promise.all(queue);

  console.timeEnd('Test Duration');
  console.log(`\nResults: ${completed} completed, ${failed} failed.`);
};

await runLoadTest();