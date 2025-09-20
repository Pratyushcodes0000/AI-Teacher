// Enhanced question answering that leverages PDFRest extracted text
import { type ProcessedDocument, type TextChunk } from './pdfProcessor';

export interface EnhancedAnswerResult {
  answer: string;
  confidence: number;
  sources: Array<{
    document: string;
    page: number;
    excerpt: string;
    relevanceScore: number;
  }>;
  suggestedFollowUps: string[];
}

export class EnhancedQuestionAnswering {
  /**
   * Generate an enhanced answer using real extracted text
   */
  static generateAnswer(
    query: string,
    documents: ProcessedDocument[]
  ): EnhancedAnswerResult {
    const searchResults = this.performSemanticSearch(query, documents);
    
    if (searchResults.length === 0) {
      return {
        answer: this.generateNoResultsAnswer(query, documents),
        confidence: 0,
        sources: [],
        suggestedFollowUps: this.generateGenericFollowUps(documents)
      };
    }

    const answer = this.generateIntelligentAnswer(query, searchResults);
    const confidence = this.calculateConfidence(query, searchResults);
    const sources = this.formatSources(searchResults);
    const followUps = this.generateContextualFollowUps(query, searchResults);

    return {
      answer,
      confidence,
      sources,
      suggestedFollowUps: followUps
    };
  }

