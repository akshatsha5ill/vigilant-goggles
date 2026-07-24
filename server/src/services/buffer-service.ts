interface BufferEntry<T> {
  data: T;
  timestamp: number;
}

class BufferService {
  private buffer: Map<string, BufferEntry<any>>;
  private ttl: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(ttlMs: number = 24 * 60 * 60 * 1000) {
    this.buffer = new Map();
    this.ttl = ttlMs;
    this.cleanupInterval = setInterval(() => this._cleanup(), 15 * 60 * 1000);
    this.cleanupInterval.unref();
  }

  store<T>(key: string, data: T): void {
    this.buffer.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get<T>(key: string): T | null {
    const entry = this.buffer.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.buffer.delete(key);
      return null;
    }
    return entry.data as T;
  }

  delete(key: string): void {
    this.buffer.delete(key);
  }

  shutdown(): void {
    clearInterval(this.cleanupInterval);
    this.buffer.clear();
  }

  private _cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.buffer.entries()) {
      if (now - value.timestamp > this.ttl) {
        this.buffer.delete(key);
      }
    }
  }
}

export default new BufferService();
