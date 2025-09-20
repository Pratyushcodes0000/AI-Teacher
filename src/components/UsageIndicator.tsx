import React from 'react';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Crown, FileText, MessageSquare } from 'lucide-react';

interface UsageIndicatorProps {
  currentUsage: { documents: number; questions: number };
  remaining: { documents: number; questions: number };
  planType: 'free' | 'pro' | 'premium';
  onUpgradeClick: () => void;
}

export function UsageIndicator({ currentUsage, remaining, planType, onUpgradeClick }: UsageIndicatorProps) {
  const isUnlimited = (value: number) => value === -1;
  
  const getProgressValue = (current: number, remaining: number) => {
    if (isUnlimited(remaining)) return 100;
    const total = current + remaining;
    return total > 0 ? (current / total) * 100 : 0;
  };
  
  const getProgressColor = (current: number, remaining: number) => {
    if (isUnlimited(remaining)) return 'bg-green-500';
    const total = current + remaining;
    const percentage = total > 0 ? (current / total) * 100 : 0;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getPlanBadgeColor = () => {
    switch (planType) {
      case 'pro': return 'bg-blue-500';
      case 'premium': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const isNearLimit = (current: number, remaining: number) => {
    if (isUnlimited(remaining)) return false;
    const total = current + remaining;
    return total > 0 && (current / total) >= 0.8;
  };

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Usage This Month</h3>
        <Badge className={`${getPlanBadgeColor()} text-white`}>
          {planType === 'free' && <span>Free Plan</span>}
          {planType === 'pro' && (
            <>
              <Crown className="w-3 h-3 mr-1" />
              Pro Plan
            </>
          )}
          {planType === 'premium' && (
            <>
              <Crown className="w-3 h-3 mr-1" />
              Premium Plan
            </>
          )}
        </Badge>
      </div>

      {/* Documents Usage */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Documents</span>
          </div>
          <span className="text-muted-foreground">
            {currentUsage.documents}{isUnlimited(remaining.documents) ? ' (unlimited)' : ` / ${currentUsage.documents + remaining.documents}`}
          </span>
        </div>
        <Progress 
          value={getProgressValue(currentUsage.documents, remaining.documents)} 
          className="h-2"
        />
        {!isUnlimited(remaining.documents) && remaining.documents <= 2 && (
          <p className="text-xs text-orange-600 dark:text-orange-400">
            Only {remaining.documents} documents remaining this month
          </p>
        )}
      </div>

      {/* Questions Usage */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>Questions</span>
          </div>
          <span className="text-muted-foreground">
            {currentUsage.questions}{isUnlimited(remaining.questions) ? ' (unlimited)' : ` / ${currentUsage.questions + remaining.questions}`}
          </span>
        </div>
        <Progress 
          value={getProgressValue(currentUsage.questions, remaining.questions)} 
          className="h-2"
        />
        {!isUnlimited(remaining.questions) && remaining.questions <= 5 && (
          <p className="text-xs text-orange-600 dark:text-orange-400">
            Only {remaining.questions} questions remaining this month
          </p>
        )}
      </div>

      {/* Upgrade Prompt */}
      {planType === 'free' && (isNearLimit(currentUsage.documents, remaining.documents) || isNearLimit(currentUsage.questions, remaining.questions)) && (
        <div className="pt-2 border-t">
          <button
            onClick={onUpgradeClick}
            className="w-full text-sm text-primary hover:text-primary/80 font-medium"
          >
            Upgrade for unlimited access →
          </button>
        </div>
      )}
    </div>
  );
}