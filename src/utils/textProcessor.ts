/**
 * Advanced text processing and cleaning utility
 * Removes discrepancies from extracted PDF text and improves quality for question answering
 */

export interface TextProcessingOptions {
  removeOCRErrors?: boolean;
  standardizeFormatting?: boolean;
  fixEncoding?: boolean;
  normalizeWhitespace?: boolean;
  preserveStructure?: boolean;
  expandAcronyms?: boolean;
}

export interface ProcessedTextResult {
  cleanedText: string;
  originalLength: number;
  processedLength: number;
  improvementsApplied: string[];
  qualityScore: number;
  sections?: Array<{
    title: string;
    content: string;
    startIndex: number;
    endIndex: number;
  }>;
}

export class TextProcessor {
  private static commonOCRErrors = new Map([
    // Common OCR misrecognitions
    ['rn', 'm'], ['vv', 'w'], ['cl', 'd'], ['II', 'll'], ['1l', 'll'], ['0', 'O'],
    ['5', 'S'], ['8', 'B'], ['6', 'G'], ['1', 'I'], ['2', 'Z'], ['€', 'C'],
    // Unicode issues
    ['â€™', "'"], ['â€œ', '"'], ['â€\x9d', '"'], ['â€"', '–'], ['â€"', '—'],
    // Common spacing issues
    ['  ', ' '], ['   ', ' '], ['\t', ' '], [' \n', '\n'], ['\n ', '\n'],
    // Broken ligatures
    ['ﬁ', 'fi'], ['ﬂ', 'fl'], ['ﬀ', 'ff'], ['ﬃ', 'ffi'], ['ﬄ', 'ffl'],
    // Mathematical symbols often misread
    ['α', 'alpha'], ['β', 'beta'], ['γ', 'gamma'], ['δ', 'delta'], ['ε', 'epsilon'],
    ['θ', 'theta'], ['λ', 'lambda'], ['μ', 'mu'], ['π', 'pi'], ['σ', 'sigma'], ['φ', 'phi']
  ]);

  private static academicAcronyms = new Map([
    ['AI', 'Artificial Intelligence'], ['ML', 'Machine Learning'], ['NLP', 'Natural Language Processing'],
    ['CV', 'Computer Vision'], ['DL', 'Deep Learning'], ['NN', 'Neural Network'],
    ['CNN', 'Convolutional Neural Network'], ['RNN', 'Recurrent Neural Network'],
    ['LSTM', 'Long Short-Term Memory'], ['GAN', 'Generative Adversarial Network'],
    ['API', 'Application Programming Interface'], ['HTTP', 'HyperText Transfer Protocol'],
    ['URL', 'Uniform Resource Locator'], ['PDF', 'Portable Document Format'],
    ['RGB', 'Red Green Blue'], ['CPU', 'Central Processing Unit'], ['GPU', 'Graphics Processing Unit'],
    ['RAM', 'Random Access Memory'], ['SSD', 'Solid State Drive'], ['HDD', 'Hard Disk Drive'],
    ['UI', 'User Interface'], ['UX', 'User Experience'], ['IoT', 'Internet of Things'],
    ['VR', 'Virtual Reality'], ['AR', 'Augmented Reality'], ['MR', 'Mixed Reality']
  ]);

  /**
   * Main text processing function
   */
  static processText(
    text: string,
    options: TextProcessingOptions = {}
  ): ProcessedTextResult {
    const defaultOptions: TextProcessingOptions = {
      removeOCRErrors: true,
      standardizeFormatting: true,
      fixEncoding: true,
      normalizeWhitespace: true,
      preserveStructure: true,
      expandAcronyms: false
    };

    const config = { ...defaultOptions, ...options };
    const improvements: string[] = [];
    let processedText = text;
    const originalLength = text.length;

    try {
      // Step 1: Fix encoding issues
      if (config.fixEncoding) {
        const beforeLength = processedText.length;
        processedText = this.fixEncodingIssues(processedText);
        if (processedText.length !== beforeLength) {
          improvements.push('Fixed text encoding issues');
        }
      }

      // Step 2: Remove OCR errors
      if (config.removeOCRErrors) {
        const beforeText = processedText;
        processedText = this.correctOCRErrors(processedText);
        if (beforeText !== processedText) {
          improvements.push('Corrected OCR recognition errors');
        }
      }

      // Step 3: Normalize whitespace
      if (config.normalizeWhitespace) {
        const beforeText = processedText;
        processedText = this.normalizeWhitespace(processedText);
        if (beforeText !== processedText) {
          improvements.push('Normalized whitespace and line breaks');
        }
      }

      // Step 4: Standardize formatting
      if (config.standardizeFormatting) {
        const beforeText = processedText;
        processedText = this.standardizeFormatting(processedText);
        if (beforeText !== processedText) {
          improvements.push('Standardized text formatting');
        }
      }

      // Step 5: Expand acronyms (optional)
      if (config.expandAcronyms) {
        const beforeText = processedText;
        processedText = this.expandAcronyms(processedText);
        if (beforeText !== processedText) {
          improvements.push('Expanded common acronyms');
        }
      }

      // Step 6: Extract structure (if requested)
      let sections;
      if (config.preserveStructure) {
        sections = this.extractDocumentStructure(processedText);
        if (sections.length > 0) {
          improvements.push('Identified document structure');
        }
      }

      // Calculate quality score
      const qualityScore = this.calculateTextQuality(processedText, originalLength);

      return {
        cleanedText: processedText,
        originalLength,
        processedLength: processedText.length,
        improvementsApplied: improvements,
        qualityScore,
        sections
      };

    } catch (error) {
      console.warn('Error during text processing:', error);
      return {
        cleanedText: text, // Return original on error
        originalLength,
        processedLength: text.length,
        improvementsApplied: ['Error occurred during processing'],
        qualityScore: 0.5,
        sections: []
      };
    }
  }

