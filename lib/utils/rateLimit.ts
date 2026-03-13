/**
 * API Rate Limiting Utility
 * Simple in-memory rate limiting using Map
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 60) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  /**
   * Check if a request is allowed for the given identifier
   * @param identifier Unique identifier (IP address, user ID, etc.)
   * @returns true if request is allowed, false otherwise
   */
  check(identifier: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Get remaining requests for the identifier
   */
  getRemaining(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  /**
   * Get reset time for the identifier
   */
  getResetTime(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry) {
      return Date.now() + this.windowMs;
    }
    return entry.resetTime;
  }

  /**
   * Clear rate limit for an identifier
   */
  clear(identifier: string): void {
    this.limits.delete(identifier);
  }

  /**
   * Clear all expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

// Pre-configured rate limiters for different use cases
export const apiRateLimit = new RateLimiter(60000, 60); // 60 requests per minute
export const searchRateLimit = new RateLimiter(60000, 30); // 30 searches per minute
export const authRateLimit = new RateLimiter(300000, 5); // 5 auth attempts per 5 minutes

/**
 * Simple rate limit check function
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60000
): boolean {
  return apiRateLimit.check(identifier);
}
