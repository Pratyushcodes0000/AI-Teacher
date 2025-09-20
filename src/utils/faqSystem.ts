// FAQ and Question Analytics System
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  popularity: number;
  keywords: string[];
  lastAsked: Date;
  timesAsked: number;
}

export interface QuestionPattern {
  pattern: string;
  category: string;
  suggestedQuestions: string[];
  count: number;
}

export interface QuestionAnalytics {
  totalQuestions: number;
  popularKeywords: Array<{ word: string; count: number }>;
  categoryDistribution: Record<string, number>;
  recentTrends: Array<{ question: string; count: number; trend: 'up' | 'down' | 'stable' }>;
}

class FAQSystem {
  private faqItems: FAQItem[] = [];
  private questionHistory: Array<{ question: string; timestamp: Date; category?: string }> = [];
  private readonly STORAGE_KEY = 'academic_assistant_faq';
  private readonly HISTORY_KEY = 'academic_assistant_question_history';

  constructor() {
    this.loadFromStorage();
    this.initializeDefaultFAQs();
  }

  // Initialize with common academic questions
  private initializeDefaultFAQs() {
    const defaultFAQs: Omit<FAQItem, 'id' | 'lastAsked' | 'timesAsked'>[] = [
      {
        question: "What is the main topic of this document?",
        answer: "I'll analyze the document to identify its primary subject matter, key themes, and central arguments.",
        category: "Summary",
        popularity: 100,
        keywords: ["main", "topic", "subject", "theme", "about"]
      },
      {
        question: "Can you summarize the key points?",
        answer: "I'll provide a concise overview of the most important concepts, findings, and conclusions from your documents.",
        category: "Summary",
        popularity: 95,
        keywords: ["summarize", "key points", "main points", "overview"]
      },
      {
        question: "What are the research methods used?",
        answer: "I'll examine the document to identify the research methodology, data collection techniques, and analytical approaches used.",
        category: "Research Methods",
        popularity: 80,
        keywords: ["research methods", "methodology", "approach", "technique"]
      },
      {
        question: "What are the main findings or results?",
        answer: "I'll highlight the primary discoveries, outcomes, and significant results presented in the research.",
        category: "Results",
        popularity: 85,
        keywords: ["findings", "results", "outcomes", "conclusions"]
      },
      {
        question: "What are the practical applications?",
        answer: "I'll identify how the concepts or findings can be applied in real-world scenarios or practical contexts.",
        category: "Applications",
        popularity: 75,
        keywords: ["applications", "practical", "real-world", "implementation"]
      },
      {
        question: "What are the limitations of this study?",
        answer: "I'll examine the document to identify any acknowledged limitations, constraints, or areas for future research.",
        category: "Analysis",
        popularity: 70,
        keywords: ["limitations", "constraints", "weaknesses", "gaps"]
      },
      {
        question: "How does this relate to other research?",
        answer: "I'll look for references to related work, comparisons with other studies, and how this research fits into the broader field.",
        category: "Context",
        popularity: 65,
        keywords: ["related research", "comparison", "context", "literature"]
      },
      {
        question: "What are the theoretical frameworks mentioned?",
        answer: "I'll identify the theoretical foundations, conceptual models, and frameworks that underpin the research.",
        category: "Theory",
        popularity: 60,
        keywords: ["theoretical framework", "theory", "model", "framework"]
      },
      {
        question: "What data sources were used?",
        answer: "I'll examine the document to identify the sources of data, datasets, or information used in the research.",
        category: "Data",
        popularity: 55,
        keywords: ["data sources", "dataset", "data", "sources"]
      },
      {
        question: "What are the future research directions?",
        answer: "I'll look for suggestions about future work, unanswered questions, and potential areas for further investigation.",
        category: "Future Work",
        popularity: 50,
        keywords: ["future research", "future work", "recommendations", "directions"]
      }
    ];

    // Only add default FAQs if they don't already exist
    defaultFAQs.forEach(faq => {
      if (!this.faqItems.some(item => item.question === faq.question)) {
        this.faqItems.push({
          ...faq,
          id: this.generateId(),
          lastAsked: new Date(),
          timesAsked: faq.popularity
        });
      }
    });

    this.saveToStorage();
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private loadFromStorage() {
    try {
      const storedFAQs = localStorage.getItem(this.STORAGE_KEY);
      const storedHistory = localStorage.getItem(this.HISTORY_KEY);
      
      if (storedFAQs) {
        this.faqItems = JSON.parse(storedFAQs).map((item: any) => ({
          ...item,
          lastAsked: new Date(item.lastAsked)
        }));
      }
      
      if (storedHistory) {
        this.questionHistory = JSON.parse(storedHistory).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load FAQ data from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.faqItems));
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(this.questionHistory));
    } catch (error) {
      console.error('Failed to save FAQ data to storage:', error);
    }
  }

  // Track when a question is asked
  trackQuestion(question: string) {
    const normalizedQuestion = question.toLowerCase().trim();
    
    // Add to history
    this.questionHistory.unshift({
      question,
      timestamp: new Date(),
      category: this.categorizeQuestion(normalizedQuestion)
    });

    // Keep only last 1000 questions
    if (this.questionHistory.length > 1000) {
      this.questionHistory = this.questionHistory.slice(0, 1000);
    }

    // Update existing FAQ or create new one
    const existingFAQ = this.findSimilarFAQ(normalizedQuestion);
    if (existingFAQ) {
      existingFAQ.timesAsked++;
      existingFAQ.lastAsked = new Date();
      existingFAQ.popularity = Math.min(100, existingFAQ.popularity + 1);
    } else if (this.shouldCreateFAQ(normalizedQuestion)) {
      this.createNewFAQ(question, normalizedQuestion);
    }

    this.saveToStorage();
  }

  private categorizeQuestion(question: string): string {
    const categoryKeywords = {
      'Summary': ['summarize', 'summary', 'main', 'topic', 'overview', 'about', 'key points'],
      'Research Methods': ['method', 'methodology', 'approach', 'technique', 'procedure'],
      'Results': ['results', 'findings', 'outcomes', 'conclusion', 'discovered'],
      'Analysis': ['analyze', 'analysis', 'examine', 'evaluate', 'assess', 'limitations'],
      'Applications': ['application', 'practical', 'use', 'implement', 'apply'],
      'Theory': ['theory', 'theoretical', 'framework', 'model', 'concept'],
      'Data': ['data', 'dataset', 'source', 'information', 'evidence'],
      'Context': ['context', 'background', 'related', 'comparison', 'literature'],
      'Future Work': ['future', 'recommendation', 'direction', 'further', 'next']
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => question.includes(keyword))) {
        return category;
      }
    }

    return 'General';
  }

  private findSimilarFAQ(question: string): FAQItem | undefined {
    return this.faqItems.find(faq => {
      const faqQuestion = faq.question.toLowerCase();
      return this.calculateSimilarity(question, faqQuestion) > 0.7;
    });
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    return intersection.length / union.length;
  }

  private shouldCreateFAQ(question: string): boolean {
    // Only create FAQ if question has been asked multiple times
    const recentQuestions = this.questionHistory
      .slice(0, 100)
      .map(h => h.question.toLowerCase());
    
    const similarQuestions = recentQuestions.filter(q => 
      this.calculateSimilarity(question, q) > 0.6
    );

    return similarQuestions.length >= 2;
  }

  private createNewFAQ(originalQuestion: string, normalizedQuestion: string) {
    const category = this.categorizeQuestion(normalizedQuestion);
    const keywords = this.extractKeywords(normalizedQuestion);
    
    this.faqItems.push({
      id: this.generateId(),
      question: originalQuestion,
      answer: `This is a frequently asked question. I'll analyze your documents to provide a comprehensive answer about ${keywords.slice(0, 3).join(', ')}.`,
      category,
      popularity: 5,
      keywords,
      lastAsked: new Date(),
      timesAsked: 1
    });
  }

  private extractKeywords(question: string): string[] {
    const stopWords = new Set(['what', 'how', 'why', 'when', 'where', 'who', 'is', 'are', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    return question
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10);
  }

  // Get popular questions
  getPopularQuestions(limit: number = 10): FAQItem[] {
    return [...this.faqItems]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  // Get questions by category
  getQuestionsByCategory(category: string): FAQItem[] {
    return this.faqItems
      .filter(faq => faq.category === category)
      .sort((a, b) => b.popularity - a.popularity);
  }

  // Get trending questions (asked recently and frequently)
  getTrendingQuestions(limit: number = 5): FAQItem[] {
    const recentThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
    
    return this.faqItems
      .filter(faq => faq.lastAsked >= recentThreshold)
      .sort((a, b) => {
        const aScore = b.timesAsked * (b.lastAsked.getTime() / Date.now());
        const bScore = a.timesAsked * (a.lastAsked.getTime() / Date.now());
        return bScore - aScore;
      })
      .slice(0, limit);
  }

  // Get question analytics
  getAnalytics(): QuestionAnalytics {
    const recentQuestions = this.questionHistory.slice(0, 100);
    
    // Extract keywords from recent questions
    const keywordCounts: Record<string, number> = {};
    recentQuestions.forEach(q => {
      this.extractKeywords(q.question.toLowerCase()).forEach(keyword => {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      });
    });

    const popularKeywords = Object.entries(keywordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Category distribution
    const categoryDistribution: Record<string, number> = {};
    recentQuestions.forEach(q => {
      const category = q.category || 'General';
      categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
    });

    // Recent trends
    const questionFrequency: Record<string, number> = {};
    recentQuestions.forEach(q => {
      const normalizedQ = q.question.toLowerCase().trim();
      questionFrequency[normalizedQ] = (questionFrequency[normalizedQ] || 0) + 1;
    });

    const recentTrends = Object.entries(questionFrequency)
      .filter(([, count]) => count > 1)
      .map(([question, count]) => ({
        question,
        count,
        trend: 'stable' as const // Could implement more sophisticated trend analysis
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalQuestions: this.questionHistory.length,
      popularKeywords,
      categoryDistribution,
      recentTrends
    };
  }

  // Get suggested questions based on context
  getSuggestedQuestions(context?: string, limit: number = 6): FAQItem[] {
    if (context) {
      const contextKeywords = this.extractKeywords(context.toLowerCase());
      
      // Score FAQs based on keyword overlap
      const scoredFAQs = this.faqItems.map(faq => {
        const overlap = faq.keywords.filter(keyword => 
          contextKeywords.some(ctx => ctx.includes(keyword) || keyword.includes(ctx))
        ).length;
        
        return {
          ...faq,
          score: overlap * faq.popularity
        };
      });

      return scoredFAQs
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    }

    return this.getPopularQuestions(limit);
  }

  // Get categories
  getCategories(): string[] {
    const categories = new Set(this.faqItems.map(faq => faq.category));
    return Array.from(categories).sort();
  }
}

export const faqSystem = new FAQSystem();