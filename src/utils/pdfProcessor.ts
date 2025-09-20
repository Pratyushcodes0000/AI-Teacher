// Enhanced PDF processor with PDFRest API integration and text cleaning
// Uses real text extraction from PDF documents with advanced text processing

import { extractTextWithFallback } from './pdfRestExtractor';
import { TextProcessor } from './textProcessor';

export interface ExtractedPage {
  page: number;
  text: string;
}

export interface TextChunk {
  content: string;
  page: number;
  chunkIndex: number;
  keywords: string[];
}

export interface ProcessedDocument {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
  status: 'processing' | 'ready' | 'error';
  pageCount: number;
  pages: ExtractedPage[];
  chunks: TextChunk[];
  fullText: string;
  cleanedFullText?: string;
  processingQuality?: number;
  textImprovements?: string[];
}

class PDFProcessor {
  private documents: Map<string, ProcessedDocument> = new Map();

  async processFile(file: File): Promise<{ id: string; document: ProcessedDocument }> {
    const id = Math.random().toString(36).substr(2, 9);
    
    const document: ProcessedDocument = {
      id,
      name: file.name,
      size: file.size,
      uploadedAt: new Date(),
      status: 'processing',
      pageCount: 0,
      pages: [],
      chunks: [],
      fullText: ''
    };

    this.documents.set(id, document);

    try {
      console.log('Starting real PDF text extraction for:', file.name);
      
      // Extract actual text from PDF using PDFRest API with fallback
      const extractedData = await extractTextWithFallback(file);
      const pages = extractedData.pages;
      const fullText = extractedData.fullText;
      const pageCount = extractedData.pageCount;
      
      console.log(`PDF text extraction completed: ${pageCount} pages, ${fullText.length} characters`);

      // Apply advanced text processing and cleaning
      console.log('Applying text cleaning and processing...');
      const textProcessingResult = TextProcessor.prepareForQA(fullText);
      const cleanedFullText = textProcessingResult.cleanedText;
      
      console.log(`Text processing completed: ${fullText.length} → ${cleanedFullText.length} characters`);
      if (textProcessingResult.improvements.length > 0) {
        console.log('Text improvements applied:', textProcessingResult.improvements);
      }

      // Process pages with cleaned text
      const cleanedPages = pages.map(page => ({
        ...page,
        text: TextProcessor.quickClean(page.text)
      }));

      // Create text chunks for better search using cleaned text
      const chunks = this.createTextChunks(cleanedPages);
      
      // Calculate text quality score
      const qualityScore = this.calculateTextQuality(cleanedFullText);

      // Update document with cleaned text and processing info
      const processedDocument: ProcessedDocument = {
        ...document,
        status: 'ready',
        pageCount,
        pages: cleanedPages,
        chunks,
        fullText,
        cleanedFullText,
        processingQuality: qualityScore,
        textImprovements: textProcessingResult.improvements
      };

      this.documents.set(id, processedDocument);
      
      console.log(`PDF processing complete: ${pageCount} pages, ${chunks.length} chunks`);
      
      return { id, document: processedDocument };
      
    } catch (error) {
      console.error('PDF processing error:', error);
      const errorDocument: ProcessedDocument = {
        ...document,
        status: 'error'
      };
      this.documents.set(id, errorDocument);
      throw new Error(`Failed to process PDF: ${error.message}`);
    }
  }

