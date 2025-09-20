import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, BookOpen, Sparkles, Zap, ArrowDown } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ContextualSuggestions } from './ContextualSuggestions';
import { faqSystem, type FAQItem } from '../utils/faqSystem';

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

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  hasDocuments: boolean;
}

export function ChatInterface({ messages, onSendMessage, isProcessing, hasDocuments }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState<FAQItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Enhanced scroll to bottom with better UX
  const scrollToBottom = useCallback((force = false) => {
    if (scrollContainerRef.current && (!isUserScrolling || force)) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
      setShowScrollButton(false);
    }
  }, [isUserScrolling]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    // Small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

  // Handle scroll detection for the scroll container
  const handleScrollContainer = useCallback((event: Event) => {
    const target = event.target as HTMLDivElement;
    if (target) {
      const { scrollTop, scrollHeight, clientHeight } = target;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      setShowScrollButton(!isAtBottom && messages.length > 0);
      setIsUserScrolling(true);
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        setIsUserScrolling(false);
        if (isAtBottom) {
          scrollToBottom();
        }
      }, 2000);
    }
  }, [messages.length, scrollToBottom]);

  // Set up scroll listener
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScrollContainer);
      return () => {
        scrollContainer.removeEventListener('scroll', handleScrollContainer);
      };
    }
  }, [handleScrollContainer]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Load suggested questions based on context
    if (hasDocuments) {
      const suggestions = faqSystem.getSuggestedQuestions(undefined, 4);
      setSuggestedQuestions(suggestions);
    }
  }, [hasDocuments, messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Chat submit:', { inputValue, hasDocuments, isProcessing });
    if (inputValue.trim() && !isProcessing) {
      // Track the question in FAQ system
      faqSystem.trackQuestion(inputValue.trim());
      onSendMessage(inputValue.trim());
      setInputValue('');
      setShowSuggestions(false); // Hide suggestions after first question
      
      // Ensure we scroll to bottom after sending
      setTimeout(() => scrollToBottom(true), 200);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    faqSystem.trackQuestion(question);
    onSendMessage(question);
    setShowSuggestions(false);
    
    // Ensure we scroll to bottom after sending
    setTimeout(() => scrollToBottom(true), 200);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 p-4">
        <div 
          ref={scrollContainerRef}
          className="h-full overflow-y-auto chat-scroll-area"
        >
          <div className="space-y-4 pb-4">
            {messages.length === 0 ? (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ready to help with your documents</h3>
                  <p className="text-muted-foreground">
                    {hasDocuments 
                      ? "Ask me anything about your uploaded documents!"
                      : "Upload some PDF documents to get started."
                    }
                  </p>
                </div>

                {/* Smart Suggestions - Only show when no messages and has documents */}
                {hasDocuments && showSuggestions && suggestedQuestions.length > 0 && (
                  <div className="max-w-2xl mx-auto">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <h4 className="font-medium">Smart Suggestions</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {suggestedQuestions.map((faq) => (
                        <Button
                          key={faq.id}
                          variant="outline"
                          className="h-auto p-4 text-left justify-start"
                          onClick={() => handleSuggestedQuestion(faq.question)}
                        >
                          <div className="w-full">
                            <div className="font-medium text-sm mb-1">{faq.question}</div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {faq.category}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Zap className="h-3 w-3" />
                                {faq.timesAsked} times asked
                              </div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Existing messages display
              messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.type === 'assistant' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] space-y-2 ${message.type === 'user' ? 'order-first' : ''}`}>
                    <Card className={`p-3 ${message.type === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-muted'}`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </Card>
                    
                    {message.sources && message.sources.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Sources:</p>
                        {message.sources.map((source, index) => (
                          <Card key={index} className="p-2 bg-background border">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {source.document}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    Page {source.page}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {source.excerpt}
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  
                  {message.type === 'user' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-secondary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            
            {isProcessing && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
                <Card className="p-3 bg-muted">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-sm text-muted-foreground">Analyzing documents...</span>
                  </div>
                </Card>
              </div>
            )}

            {/* Contextual Suggestions - Show after messages */}
            {messages.length > 0 && hasDocuments && (
              <div className="max-w-[80%]">
                <ContextualSuggestions
                  messages={messages}
                  onAskQuestion={handleSuggestedQuestion}
                  isProcessing={isProcessing}
                />
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div className="absolute bottom-20 right-6 z-10">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => scrollToBottom(true)}
            className="rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border bg-background/80 backdrop-blur-sm"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="border-t p-4 bg-background/95 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={hasDocuments ? "Ask a question about your documents..." : "Upload documents first..."}
            disabled={isProcessing}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!inputValue.trim() || isProcessing}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}