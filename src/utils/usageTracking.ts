// Usage tracking and limits for freemium model
export interface UsageStats {
  documentsProcessed: number;
  questionsAsked: number;
  lastResetDate: string;
  planType: 'free' | 'pro' | 'premium';
  subscriptionStatus: 'active' | 'expired' | 'trial';
}

export interface UsageLimits {
  maxDocuments: number;
  maxQuestions: number;
  canExportAdvanced: boolean;
  canUseCloudSync: boolean;
  canUseBatchProcessing: boolean;
}

const PLAN_LIMITS: Record<string, UsageLimits> = {
  free: {
    maxDocuments: 5,
    maxQuestions: 25,
    canExportAdvanced: false,
    canUseCloudSync: false,
    canUseBatchProcessing: false,
  },
  pro: {
    maxDocuments: -1, // unlimited
    maxQuestions: -1, // unlimited
    canExportAdvanced: true,
    canUseCloudSync: true,
    canUseBatchProcessing: false,
  },
  premium: {
    maxDocuments: -1,
    maxQuestions: -1,
    canExportAdvanced: true,
    canUseCloudSync: true,
    canUseBatchProcessing: true,
  },
};

class UsageTracker {
  private static readonly STORAGE_KEY = 'academic_assistant_usage';
  
  static getUsageStats(userId: string): UsageStats {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
      if (stored) {
        const stats = JSON.parse(stored);
        // Reset monthly if needed
        const lastReset = new Date(stats.lastResetDate);
        const now = new Date();
        if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
          return this.resetMonthlyUsage(userId, stats.planType);
        }
        return stats;
      }
    } catch (error) {
      console.warn('Failed to load usage stats:', error);
    }
    
    return this.createDefaultStats();
  }
  
  static updateUsage(userId: string, type: 'document' | 'question'): boolean {
    const stats = this.getUsageStats(userId);
    const limits = PLAN_LIMITS[stats.planType];
    
    if (type === 'document') {
      if (limits.maxDocuments > 0 && stats.documentsProcessed >= limits.maxDocuments) {
        return false; // Limit exceeded
      }
      stats.documentsProcessed++;
    } else if (type === 'question') {
      if (limits.maxQuestions > 0 && stats.questionsAsked >= limits.maxQuestions) {
        return false; // Limit exceeded
      }
      stats.questionsAsked++;
    }
    
    this.saveUsageStats(userId, stats);
    return true;
  }
  
  static canPerformAction(userId: string, action: keyof UsageLimits): boolean {
    const stats = this.getUsageStats(userId);
    const limits = PLAN_LIMITS[stats.planType];
    return limits[action] as boolean;
  }
  
  static getRemainingUsage(userId: string): { documents: number; questions: number } {
    const stats = this.getUsageStats(userId);
    const limits = PLAN_LIMITS[stats.planType];
    
    return {
      documents: limits.maxDocuments > 0 ? Math.max(0, limits.maxDocuments - stats.documentsProcessed) : -1,
      questions: limits.maxQuestions > 0 ? Math.max(0, limits.maxQuestions - stats.questionsAsked) : -1,
    };
  }
  
  static upgradePlan(userId: string, newPlan: 'pro' | 'premium'): void {
    const stats = this.getUsageStats(userId);
    stats.planType = newPlan;
    stats.subscriptionStatus = 'active';
    this.saveUsageStats(userId, stats);
  }
  
  private static createDefaultStats(): UsageStats {
    return {
      documentsProcessed: 0,
      questionsAsked: 0,
      lastResetDate: new Date().toISOString(),
      planType: 'free',
      subscriptionStatus: 'active',
    };
  }
  
  private static resetMonthlyUsage(userId: string, planType: string): UsageStats {
    const stats = {
      documentsProcessed: 0,
      questionsAsked: 0,
      lastResetDate: new Date().toISOString(),
      planType: planType as any,
      subscriptionStatus: 'active' as any,
    };
    this.saveUsageStats(userId, stats);
    return stats;
  }
  
  private static saveUsageStats(userId: string, stats: UsageStats): void {
    try {
      localStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(stats));
    } catch (error) {
      console.warn('Failed to save usage stats:', error);
    }
  }
}

export { UsageTracker, PLAN_LIMITS };