  /**
   * Fix common encoding issues
   */
  private static fixEncodingIssues(text: string): string {
    let cleaned = text;

    // Fix UTF-8 encoding issues
    const encodingFixes = [
      [/â€™/g, "'"], [/â€œ/g, '"'], [/â€\x9d/g, '"'], [/â€"/g, '–'], [/â€"/g, '—'],
      [/Â/g, ''], [/â€¢/g, '•'], [/â€¦/g, '…'], [/Ã¡/g, 'á'], [/Ã©/g, 'é'],
      [/Ã­/g, 'í'], [/Ã³/g, 'ó'], [/Ãº/g, 'ú'], [/Ã±/g, 'ñ'], [/Ã§/g, 'ç'],
      // Remove invalid Unicode characters
      [/[\uFFFD\uFEFF]/g, ''], [/\u0000/g, '']
    ];

    for (const [pattern, replacement] of encodingFixes) {
      cleaned = cleaned.replace(pattern, replacement);
    }

    // Normalize Unicode
    try {
      cleaned = cleaned.normalize('NFKC');
    } catch (error) {
      console.warn('Unicode normalization failed:', error);
    }

    return cleaned;
  }

  /**
   * Correct common OCR errors
   */
  private static correctOCRErrors(text: string): string {
    let cleaned = text;

    // Apply common OCR error corrections
    for (const [error, correction] of this.commonOCRErrors) {
      const regex = new RegExp(this.escapeRegex(error), 'g');
      cleaned = cleaned.replace(regex, correction);
    }

    // Fix broken word patterns
    const wordFixes = [
      // Words broken by line breaks
      [/(\w)-\s*\n\s*(\w)/g, '$1$2'],
      // Multiple spaces within words (OCR artifacts)
      [/(\w)\s+(\w)/g, '$1$2'],
      // Common punctuation errors
      [/\s+([,.;:!?])/g, '$1'],
      [/([.!?])\s*([A-Z])/g, '$1 $2'],
      // Fix spaced numbers
      [/(\d)\s+(\d)/g, '$1$2'],
      // Fix broken URLs and emails
      [/(https?:\/\/)\s+/g, '$1'],
      [/(\w+@)\s+(\w+\.\w+)/g, '$1$2']
    ];

    for (const [pattern, replacement] of wordFixes) {
      cleaned = cleaned.replace(pattern, replacement);
    }

    return cleaned;
  }

  /**
   * Normalize whitespace and line breaks
   */
  private static normalizeWhitespace(text: string): string {
    return text
      // Normalize different types of spaces
      .replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
      // Fix multiple spaces
      .replace(/[ \t]+/g, ' ')
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Fix excessive line breaks but preserve paragraph structure
      .replace(/\n{3,}/g, '\n\n')
      // Remove trailing whitespace from lines
      .replace(/[ \t]+$/gm, '')
      // Remove leading/trailing whitespace
      .trim();
  }

  /**
   * Standardize formatting
   */
  private static standardizeFormatting(text: string): string {
    let formatted = text;

    // Standardize quotation marks
    formatted = formatted
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      // Standardize dashes
      .replace(/[‒–—]/g, '–')
      // Standardize ellipsis
      .replace(/\.{3,}/g, '…')
      // Fix spacing around punctuation
      .replace(/\s+([,.;:!?])/g, '$1')
      .replace(/([.!?])([A-Z])/g, '$1 $2')
      // Standardize bullet points
      .replace(/[•▪▫‣⁃]/g, '•')
      // Remove excessive punctuation
      .replace(/[.]{4,}/g, '...')
      .replace(/[!]{2,}/g, '!')
      .replace(/[?]{2,}/g, '?');

    return formatted;
  }

  /**
   * Expand common acronyms for better understanding
   */
  private static expandAcronyms(text: string): string {
    let expanded = text;

    for (const [acronym, expansion] of this.academicAcronyms) {
      // Only expand if the acronym appears in isolation (word boundaries)
      const regex = new RegExp(`\\b${this.escapeRegex(acronym)}\\b`, 'g');
      // First occurrence: expand with acronym in parentheses
      let firstMatch = true;
      expanded = expanded.replace(regex, (match) => {
        if (firstMatch) {
          firstMatch = false;
          return `${expansion} (${acronym})`;
        }
        return expansion;
      });
    }

    return expanded;
  }

