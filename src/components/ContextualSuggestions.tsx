import React, { useMemo } from 'react';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { faqSystem } from '../utils/faqSystem';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{
    document: string;
    page: number;
    excerpt: string;
  }>;
}

interface ContextualSuggestionsProps {
  messages: Message[];
  onAskQuestion: (question: string) => void;
  isProcessing: boolean;
}

export function ContextualSuggestions({ messages, onAskQuestion, isProcessing }: ContextualSuggestionsProps) {
  // Define helper functions first
  const calculateSimilarity = (str1: string, str2: string): number => {
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    return intersection.length / union.length;
  };

  const generateFollowUpQuestions = (assistantResponse: string): Array<{question: string; reason: string}> => {
    const response = assistantResponse.toLowerCase();
    const followUps: Array<{question: string; reason: string}> = [];

    // Pattern-based follow-up generation
    if (response.includes('summary') || response.includes('overview')) {
      followUps.push({
        question: "Can you provide more specific details about any particular aspect?",
        reason: "Dive deeper"
      });
      followUps.push({
        question: "What are the practical implications of these findings?",
        reason: "Practical application"
      });
    }

    if (response.includes('research') || response.includes('study') || response.includes('method')) {
      followUps.push({
        question: "How does this research compare to other studies in the field?",
        reason: "Comparative analysis"
      });
      followUps.push({
        question: "What are the limitations of this research approach?",
        reason: "Critical evaluation"
      });
    }

    if (response.includes('result') || response.includes('finding') || response.includes('conclusion')) {
      followUps.push({
        question: "What evidence supports these conclusions?",
        reason: "Evidence review"
      });
      followUps.push({
        question: "How significant are these results?",
        reason: "Impact assessment"
      });
    }

    if (response.includes('application') || response.includes('practical') || response.includes('implementation')) {
      followUps.push({
        question: "What challenges might arise in implementing this?",
        reason: "Implementation challenges"
      });
      followUps.push({
        question: "Are there any case studies or examples of this being used?",
        reason: "Real-world examples"
      });
    }

    // Generic academic follow-ups
    if (followUps.length < 2) {
      followUps.push(
        {
          question: "Can you explain this in simpler terms?",
          reason: "Simplify explanation"
        },
        {
          question: "What are the key takeaways from this information?",
          reason: "Key insights"
        },
        {
          question: "How does this relate to current trends in the field?",
          reason: "Current relevance"
        }
      );
    }

    return followUps.slice(0, 3);
  };

  const contextualQuestions = useMemo(() => {
    if (messages.length === 0) return [];

    // Get the last few messages for context
    const recentMessages = messages.slice(-3);
    const userQuestions = recentMessages.filter(m => m.type === 'user').map(m => m.content);
    const assistantResponses = recentMessages.filter(m => m.type === 'assistant').map(m => m.content);

    // Combine recent content for context analysis
    const contextContent = [...userQuestions, ...assistantResponses].join(' ');
    
    // Get contextual suggestions based on recent conversation
    const suggestions = faqSystem.getSuggestedQuestions(contextContent, 3);
    
    // Filter out questions that are too similar to recently asked ones
    const filteredSuggestions = suggestions.filter(suggestion => {
      return !userQuestions.some(asked => 
        calculateSimilarity(asked.toLowerCase(), suggestion.question.toLowerCase()) > 0.7
      );
    });

    return filteredSuggestions;
  }, [messages]);

  const followUpQuestions = useMemo(() => {
    if (messages.length === 0) return [];

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.type !== 'assistant') return [];

    // Generate follow-up questions based on the last assistant response
    const followUps = generateFollowUpQuestions(lastMessage.content);
    return followUps;
  }, [messages]);

  if (isProcessing || (contextualQuestions.length === 0 && followUpQuestions.length === 0)) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          Suggested Follow-ups
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Follow-up questions based on last response */}
          {followUpQuestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Continue the conversation:</p>
              {followUpQuestions.map((followUp, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-auto p-3 text-left"
                  onClick={() => onAskQuestion(followUp.question)}
                >
                  <div className="flex items-start gap-2 w-full">
                    <ArrowRight className="h-3 w-3 mt-1 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-medium">{followUp.question}</div>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {followUp.reason}
                      </Badge>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}

          {/* Contextual suggestions from FAQ system */}
          {contextualQuestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Related questions:</p>
              {contextualQuestions.map((faq) => (
                <Button
                  key={faq.id}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-auto p-3 text-left"
                  onClick={() => onAskQuestion(faq.question)}
                >
                  <div className="flex items-start gap-2 w-full">
                    <Lightbulb className="h-3 w-3 mt-1 text-yellow-500 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-medium">{faq.question}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {faq.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {faq.timesAsked} times asked
                        </span>
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}