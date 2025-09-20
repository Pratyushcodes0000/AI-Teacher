import { pdfProcessor, ProcessedDocument } from './pdfProcessor';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Local storage key for persisting documents
const STORAGE_KEY = 'academic_assistant_documents';

export interface Document {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  status: 'processing' | 'ready' | 'error';
  pageCount?: number;
}

export interface ChatResponse {
  answer: string;
  sources: Array<{
    document: string;
    page: number;
    excerpt: string;
  }>;
}

export interface DocumentContent {
  page: number;
  content: string;
}

// Helper function to simulate async operations
const simulateDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to save documents to localStorage
const saveDocumentsToStorage = (documents: ProcessedDocument[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  } catch (error) {
    console.warn('Failed to save documents to localStorage:', error);
  }
};

// Helper function to load documents from localStorage
const loadDocumentsFromStorage = (): ProcessedDocument[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const documents = JSON.parse(stored);
      // Restore documents to the processor
      for (const doc of documents) {
        if (doc.status === 'ready') {
          // Re-add to processor (simplified - in real app would validate)
          pdfProcessor['documents'].set(doc.id, {
            ...doc,
            uploadedAt: new Date(doc.uploadedAt)
          });
        }
      }
      return documents.map(doc => ({
        ...doc,
        uploadedAt: new Date(doc.uploadedAt)
      }));
    }
  } catch (error) {
    console.warn('Failed to load documents from localStorage:', error);
  }
  return [];
};

export const api = {
  healthCheck: async (): Promise<ApiResponse<{ status: string; timestamp: string; bucket: string }>> => {
    await simulateDelay(200);
    return {
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        bucket: 'local-storage'
      }
    };
  },

  uploadDocument: async (file: File): Promise<ApiResponse<Document>> => {
    try {
      console.log('Processing PDF file locally:', file.name);
      
      if (file.type !== 'application/pdf') {
        return { error: 'Please upload only PDF files' };
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        return { error: 'File size must be less than 10MB' };
      }

      const { id, document } = await pdfProcessor.processFile(file);
      
      // Save to localStorage
      const allDocuments = pdfProcessor.getAllDocuments();
      saveDocumentsToStorage(allDocuments);

      const apiDocument: Document = {
        id: document.id,
        name: document.name,
        size: document.size,
        uploadedAt: document.uploadedAt.toISOString(),
        status: document.status,
        pageCount: document.pageCount
      };

      console.log('PDF processed successfully:', apiDocument);
      return { data: apiDocument };
    } catch (error) {
      console.error('PDF processing failed:', error);
      return { error: `Failed to process PDF: ${error.message}` };
    }
  },

  getDocuments: async (): Promise<ApiResponse<Document[]>> => {
    await simulateDelay(100);
    
    // Load from localStorage on first call
    const storedDocs = loadDocumentsFromStorage();
    const processorDocs = pdfProcessor.getAllDocuments();
    
    // Merge stored and processor documents
    const allDocs = [...storedDocs];
    for (const procDoc of processorDocs) {
      if (!allDocs.find(d => d.id === procDoc.id)) {
        allDocs.push(procDoc);
      }
    }

    const documents: Document[] = allDocs.map(doc => ({
      id: doc.id,
      name: doc.name,
      size: doc.size,
      uploadedAt: doc.uploadedAt.toISOString(),
      status: doc.status,
      pageCount: doc.pageCount
    }));

    console.log('Returning documents:', documents);
    return { data: documents };
  },

  deleteDocument: async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
    await simulateDelay(100);
    
    const success = pdfProcessor.deleteDocument(id);
    
    if (success) {
      // Update localStorage
      const allDocuments = pdfProcessor.getAllDocuments();
      saveDocumentsToStorage(allDocuments);
    }

    return { data: { success } };
  },

  askQuestion: async (question: string): Promise<ApiResponse<ChatResponse>> => {
    await simulateDelay(800); // Simulate AI processing time
    
    try {
      console.log('Processing question locally:', question);
      
      const result = pdfProcessor.generateAnswer(question);
      
      console.log('Generated answer:', result);
      return { data: result };
    } catch (error) {
      console.error('Question processing failed:', error);
      return { error: `Failed to process question: ${error.message}` };
    }
  },

  getDocumentContent: async (id: string): Promise<ApiResponse<DocumentContent[]>> => {
    await simulateDelay(200);
    
    const document = pdfProcessor.getDocument(id);
    
    if (!document) {
      return { error: 'Document not found' };
    }

    if (document.status !== 'ready') {
      return { error: 'Document not ready' };
    }

    const content: DocumentContent[] = document.pages.map(page => ({
      page: page.page,
      content: page.text
    }));

    return { data: content };
  },
};