  private generateSampleContent(filename: string): { pages: ExtractedPage[]; fullText: string } {
    // Generate different content based on filename
    const name = filename.toLowerCase();
    
    let content: string[] = [];
    
    if (name.includes('machine') || name.includes('ml') || name.includes('ai')) {
      content = [
        "Machine Learning: Introduction and Fundamentals. Machine learning is a subset of artificial intelligence (AI) that enables computers to learn and make decisions from data without being explicitly programmed for every task. It has become one of the most important technologies in modern computing, revolutionizing industries from healthcare to finance.",
        "Types of Machine Learning. There are three main types of machine learning: supervised learning, unsupervised learning, and reinforcement learning. Supervised learning uses labeled data to train models that can make predictions on new, unseen data. Common supervised learning tasks include classification (predicting categories) and regression (predicting continuous values).",
        "Unsupervised Learning and Applications. Unsupervised learning algorithms find hidden patterns in data without labeled examples. Key techniques include clustering (grouping similar data points), dimensionality reduction (simplifying data while preserving important features), and association rule learning (finding relationships between different variables).",
        "Machine Learning Applications. Machine learning has numerous applications across various industries. In healthcare, it's used for medical image analysis, drug discovery, and personalized treatment plans. In finance, algorithms detect fraud, assess credit risk, and enable algorithmic trading. Other applications include autonomous vehicles, natural language processing, computer vision, and recommendation systems."
      ];
    } else if (name.includes('data') || name.includes('analytics')) {
      content = [
        "Data Analytics: Foundations and Principles. Data analytics is the process of examining datasets to draw conclusions about the information they contain. It involves applying algorithmic or mechanical processes to derive insights and running through several data sets to look for meaningful correlations.",
        "Types of Data Analytics. There are four main types of analytics: descriptive analytics (what happened), diagnostic analytics (why it happened), predictive analytics (what will happen), and prescriptive analytics (what should be done). Each type serves different business needs and requires different analytical approaches.",
        "Data Collection and Preparation. The quality of data analytics depends heavily on data quality and preparation. This includes data cleaning, handling missing values, outlier detection, and data transformation. Poor data quality can lead to incorrect conclusions and poor business decisions.",
        "Statistical Methods and Tools. Common statistical methods used in data analytics include regression analysis, hypothesis testing, correlation analysis, and time series analysis. Popular tools include Python with pandas and scikit-learn, R for statistical computing, SQL for database queries, and visualization tools like Tableau and PowerBI."
      ];
    } else if (name.includes('research') || name.includes('academic')) {
      content = [
        "Research Methodology: Systematic Approaches to Knowledge Discovery. Research methodology encompasses the systematic processes and procedures used to conduct scientific research. It provides a framework for collecting, analyzing, and interpreting data to answer research questions and test hypotheses.",
        "Quantitative vs Qualitative Research. Quantitative research focuses on numerical data and statistical analysis to test hypotheses and measure relationships between variables. Qualitative research explores meanings, experiences, and social phenomena through methods like interviews, observations, and content analysis.",
        "Research Design and Planning. A well-designed research study requires careful planning of the research question, methodology, data collection procedures, and analysis plan. This includes consideration of ethical issues, sample size, validity, and reliability of measurements.",
        "Data Analysis and Interpretation. Research data analysis involves applying appropriate statistical or analytical methods to test hypotheses and answer research questions. This includes descriptive statistics, inferential testing, and interpretation of results in the context of existing knowledge and theory."
      ];
    } else {
      // Generic academic content
      content = [
        "Academic Research and Learning: An Introduction. Academic research forms the foundation of knowledge advancement across all disciplines. It involves systematic investigation, critical thinking, and evidence-based conclusions that contribute to our understanding of various subjects and phenomena.",
        "Critical Thinking and Analysis. Critical thinking is essential for academic success and involves the ability to analyze information objectively, evaluate evidence, identify assumptions, and draw logical conclusions. It requires questioning existing knowledge and approaching problems from multiple perspectives.",
        "Research Methods and Data Collection. Academic research employs various methodologies depending on the field of study. These include experimental designs, observational studies, surveys, case studies, and literature reviews. Each method has its strengths and limitations for different types of research questions.",
        "Knowledge Synthesis and Application. The ultimate goal of academic research is to synthesize new knowledge and apply it to solve real-world problems. This involves connecting theoretical concepts with practical applications and communicating findings effectively to both academic and general audiences."
      ];
    }
    
    const pages: ExtractedPage[] = content.map((text, index) => ({
      page: index + 1,
      text: text
    }));
    
    const fullText = content.join('\n\n');
    
    return { pages, fullText };
  }

