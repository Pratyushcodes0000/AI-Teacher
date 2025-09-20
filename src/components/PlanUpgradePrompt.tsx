import React from 'react';
import { Crown, Zap, Star, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface PlanUpgradePromptProps {
  onUpgrade: (plan: 'pro' | 'premium') => void;
  onClose: () => void;
  limitType: 'documents' | 'questions' | 'feature';
  currentUsage?: { documents: number; questions: number };
}

export function PlanUpgradePrompt({ onUpgrade, onClose, limitType, currentUsage }: PlanUpgradePromptProps) {
  const getLimitMessage = () => {
    switch (limitType) {
      case 'documents':
        return "You've reached your document limit for this month. Upgrade to process unlimited documents!";
      case 'questions':
        return "You've reached your question limit for this month. Upgrade to ask unlimited questions!";
      case 'feature':
        return "This feature is available in Pro and Premium plans. Upgrade to unlock advanced capabilities!";
      default:
        return "Upgrade your plan to continue using Academic Assistant!";
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Upgrade Your Plan</CardTitle>
            <CardDescription className="text-lg">
              {getLimitMessage()}
            </CardDescription>
            {currentUsage && (
              <div className="flex justify-center gap-6 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{currentUsage.documents}</div>
                  <div className="text-sm text-muted-foreground">Documents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{currentUsage.questions}</div>
                  <div className="text-sm text-muted-foreground">Questions</div>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Pro Plan */}
              <Card className="border-2 border-blue-200 dark:border-blue-800 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                </div>
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-3">
                    <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl">Pro Plan</CardTitle>
                  <div className="text-3xl font-bold">$9.99<span className="text-sm font-normal">/month</span></div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Unlimited documents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Unlimited questions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Advanced OCR & text processing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Premium export formats</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Cloud backup & sync</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Priority processing</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-6" 
                    onClick={() => onUpgrade('pro')}
                  >
                    Upgrade to Pro
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Premium Plan */}
              <Card className="border-2 border-purple-200 dark:border-purple-800 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">Best Value</Badge>
                </div>
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-full flex items-center justify-center mb-3">
                    <Star className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-xl">Premium Plan</CardTitle>
                  <div className="text-3xl font-bold">$19.99<span className="text-sm font-normal">/month</span></div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Everything in Pro</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Batch document processing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Advanced analytics dashboard</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>API access for integrations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Team collaboration features</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Priority support</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" 
                    onClick={() => onUpgrade('premium')}
                  >
                    Upgrade to Premium
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center mt-6">
              <Button variant="ghost" onClick={onClose}>
                Maybe Later
              </Button>
            </div>

            <div className="text-center mt-4 text-sm text-muted-foreground">
              All plans include 7-day free trial • Cancel anytime • Secure payment
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}