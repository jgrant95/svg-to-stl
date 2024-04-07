import { Worker, parentPort } from "worker_threads";
import path from "path";

// Simulate a task that takes time to complete
function performTask(data: any): void {
  console.log(`Worker received data: ${data}`);
  // Perform some task here
  console.log("Task completed");
}

if (parentPort) {
  parentPort.on("message", (data) => {
    performTask(data);
    parentPort.postMessage("Task completed");
  });
}

export function createWorker(): Worker {
  // Resolve the path to the worker file
  const workerPath = path.resolve(__dirname, "./worker.ts");

  // Create and return a new worker instance
  return new Worker(workerPath);
}