  private createTextChunks(pages: ExtractedPage[], maxChunkSize = 500): TextChunk[] {
    const chunks: TextChunk[] = [];
    let chunkIndex = 0;

    for (const page of pages) {
      if (!page.text || page.text.length === 0) continue;
      
      const sentences = page.text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      let currentChunk = '';
      
      for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
        if (trimmedSentence.length === 0) continue;
        
        // If adding this sentence would exceed maxChunkSize, save current chunk and start new one
        if (currentChunk.length + trimmedSentence.length > maxChunkSize && currentChunk.length > 0) {
          chunks.push({
            content: currentChunk.trim(),
            page: page.page,
            chunkIndex: chunkIndex++,
            keywords: this.extractKeywords(currentChunk)
          });
          currentChunk = trimmedSentence + '. ';
        } else {
          currentChunk += trimmedSentence + '. ';
        }
      }
      
      // Add remaining chunk if it has content
      if (currentChunk.trim().length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          page: page.page,
          chunkIndex: chunkIndex++,
          keywords: this.extractKeywords(currentChunk)
        });
      }
    }
    
    return chunks;
  }

  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !/^\d+$/.test(word)) // Remove pure numbers
      .slice(0, 20); // Limit keywords per chunk
  }

  getDocument(id: string): ProcessedDocument | undefined {
    return this.documents.get(id);
  }

  getAllDocuments(): ProcessedDocument[] {
    return Array.from(this.documents.values());
  }

  deleteDocument(id: string): boolean {
    return this.documents.delete(id);
  }

  searchDocuments(query: string): Array<{ chunk: TextChunk; score: number; document: ProcessedDocument }> {
    const results: Array<{ chunk: TextChunk; score: number; document: ProcessedDocument }> = [];
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
    
    // Create search terms including synonyms and related terms
    const expandedTerms = this.expandSearchTerms(queryWords);
    
    for (const document of this.documents.values()) {
      if (document.status !== 'ready') continue;
      
      for (const chunk of document.chunks) {
        let score = 0;
        const content = chunk.content.toLowerCase();
        
        // Score based on exact query phrase
        if (content.includes(queryLower)) {
          score += 5;
        }
        
        // Score based on individual keyword matches
        for (const queryWord of queryWords) {
          if (content.includes(queryWord)) {
            score += 2;
            
            // Bonus for word boundaries (exact word matches)
            const wordRegex = new RegExp(`\\b${queryWord}\\b`, 'i');
            if (wordRegex.test(content)) {
              score += 1;
            }
          }
        }
        
        // Score based on expanded terms
        for (const term of expandedTerms) {
          if (content.includes(term) && !queryWords.includes(term)) {
            score += 1;
          }
        }
        
        // Contextual scoring based on question types
        score += this.getContextualScore(queryLower, content);
        
        // Bonus for keyword density
        const totalWords = content.split(/\s+/).length;
        const matchedWords = queryWords.filter(word => content.includes(word)).length;
        const density = matchedWords / Math.max(totalWords, 1);
        score += density * 2;
        
        if (score > 0) {
          results.push({ chunk, score, document });
        }
      }
    }
    
    // Sort by relevance and return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }

  private expandSearchTerms(queryWords: string[]): string[] {
    const synonyms: Record<string, string[]> = {
      'machine': ['ml', 'artificial', 'automated'],
      'learning': ['training', 'education', 'study'],
      'data': ['information', 'dataset', 'statistics'],
      'analysis': ['analytics', 'examination', 'evaluation'],
      'research': ['study', 'investigation', 'academic'],
      'method': ['approach', 'technique', 'procedure'],
      'process': ['procedure', 'steps', 'workflow'],
      'application': ['use', 'usage', 'implementation'],
      'type': ['kind', 'category', 'classification'],
      'algorithm': ['method', 'technique', 'approach']
    };
    
    const expanded: string[] = [];
    for (const word of queryWords) {
      if (synonyms[word]) {
        expanded.push(...synonyms[word]);
      }
    }
    return expanded;
  }

  private getContextualScore(query: string, content: string): number {
    let score = 0;
    
    // Definition questions
    if (query.includes('what is') || query.includes('define')) {
      if (content.match(/is (a|an|the)/) || content.includes('definition') || content.includes('refers to')) {
        score += 3;
      }
    }
    
    // Process/method questions
    if (query.includes('how') || query.includes('process') || query.includes('method')) {
      if (content.includes('process') || content.includes('method') || content.includes('approach') || 
          content.includes('technique') || content.includes('procedure')) {
        score += 3;
      }
    }
    
    // Reason/explanation questions
    if (query.includes('why') || query.includes('reason')) {
      if (content.includes('because') || content.includes('reason') || content.includes('due to') || 
          content.includes('purpose') || content.includes('since')) {
        score += 3;
      }
    }
    
    // Type/category questions
    if (query.includes('type') || query.includes('kind') || query.includes('category')) {
      if (content.includes('type') || content.includes('kind') || content.includes('category') || 
          content.includes('include') || content.match(/main|primary|key/)) {
        score += 3;
      }
    }
    
    // Application/example questions
    if (query.includes('application') || query.includes('example') || query.includes('use')) {
      if (content.includes('application') || content.includes('used') || content.includes('example') || 
          content.includes('industry') || content.includes('practice')) {
        score += 3;
      }
    }
    
    return score;
  }

  /**
   * Calculate text quality score based on various factors
   */
  private calculateTextQuality(text: string): number {
    let score = 0.5; // Base score

    // Word count (good indicator of substantial content)
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount > 100) score += 0.1;
    if (wordCount > 500) score += 0.1;
    if (wordCount > 1000) score += 0.1;

    // Sentence structure (good if we have proper sentences)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0;
    if (avgSentenceLength > 8 && avgSentenceLength < 30) score += 0.1;

    // Character variety (good if we have diverse vocabulary)
    const uniqueChars = new Set(text.toLowerCase()).size;
    if (uniqueChars > 20) score += 0.1;

    // Absence of artifacts (penalize excessive special characters)
    const specialChars = (text.match(/[^\w\s.,!?;:'"()\-–—]/g) || []).length;
    const specialCharRatio = specialChars / Math.max(text.length, 1);
    if (specialCharRatio < 0.01) score += 0.1;
    else if (specialCharRatio > 0.05) score -= 0.1;

    // Academic indicators (bonus for academic content)
    const academicTerms = ['research', 'analysis', 'methodology', 'results', 'conclusion', 'study', 'findings', 'evidence'];
    const academicMatches = academicTerms.filter(term => text.toLowerCase().includes(term)).length;
    if (academicMatches > 2) score += 0.1;

    return Math.max(0, Math.min(1, score));
  }

  generateAnswer(query: string): { answer: string; sources: Array<{ document: string; page: number; excerpt: string }> } {
    try {
      // Use enhanced question answering for better results with real extracted text
      const { EnhancedQuestionAnswering } = require('./enhancedQuestionAnswering');
      
      const documents = this.getAllDocuments();
      
      // Safety check: ensure we have valid documents
      if (!documents || documents.length === 0) {
        return {
          answer: "No documents are currently available for analysis. Please upload and process some documents first.",
          sources: []
        };
      }
      
      const result = EnhancedQuestionAnswering.generateAnswer(query, documents);
      
      // Format sources to match expected interface
      const sources = result.sources.map(source => ({
        document: source.document,
        page: source.page,
        excerpt: source.excerpt
      }));
      
      // Enhance answer with confidence and follow-ups
      let enhancedAnswer = result.answer;
      
      if (result.confidence > 0.7) {
        enhancedAnswer += '\n\n*High confidence answer based on document content*';
      } else if (result.confidence > 0.4) {
        enhancedAnswer += '\n\n*Moderate confidence - you may want to ask for clarification*';
      }
      
      if (result.suggestedFollowUps && result.suggestedFollowUps.length > 0) {
        enhancedAnswer += '\n\n**Follow-up questions you might ask:**\n';
        result.suggestedFollowUps.slice(0, 3).forEach((followUp, index) => {
          enhancedAnswer += `${index + 1}. ${followUp}\n`;
        });
      }
      
      return { answer: enhancedAnswer, sources };
      
    } catch (enhancedError) {
      console.error('Enhanced question answering failed, using fallback:', enhancedError);
      
      // Fallback to simple search
      const searchResults = this.searchDocuments(query);
      
      if (searchResults.length === 0) {
        return {
          answer: `I couldn't find specific information about "${query}" in the uploaded documents. Please try rephrasing your question with different keywords.`,
          sources: []
        };
      }
      
      const topResult = searchResults[0];
      const sources = searchResults.slice(0, 3).map(result => ({
        document: result.document.name,
        page: result.chunk.page,
        excerpt: result.chunk.content.length > 120 
          ? result.chunk.content.substring(0, 120) + '...'
          : result.chunk.content
      }));
      
      return {
        answer: `Based on your documents: ${topResult.chunk.content}`,
        sources
      };
    }
  }

  private generateIntelligentAnswer(
    originalQuery: string, 
    queryLower: string, 
    results: Array<{ chunk: TextChunk; score: number; document: ProcessedDocument }>
  ): string {
    if (results.length === 0) return "No relevant information found.";

    const topResult = results[0];
    const allContent = results.map(r => r.chunk.content).join(' ');
    
    // Detect question type and generate appropriate response
    if (queryLower.includes('what is') || queryLower.includes('define') || queryLower.includes('definition')) {
      // Definition questions
      const content = topResult.chunk.content;
      if (content.includes('is a') || content.includes('is the') || content.includes('refers to')) {
        return `${content}`;
      }
      return `According to the document, ${content}`;
      
    } else if (queryLower.includes('what are') && (queryLower.includes('types') || queryLower.includes('kinds') || queryLower.includes('categories'))) {
      // Types/categories questions
      const typeContent = results.filter(r => 
        r.chunk.content.toLowerCase().includes('type') || 
        r.chunk.content.toLowerCase().includes('kind') || 
        r.chunk.content.toLowerCase().includes('include') ||
        r.chunk.content.toLowerCase().includes('categories')
      );
      
      if (typeContent.length > 0) {
        return `Based on the documents: ${typeContent[0].chunk.content}`;
      }
      return `The document mentions: ${topResult.chunk.content}`;
      
    } else if (queryLower.includes('how') || queryLower.includes('process') || queryLower.includes('method') || queryLower.includes('steps')) {
      // Process/method questions
      const processContent = results.filter(r => {
        const content = r.chunk.content.toLowerCase();
        return content.includes('process') || content.includes('method') || 
               content.includes('step') || content.includes('approach') ||
               content.includes('technique') || content.includes('procedure');
      });
      
      if (processContent.length > 0) {
        return `Here's what the document explains: ${processContent[0].chunk.content}`;
      }
      return `According to the available information: ${topResult.chunk.content}`;
      
    } else if (queryLower.includes('why') || queryLower.includes('reason') || queryLower.includes('purpose') || queryLower.includes('because')) {
      // Reason/explanation questions
      const explanationContent = results.filter(r => {
        const content = r.chunk.content.toLowerCase();
        return content.includes('because') || content.includes('reason') || 
               content.includes('purpose') || content.includes('due to') ||
               content.includes('since') || content.includes('therefore');
      });
      
      if (explanationContent.length > 0) {
        return `The documents explain: ${explanationContent[0].chunk.content}`;
      }
      return `Based on the context: ${topResult.chunk.content}`;
      
    } else if (queryLower.includes('application') || queryLower.includes('use') || queryLower.includes('example')) {
      // Application/example questions
      const applicationContent = results.filter(r => {
        const content = r.chunk.content.toLowerCase();
        return content.includes('application') || content.includes('used') || 
               content.includes('example') || content.includes('practice') ||
               content.includes('industry') || content.includes('field');
      });
      
      if (applicationContent.length > 0) {
        return `The document describes these applications: ${applicationContent[0].chunk.content}`;
      }
      return `According to the material: ${topResult.chunk.content}`;
      
    } else if (queryLower.includes('compare') || queryLower.includes('difference') || queryLower.includes('versus') || queryLower.includes('vs')) {
      // Comparison questions
      if (results.length >= 2) {
        return `From the documents: ${results[0].chunk.content} In comparison, ${results[1].chunk.content}`;
      }
      return `The document provides this information: ${topResult.chunk.content}`;
      
    } else if (queryLower.includes('advantage') || queryLower.includes('benefit') || queryLower.includes('disadvantage') || queryLower.includes('limitation')) {
      // Pros/cons questions
      const proConContent = results.filter(r => {
        const content = r.chunk.content.toLowerCase();
        return content.includes('advantage') || content.includes('benefit') || 
               content.includes('disadvantage') || content.includes('limitation') ||
               content.includes('strength') || content.includes('weakness');
      });
      
      if (proConContent.length > 0) {
        return `The document notes: ${proConContent[0].chunk.content}`;
      }
      return `According to the text: ${topResult.chunk.content}`;
      
    } else if (queryLower.includes('summary') || queryLower.includes('summarize') || queryLower.includes('overview')) {
      // Summary questions
      if (results.length >= 2) {
        const combinedContent = results.slice(0, 2).map(r => {
          // Extract key sentences
          const sentences = r.chunk.content.split('.').filter(s => s.trim().length > 20);
          return sentences[0] + '.';
        }).join(' ');
        return `Here's a summary from the documents: ${combinedContent}`;
      }
      return `Summary from the document: ${topResult.chunk.content}`;
      
    } else {
      // General questions - provide contextual answer
      let answer = '';
      
      // Try to extract the most relevant sentence
      const sentences = topResult.chunk.content.split(/[.!?]+/).filter(s => s.trim().length > 20);
      if (sentences.length > 0) {
        // Find sentence that best matches the query
        const queryWords = originalQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        let bestSentence = sentences[0];
        let maxMatches = 0;
        
        for (const sentence of sentences) {
          const sentenceLower = sentence.toLowerCase();
          const matches = queryWords.filter(word => sentenceLower.includes(word)).length;
          if (matches > maxMatches) {
            maxMatches = matches;
            bestSentence = sentence;
          }
        }
        
        answer = `According to the document: ${bestSentence.trim()}.`;
        
        // Add additional context if available
        if (results.length > 1) {
          const additionalSentence = results[1].chunk.content.split(/[.!?]+/)[0];
          if (additionalSentence && additionalSentence.trim().length > 20) {
            answer += ` Additionally, ${additionalSentence.trim()}.`;
          }
        }
      } else {
        answer = `Based on your documents: ${topResult.chunk.content}`;
      }
      
      return answer;
    }
  }
}

export const pdfProcessor = new PDFProcessor();