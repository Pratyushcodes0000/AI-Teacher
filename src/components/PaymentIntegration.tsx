// Payment integration component for handling subscriptions
import React, { useState } from 'react';
import { CreditCard, Lock, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface PaymentIntegrationProps {
  plan: 'pro' | 'premium';
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentIntegration({ plan, onSuccess, onCancel }: PaymentIntegrationProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
  });

  const planPrices = {
    pro: { monthly: 9.99, yearly: 99.99 },
    premium: { monthly: 19.99, yearly: 199.99 }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    // In production, integrate with Stripe, PayPal, or other payment processor
    try {
      console.log('Processing payment for:', { plan, formData });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production, this would:
      // 1. Send payment data to secure backend
      // 2. Process payment with payment provider
      // 3. Update user subscription in database
      // 4. Send confirmation email
      
      onSuccess();
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Complete Your Upgrade</CardTitle>
          <CardDescription>
            Upgrade to {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
            <div className="text-lg font-semibold mt-2">
              ${planPrices[plan].monthly}/month
            </div>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>Secure 256-bit SSL encrypted payment</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                placeholder="your@email.com"
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                placeholder="John Doe"
              />
            </div>

            {/* Card Number */}
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <div className="relative">
                <Input
                  id="cardNumber"
                  type="text"
                  value={formData.cardNumber}
                  onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                  required
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
                <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            {/* Expiry and CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="text"
                  value={formData.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  required
                  placeholder="MM/YY"
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  type="text"
                  value={formData.cvv}
                  onChange={(e) => handleInputChange('cvv', e.target.value)}
                  required
                  placeholder="123"
                  maxLength={4}
                />
              </div>
            </div>

            {/* Features Reminder */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-sm font-medium mb-2">You're getting:</div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Unlimited documents & questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Advanced text processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Premium export formats</span>
                </div>
                {plan === 'premium' && (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Batch processing & API access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Team collaboration</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : `Subscribe ${planPrices[plan].monthly}/mo`}
              </Button>
            </div>
          </form>

          {/* Trial Info */}
          <div className="text-center text-sm text-muted-foreground border-t pt-4">
            7-day free trial • Cancel anytime • No hidden fees
          </div>
        </CardContent>
      </Card>
    </div>
  );
}