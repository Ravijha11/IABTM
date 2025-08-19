// Token Bucket Rate Limiter
export class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number; // tokens per second

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000; // Convert to seconds
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  tryConsume(tokens: number = 1): boolean {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }

  getTokensAvailable(): number {
    this.refill();
    return this.tokens;
  }

  getTimeUntilNextToken(): number {
    if (this.tokens >= 1) return 0;
    
    const tokensNeeded = 1 - this.tokens;
    return (tokensNeeded / this.refillRate) * 1000; // Return milliseconds
  }
}

// Leaky Bucket Rate Limiter
export class LeakyBucket {
  private queue: Array<{ timestamp: number; data: any }> = [];
  private lastLeak: number;
  private readonly capacity: number;
  private readonly leakRate: number; // items per second

  constructor(capacity: number, leakRate: number) {
    this.capacity = capacity;
    this.leakRate = leakRate;
    this.lastLeak = Date.now();
  }

  private leak(): void {
    const now = Date.now();
    const timePassed = (now - this.lastLeak) / 1000; // Convert to seconds
    const itemsToRemove = Math.floor(timePassed * this.leakRate);
    
    // Remove items from the front of the queue
    for (let i = 0; i < itemsToRemove && this.queue.length > 0; i++) {
      this.queue.shift();
    }
    
    this.lastLeak = now;
  }

  tryAdd(data: any): boolean {
    this.leak();
    
    if (this.queue.length < this.capacity) {
      this.queue.push({ timestamp: Date.now(), data });
      return true;
    }
    
    return false;
  }

  getQueueLength(): number {
    this.leak();
    return this.queue.length;
  }

  getNextItemTime(): number | null {
    if (this.queue.length === 0) return null;
    
    const timeSinceLastLeak = (Date.now() - this.lastLeak) / 1000;
    const itemsProcessed = Math.floor(timeSinceLastLeak * this.leakRate);
    
    if (itemsProcessed >= this.queue.length) return 0;
    
    const itemsRemaining = this.queue.length - itemsProcessed;
    return (itemsRemaining / this.leakRate) * 1000; // Return milliseconds
  }
}

// Rate Limiter Manager for different types of actions
export class RateLimiterManager {
  private limiters: Map<string, TokenBucket | LeakyBucket> = new Map();

  // Message sending rate limiter (Token Bucket)
  createMessageLimiter(userId: string): TokenBucket {
    const key = `message:${userId}`;
    const limiter = new TokenBucket(10, 2); // 10 tokens, 2 per second
    this.limiters.set(key, limiter);
    return limiter;
  }

  // Mic toggle rate limiter (Token Bucket)
  createMicToggleLimiter(userId: string): TokenBucket {
    const key = `mic:${userId}`;
    const limiter = new TokenBucket(5, 1); // 5 tokens, 1 per second
    this.limiters.set(key, limiter);
    return limiter;
  }

  // Typing indicator rate limiter (Leaky Bucket)
  createTypingLimiter(userId: string): LeakyBucket {
    const key = `typing:${userId}`;
    const limiter = new LeakyBucket(3, 1); // 3 items, 1 per second
    this.limiters.set(key, limiter);
    return limiter;
  }

  // Audio room join/leave rate limiter (Token Bucket)
  createAudioRoomLimiter(userId: string): TokenBucket {
    const key = `audio:${userId}`;
    const limiter = new TokenBucket(3, 0.5); // 3 tokens, 0.5 per second
    this.limiters.set(key, limiter);
    return limiter;
  }

  // Get existing limiter or create new one
  getLimiter(type: string, userId: string): TokenBucket | LeakyBucket | null {
    const key = `${type}:${userId}`;
    return this.limiters.get(key) || null;
  }

  // Remove limiter for a user
  removeLimiter(type: string, userId: string): void {
    const key = `${type}:${userId}`;
    this.limiters.delete(key);
  }

  // Clear all limiters
  clear(): void {
    this.limiters.clear();
  }
}

// Global rate limiter manager instance
export const rateLimiterManager = new RateLimiterManager();

// Hook for using rate limiting in React components
export const useRateLimiting = (userId: string) => {
  const checkMessageLimit = (): boolean => {
    const limiter = rateLimiterManager.getLimiter('message', userId) as TokenBucket;
    if (!limiter) {
      rateLimiterManager.createMessageLimiter(userId);
      return true;
    }
    return limiter.tryConsume();
  };

  const checkMicToggleLimit = (): boolean => {
    const limiter = rateLimiterManager.getLimiter('mic', userId) as TokenBucket;
    if (!limiter) {
      rateLimiterManager.createMicToggleLimiter(userId);
      return true;
    }
    return limiter.tryConsume();
  };

  const checkTypingLimit = (): boolean => {
    const limiter = rateLimiterManager.getLimiter('typing', userId) as LeakyBucket;
    if (!limiter) {
      rateLimiterManager.createTypingLimiter(userId);
      return true;
    }
    return limiter.tryAdd({ timestamp: Date.now() });
  };

  const checkAudioRoomLimit = (): boolean => {
    const limiter = rateLimiterManager.getLimiter('audio', userId) as TokenBucket;
    if (!limiter) {
      rateLimiterManager.createAudioRoomLimiter(userId);
      return true;
    }
    return limiter.tryConsume();
  };

  return {
    checkMessageLimit,
    checkMicToggleLimit,
    checkTypingLimit,
    checkAudioRoomLimit
  };
};

// Rate limiting middleware for API calls
export const createRateLimitedFunction = <T extends (...args: any[]) => any>(
  func: T,
  rateLimiter: TokenBucket | LeakyBucket,
  onLimitExceeded?: () => void
): T => {
  return ((...args: Parameters<T>) => {
    let canProceed = false;
    
    if (rateLimiter instanceof TokenBucket) {
      canProceed = rateLimiter.tryConsume();
    } else if (rateLimiter instanceof LeakyBucket) {
      canProceed = rateLimiter.tryAdd({ timestamp: Date.now() });
    }
    
    if (canProceed) {
      return func(...args);
    } else {
      onLimitExceeded?.();
      throw new Error('Rate limit exceeded');
    }
  }) as T;
}; 