  /**
   * Extract document structure (headings, sections)
   */
  private static extractDocumentStructure(text: string): Array<{
    title: string;
    content: string;
    startIndex: number;
    endIndex: number;
  }> {
    const sections = [];
    const lines = text.split('\n');
    let currentSection: { title: string; content: string; startIndex: number } | null = null;
    let lineIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      lineIndex += lines[i].length + 1; // +1 for newline

      // Detect headings (various patterns)
      const isHeading = this.isHeading(line);

      if (isHeading && line.length > 0) {
        // Save previous section
        if (currentSection) {
          sections.push({
            ...currentSection,
            endIndex: lineIndex - lines[i].length - 1
          });
        }

        // Start new section
        currentSection = {
          title: this.cleanHeading(line),
          content: '',
          startIndex: lineIndex - lines[i].length - 1
        };
      } else if (currentSection && line.length > 0) {
        // Add content to current section
        currentSection.content += (currentSection.content ? '\n' : '') + line;
      }
    }

    // Add final section
    if (currentSection) {
      sections.push({
        ...currentSection,
        endIndex: text.length
      });
    }

    return sections;
  }

  /**
   * Detect if a line is likely a heading
   */
  private static isHeading(line: string): boolean {
    if (line.length === 0 || line.length > 200) return false;

    const patterns = [
      // Numbered headings
      /^\d+\.\s+.+/,
      /^\d+\.\d+\s+.+/,
      // ALL CAPS (but not too long)
      /^[A-Z\s]{5,50}$/,
      // Title Case with limited punctuation
      /^[A-Z][a-z].*[^.!?]$/,
      // Chapter/Section patterns
      /^(Chapter|Section|Part)\s+\d+/i,
      // Common academic headings
      /^(Abstract|Introduction|Methodology|Results|Discussion|Conclusion|References|Appendix)/i
    ];

    return patterns.some(pattern => pattern.test(line.trim()));
  }

  /**
   * Clean heading text
   */
  private static cleanHeading(heading: string): string {
    return heading
      .replace(/^\d+\.?\s*/, '') // Remove numbering
      .replace(/^(Chapter|Section|Part)\s+\d+:?\s*/i, '') // Remove chapter/section prefixes
      .trim();
  }

  /**
   * Calculate text quality score (0-1)
   */
  private static calculateTextQuality(text: string, originalLength: number): number {
    let score = 0.5; // Base score

    // Length preservation (good if we didn't lose too much content)
    const lengthRatio = text.length / Math.max(originalLength, 1);
    if (lengthRatio > 0.9) score += 0.1;
    else if (lengthRatio > 0.8) score += 0.05;

    // Character variety (good if we have diverse characters)
    const uniqueChars = new Set(text.toLowerCase()).size;
    if (uniqueChars > 20) score += 0.1;

    // Word count (good if we have substantial content)
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount > 100) score += 0.1;
    if (wordCount > 500) score += 0.1;

    // Sentence structure (good if we have proper sentences)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length > 5) score += 0.05;
    if (sentences.length > 20) score += 0.05;

    // Absence of artifacts (bad if we have many special characters)
    const artifactCount = (text.match(/[^\w\s.,!?;:'"()\-–—]/g) || []).length;
    const artifactRatio = artifactCount / Math.max(text.length, 1);
    if (artifactRatio < 0.01) score += 0.1;
    else if (artifactRatio > 0.05) score -= 0.1;

    // Proper spacing (good if spacing looks natural)
    const spacingIssues = (text.match(/\s{3,}|[a-z][A-Z]|\w[.!?][a-z]/g) || []).length;
    if (spacingIssues < text.length * 0.001) score += 0.1;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Escape special regex characters
   */
  private static escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Quick text cleanup for simple use cases
   */
  static quickClean(text: string): string {
    return this.processText(text, {
      removeOCRErrors: true,
      standardizeFormatting: true,
      fixEncoding: true,
      normalizeWhitespace: true,
      preserveStructure: false,
      expandAcronyms: false
    }).cleanedText;
  }

  /**
   * Enhanced cleanup for academic documents
   */
  static academicClean(text: string): ProcessedTextResult {
    return this.processText(text, {
      removeOCRErrors: true,
      standardizeFormatting: true,
      fixEncoding: true,
      normalizeWhitespace: true,
      preserveStructure: true,
      expandAcronyms: true
    });
  }

  /**
   * Prepare text specifically for question answering
   */
  static prepareForQA(text: string): { 
    cleanedText: string; 
    sections: Array<{ title: string; content: string }>;
    improvements: string[];
  } {
    const result = this.processText(text, {
      removeOCRErrors: true,
      standardizeFormatting: true,
      fixEncoding: true,
      normalizeWhitespace: true,
      preserveStructure: true,
      expandAcronyms: false // Keep original acronyms for search
    });

    return {
      cleanedText: result.cleanedText,
      sections: result.sections || [],
      improvements: result.improvementsApplied
    };
  }
}