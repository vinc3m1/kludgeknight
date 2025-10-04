/**
 * Operation queue to serialize async operations and prevent race conditions
 */
export class OperationQueue {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;

  /**
   * Enqueue an async operation and return a promise that resolves when it completes
   */
  async enqueue<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    while (this.queue.length > 0) {
      const operation = this.queue.shift()!;
      await operation();
    }
    this.processing = false;
  }
}
