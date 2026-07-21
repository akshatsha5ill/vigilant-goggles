class BufferService {
  constructor() {
    this.buffer = new Map();
    this.ttl = 24 * 60 * 60 * 1000; // 24 hours
  }

  store(key, data) {
    this.buffer.set(key, {
      data,
      timestamp: Date.now()
    });

    // Cleanup logic (Sentinel: prevents infinite memory growth)
    this._cleanup();
  }

  get(key) {
    const entry = this.buffer.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.buffer.delete(key);
      return null;
    }
    return entry.data;
  }

  _cleanup() {
    const now = Date.now();
    for (const [key, value] of this.buffer.entries()) {
      if (now - value.timestamp > this.ttl) {
        this.buffer.delete(key);
      }
    }
  }
}

module.exports = new BufferService();
