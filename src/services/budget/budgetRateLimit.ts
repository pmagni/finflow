
export class BudgetRateLimit {
  private rateLimits: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly maxRequestsPerMinute = 10;
  private readonly windowMs = 60000;

  checkRateLimit(userId: string, operation: string): boolean {
    const key = `${userId}-${operation}`;
    const now = Date.now();
    const entry = this.rateLimits.get(key);

    if (!entry) {
      this.rateLimits.set(key, { count: 1, resetTime: now + this.windowMs });
      return false;
    }

    if (now > entry.resetTime) {
      this.rateLimits.set(key, { count: 1, resetTime: now + this.windowMs });
      return false;
    }

    if (entry.count >= this.maxRequestsPerMinute) {
      return true;
    }

    entry.count++;
    return false;
  }
}

export const budgetRateLimit = new BudgetRateLimit();