  /**
   * Perform enhanced semantic search across document content
   */
  private static performSemanticSearch(
    query: string,
    documents: ProcessedDocument[]
  ): Array<{ chunk: TextChunk; score: number; document: ProcessedDocument }> {
    const results: Array<{ chunk: TextChunk; score: number; document: ProcessedDocument }> = [];
    const queryLower = query.toLowerCase();
    const queryWords = this.extractQueryTerms(queryLower);
    
    for (const document of documents) {
      if (document.status !== 'ready') continue;
      
      for (const chunk of document.chunks) {
        const score = this.calculateSemanticScore(queryWords, chunk, document);
        
        if (score > 0) {
          results.push({ chunk, score, document });
        }
      }
    }
    
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 8); // Top results
  }

  /**
   * Calculate semantic relevance score with improved text processing
   */
  private static calculateSemanticScore(
    queryWords: string[],
    chunk: TextChunk,
    document: ProcessedDocument
  ): number {
    // Use cleaned text if available for better matching
    const content = chunk.content.toLowerCase();
    let score = 0;
    
    // Exact phrase matching (highest weight)
    const queryPhrase = queryWords.join(' ');
    if (content.includes(queryPhrase)) {
      score += 10;
    }
    
    // Individual word matching with position weight
    queryWords.forEach((word, index) => {
      if (content.includes(word)) {
        // Early words in query are more important
        const positionWeight = 1 + (queryWords.length - index) * 0.1;
        score += 3 * positionWeight;
        
        // Bonus for exact word boundaries
        const wordRegex = new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'i');
        if (wordRegex.test(content)) {
          score += 2 * positionWeight;
        }
      }
    });
    
    // Context-aware scoring
    score += this.getContextualScore(queryWords.join(' '), content);
    
    // Keyword density bonus
    const contentWords = content.split(/\s+/).length;
    const matchingWords = queryWords.filter(word => content.includes(word)).length;
    const density = matchingWords / Math.max(contentWords, 1);
    score += density * 5;
    
    // Document title relevance
    const documentName = document.name.toLowerCase();
    queryWords.forEach(word => {
      if (documentName.includes(word)) {
        score += 1;
      }
    });
    
    return score;
  }

  /**
   * Extract meaningful terms from query
   */
  private static extractQueryTerms(query: string): string[] {
    try {
      const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
        'from', 'about', 'what', 'how', 'when', 'where', 'why', 'who', 'which', 'that', 'this',
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
        'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall'
      ]);
      
      const terms = query
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word && word.length > 2 && !stopWords.has(word))
        .slice(0, 10); // Limit terms to prevent excessive processing
      
      return terms.length > 0 ? terms : ['query']; // Ensure we always return something
    } catch (error) {
      console.warn('Query term extraction failed:', error);
      return ['query'];
    }
  }

  /**
   * Get contextual score based on question patterns
   */
  private static getContextualScore(query: string, content: string): number {
    let score = 0;
    
    const patterns = [
      {
        queryPattern: /(what is|define|definition)/i,
        contentPattern: /(is a|is the|refers to|defined as|means)/i,
        weight: 4
      },
      {
        queryPattern: /(how does|how to|process|method)/i,
        contentPattern: /(process|method|approach|technique|procedure|steps)/i,
        weight: 4
      },
      {
        queryPattern: /(why|reason|because)/i,
        contentPattern: /(because|reason|due to|since|therefore|purpose)/i,
        weight: 4
      },
      {
        queryPattern: /(types|kinds|categories)/i,
        contentPattern: /(types|kinds|categories|include|main|primary)/i,
        weight: 4
      },
      {
        queryPattern: /(example|application|use)/i,
        contentPattern: /(example|application|used|practice|industry|case)/i,
        weight: 3
      },
      {
        queryPattern: /(benefit|advantage|pros)/i,
        contentPattern: /(benefit|advantage|strength|positive|improved)/i,
        weight: 3
      },
      {
        queryPattern: /(limitation|disadvantage|problem)/i,
        contentPattern: /(limitation|disadvantage|problem|issue|challenge)/i,
        weight: 3
      }
    ];
    
    for (const pattern of patterns) {
      if (pattern.queryPattern.test(query) && pattern.contentPattern.test(content)) {
        score += pattern.weight;
      }
    }
    
    return score;
  }

  /**
   * Generate intelligent answer based on search results
   */
  private static generateIntelligentAnswer(
    query: string,
    results: Array<{ chunk: TextChunk; score: number; document: ProcessedDocument }>
  ): string {
    if (results.length === 0) return "No relevant information found.";
    
    const queryLower = query.toLowerCase();
    const topResults = results.slice(0, 3);
    
    // Determine answer strategy based on query type
    if (queryLower.includes('summary') || queryLower.includes('overview')) {
      return this.generateSummaryAnswer(topResults);
    }
    
    if (queryLower.includes('compare') || queryLower.includes('difference')) {
      return this.generateComparisonAnswer(topResults);
    }
    
    if (queryLower.includes('list') || queryLower.includes('types') || queryLower.includes('kinds')) {
      return this.generateListAnswer(topResults);
    }
    
    // Default: contextual answer
    return this.generateContextualAnswer(query, topResults);
  }

  /**
   * Generate summary-style answer
   */
  private static generateSummaryAnswer(
    results: Array<{ chunk: TextChunk; score: number; document: ProcessedDocument }>
  ): string {
    const keyPoints = results.slice(0, 3).map(result => {
      const sentences = result.chunk.content.split(/[.!?]+/);
      return sentences.find(s => s.trim().length > 30)?.trim() || result.chunk.content.substring(0, 100);
    });
    
    let answer = "Based on the document content, here's a summary:\n\n";
    keyPoints.forEach((point, index) => {
      answer += `${index + 1}. ${point}\n`;
    });
    
    return answer;
  }

  /**
   * Generate comparison answer
   */
  private static generateComparisonAnswer(
    results: Array<{ chunk: TextChunk; score: number; document: ProcessedDocument }>
  ): string {
    if (results.length >= 2) {
      return `From the documents:\n\n**First perspective:** ${results[0].chunk.content}\n\n**Another perspective:** ${results[1].chunk.content}`;
    }
    
    return `According to the document: ${results[0].chunk.content}`;
  }

  /**
   * Generate list-style answer
   */
  private static generateListAnswer(
    results: Array<{ chunk: TextChunk; score: number; document: ProcessedDocument }>
  ): string {
    const content = results[0].chunk.content;
    
    // Try to extract list items
    const listPattern = /(?:•|\*|\d+\.|-)([^•\*\n]+)/g;
    const matches = content.match(listPattern);
    
    if (matches && matches.length > 1) {
      let answer = "According to the document:\n\n";
      matches.forEach((item, index) => {
        answer += `• ${item.replace(/^[•\*\d+\.-]\s*/, '').trim()}\n`;
      });
      return answer;
    }
    
    return `The document explains: ${content}`;
  }

  /**
   * Generate contextual answer
   */
  private static generateContextualAnswer(
    query: string,
    results: Array<{ chunk: TextChunk; score: number; document: ProcessedDocument }>
  ): string {
    const mainResult = results[0];
    const content = mainResult.chunk.content;
    const documentName = mainResult.document.name;
    
    // Find the most relevant sentence
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const queryWords = this.extractQueryTerms(query.toLowerCase());
    
    let bestSentence = sentences[0] || content.substring(0, 200);
    let maxRelevance = 0;
    
    for (const sentence of sentences) {
      const relevance = queryWords.filter(word => 
        sentence.toLowerCase().includes(word)
      ).length;
      
      if (relevance > maxRelevance) {
        maxRelevance = relevance;
        bestSentence = sentence;
      }
    }
    
    let answer = `According to **${documentName}**:\n\n${bestSentence.trim()}.`;
    
    // Add supporting information if available
    if (results.length > 1 && results[1].score > results[0].score * 0.7) {
      const supportingSentence = results[1].chunk.content.split(/[.!?]+/)[0];
      if (supportingSentence && supportingSentence.trim().length > 20) {
        answer += `\n\nAdditionally: ${supportingSentence.trim()}.`;
      }
    }
    
    return answer;
  }

  /**
   * Calculate confidence score
   */
  private static calculateConfidence(
    query: string,
    results: Array<{ chunk: TextChunk; score: number; document: ProcessedDocument }>
  ): number {
    if (results.length === 0) return 0;
    
    const topScore = results[0].score;
    const queryWords = this.extractQueryTerms(query.toLowerCase());
    
    // Base confidence from search score
    let confidence = Math.min(topScore / 10, 1);
    
    // Bonus for multiple good matches
    if (results.length > 1 && results[1].score > topScore * 0.8) {
      confidence += 0.1;
    }
    
    // Bonus for comprehensive query coverage
    const topContent = results[0].chunk.content.toLowerCase();
    const coverage = queryWords.filter(word => topContent.includes(word)).length / queryWords.length;
    confidence += coverage * 0.2;
    
    return Math.min(confidence, 1);
  }

  /**
   * Format sources for display
   */
  private static formatSources(
    results: Array<{ chunk: TextChunk; score: number; document: ProcessedDocument }>
  ): Array<{ document: string; page: number; excerpt: string; relevanceScore: number }> {
    return results.slice(0, 3).map(result => ({
      document: result.document.name,
      page: result.chunk.page,
      excerpt: result.chunk.content.length > 150 
        ? result.chunk.content.substring(0, 150) + '...'
        : result.chunk.content,
      relevanceScore: Math.round(result.score * 10) / 10
    }));
  }

  /**
   * Generate contextual follow-up questions
   */
  private static generateContextualFollowUps(
    query: string,
    results: Array<{ chunk: TextChunk; score: number; document: ProcessedDocument }>
  ): string[] {
    const followUps: string[] = [];
    const queryLower = query.toLowerCase();
    const topResult = results[0];
    
    if (topResult) {
      const content = topResult.chunk.content.toLowerCase();
      
      // Query-type specific follow-ups
      if (queryLower.includes('what is')) {
        followUps.push(`How does ${this.extractMainTopic(query)} work?`);
        followUps.push(`What are the applications of ${this.extractMainTopic(query)}?`);
      } else if (queryLower.includes('how')) {
        followUps.push(`What are the benefits of this approach?`);
        followUps.push(`What challenges might arise?`);
      } else if (queryLower.includes('why')) {
        followUps.push(`What are the implications of this?`);
        followUps.push(`How does this compare to alternatives?`);
      }
      
      // Content-based follow-ups
      if (content.includes('method') || content.includes('approach')) {
        followUps.push("What are the steps involved in this method?");
      }
      
      if (content.includes('result') || content.includes('finding')) {
        followUps.push("What were the key findings?");
        followUps.push("How significant are these results?");
      }
      
      if (content.includes('application') || content.includes('use')) {
        followUps.push("What are some real-world examples?");
      }
    }
    
    // Generic useful follow-ups
    followUps.push("Can you provide more details about this topic?");
    followUps.push("What else should I know about this subject?");
    
    return [...new Set(followUps)].slice(0, 4); // Remove duplicates, limit to 4
  }

  /**
   * Generate follow-ups when no results found
   */
  private static generateGenericFollowUps(documents: ProcessedDocument[]): string[] {
    const followUps = [
      "What are the main topics covered in my documents?",
      "Can you summarize the key points?",
      "What type of document did I upload?",
      "What questions can I ask about this content?"
    ];
    
    return followUps;
  }

  /**
   * Generate answer when no results found
   */
  private static generateNoResultsAnswer(query: string, documents: ProcessedDocument[]): string {
    const readyDocs = documents.filter(doc => doc.status === 'ready');
    
    if (readyDocs.length === 0) {
      return "I don't have any processed documents to search through yet. Please upload and wait for documents to be processed.";
    }
    
    return `I couldn't find specific information about "${query}" in your uploaded documents. This might be because:

• The content doesn't directly address this topic
• Different terminology is used in the documents
• The information might be in a section I haven't indexed yet

Try rephrasing your question with different keywords, or ask me about the main topics covered in your documents.`;
  }

  /**
   * Extract main topic from query
   */
  private static extractMainTopic(query: string): string {
    const words = this.extractQueryTerms(query);
    return words.slice(-2).join(' ') || 'this topic';
  }

  /**
   * Escape regex special characters
   */
  private static escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}