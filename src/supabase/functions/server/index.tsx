import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js';
// Import PDF parsing library
import { getDocument, GlobalWorkerOptions } from 'npm:pdfjs-dist@4.0.379';
import * as kv from './kv_store.tsx';

// Set up PDF.js worker
GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.mjs';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Initialize storage bucket
const bucketName = 'make-a02bb2b5-documents';

// PDF text extraction function
async function extractTextFromPDF(pdfBuffer: ArrayBuffer): Promise<{ text: string; pageCount: number; pages: Array<{ page: number; text: string }> }> {
  try {
    console.log('Starting PDF text extraction...');
    const pdf = await getDocument({ data: pdfBuffer }).promise;
    const pageCount = pdf.numPages;
    console.log(`PDF has ${pageCount} pages`);
    
    const pages: Array<{ page: number; text: string }> = [];
    let allText = '';

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      try {
        console.log(`Extracting text from page ${pageNum}`);
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        let pageText = '';
        for (const item of textContent.items) {
          if ('str' in item) {
            pageText += item.str + ' ';
          }
        }
        
        // Clean up the text
        pageText = pageText.replace(/\s+/g, ' ').trim();
        pages.push({ page: pageNum, text: pageText });
        allText += pageText + '\n\n';
        
        console.log(`Page ${pageNum} extracted: ${pageText.length} characters`);
      } catch (pageError) {
        console.error(`Error extracting page ${pageNum}:`, pageError);
        pages.push({ page: pageNum, text: '' });
      }
    }

    console.log(`Total text extracted: ${allText.length} characters`);
    return { text: allText, pageCount, pages };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract PDF text: ${error.message}`);
  }
}

// Function to split text into chunks for better search
function createTextChunks(pages: Array<{ page: number; text: string }>, maxChunkSize = 500): Array<{ content: string; page: number; chunkIndex: number }> {
  const chunks: Array<{ content: string; page: number; chunkIndex: number }> = [];
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
          chunkIndex: chunkIndex++
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
        chunkIndex: chunkIndex++
      });
    }
  }
  
  console.log(`Created ${chunks.length} text chunks`);
  return chunks;
}

// Create bucket on startup
const initializeBucket = async () => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      await supabase.storage.createBucket(bucketName, { public: false });
      console.log('Created documents bucket');
    }
  } catch (error) {
    console.log('Error initializing bucket:', error);
  }
};

initializeBucket();

// Health check endpoint
app.get('/make-server-a02bb2b5/health', async (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    bucket: bucketName 
  });
});

// Upload PDF endpoint
app.post('/make-server-a02bb2b5/upload-pdf', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    const fileId = crypto.randomUUID();
    const fileName = `${fileId}.pdf`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file);

    if (uploadError) {
      console.log('Upload error:', uploadError);
      return c.json({ error: 'Failed to upload file' }, 500);
    }

    // Store document metadata
    const documentData = {
      id: fileId,
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      status: 'processing',
      filePath: fileName
    };

    await kv.set(`doc:${fileId}`, documentData);

    // Start background PDF processing
    setTimeout(async () => {
      try {
        console.log(`Starting PDF processing for document ${fileId}`);
        
        // Download the PDF from storage
        const { data: pdfData, error: downloadError } = await supabase.storage
          .from(bucketName)
          .download(fileName);
          
        if (downloadError) {
          console.error('Failed to download PDF for processing:', downloadError);
          throw new Error('Failed to download PDF for processing');
        }
        
        console.log('PDF downloaded, converting to ArrayBuffer...');
        const pdfBuffer = await pdfData.arrayBuffer();
        console.log(`PDF buffer size: ${pdfBuffer.byteLength} bytes`);
        
        // Extract text from PDF
        console.log('Extracting text from PDF...');
        const { text, pageCount, pages } = await extractTextFromPDF(pdfBuffer);
        
        if (!text || text.trim().length === 0) {
          throw new Error('No text could be extracted from the PDF');
        }
        
        console.log(`Extracted ${text.length} characters from ${pageCount} pages`);
        
        // Create text chunks for semantic search
        const chunks = createTextChunks(pages);
        
        if (chunks.length === 0) {
          throw new Error('No text chunks could be created from the PDF');
        }
        
        console.log(`Created ${chunks.length} chunks, storing in database...`);

        // Store text chunks
        for (const chunk of chunks) {
          await kv.set(`chunk:${fileId}:${chunk.chunkIndex}`, {
            documentId: fileId,
            content: chunk.content,
            page: chunk.page,
            chunkIndex: chunk.chunkIndex,
            // Simple keyword-based similarity (in production, would use proper embeddings)
            keywords: chunk.content.toLowerCase().split(/\s+/).filter(word => word.length > 3)
          });
        }

        // Store full page content for document viewer
        for (const page of pages) {
          await kv.set(`page:${fileId}:${page.page}`, {
            documentId: fileId,
            page: page.page,
            content: page.text
          });
        }

        // Update document status
        const updatedDoc = { ...documentData, status: 'ready', pageCount };
        await kv.set(`doc:${fileId}`, updatedDoc);
        
        console.log(`Document ${fileId} processed successfully: ${pageCount} pages, ${chunks.length} chunks`);
      } catch (error) {
        console.error('PDF processing error:', error);
        const errorDoc = { ...documentData, status: 'error', error: error.message };
        await kv.set(`doc:${fileId}`, errorDoc);
      }
    }, 1000);

    return c.json({ 
      id: fileId,
      name: file.name,
      size: file.size,
      uploadedAt: documentData.uploadedAt,
      status: 'processing'
    });

  } catch (error) {
    console.log('Upload endpoint error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get documents endpoint
app.get('/make-server-a02bb2b5/documents', async (c) => {
  try {
    const documents = await kv.getByPrefix('doc:');
    return c.json(documents.map(doc => doc.value));
  } catch (error) {
    console.log('Get documents error:', error);
    return c.json({ error: 'Failed to fetch documents' }, 500);
  }
});

// Delete document endpoint
app.delete('/make-server-a02bb2b5/documents/:id', async (c) => {
  try {
    const documentId = c.req.param('id');
    
    // Get document metadata
    const document = await kv.get(`doc:${documentId}`);
    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    // Delete from storage
    await supabase.storage.from(bucketName).remove([document.filePath]);
    
    // Delete chunks
    const chunks = await kv.getByPrefix(`chunk:${documentId}:`);
    for (const chunk of chunks) {
      await kv.del(chunk.key);
    }
    
    // Delete document metadata
    await kv.del(`doc:${documentId}`);

    return c.json({ success: true });
  } catch (error) {
    console.log('Delete document error:', error);
    return c.json({ error: 'Failed to delete document' }, 500);
  }
});

// Question answering endpoint
app.post('/make-server-a02bb2b5/ask', async (c) => {
  try {
    console.log('Ask endpoint called');
    const body = await c.req.json();
    console.log('Request body:', body);
    const { question } = body;
    
    if (!question) {
      console.log('No question provided');
      return c.json({ error: 'No question provided' }, 400);
    }

    console.log('Processing question:', question);

    // Get all document chunks for semantic search
    console.log('Fetching chunks...');
    const chunkEntries = await kv.getByPrefix('chunk:');
    console.log('Chunk entries found:', chunkEntries.length);
    const chunks = chunkEntries.map(entry => entry.value);
    console.log('Chunks:', chunks.length);
    
    if (chunks.length === 0) {
      console.log('No documents available for search');
      return c.json({ error: 'No documents available for search. Please upload and process some PDF documents first.' }, 400);
    }

    // Improved semantic search using keyword matching
    const questionLower = question.toLowerCase();
    const questionWords = questionLower.split(/\s+/).filter(word => word.length > 2);
    console.log('Question words:', questionWords);
    
    // Score chunks based on keyword overlap and content relevance
    const scoredChunks = chunks.map(chunk => {
      const content = chunk.content.toLowerCase();
      const contentWords = content.split(/\s+/);
      
      // Calculate keyword overlap score
      let keywordScore = 0;
      for (const qWord of questionWords) {
        if (content.includes(qWord)) {
          keywordScore += 1;
          // Bonus for exact phrase matches
          if (questionLower.includes(' ' + qWord + ' ') && content.includes(' ' + qWord + ' ')) {
            keywordScore += 0.5;
          }
        }
      }
      
      // Bonus for chunks that contain question-like words
      if (questionLower.includes('what is') && (content.includes('is ') || content.includes('definition') || content.includes('means'))) {
        keywordScore += 1;
      }
      if (questionLower.includes('how') && (content.includes('process') || content.includes('method') || content.includes('steps'))) {
        keywordScore += 1;
      }
      if (questionLower.includes('why') && (content.includes('because') || content.includes('reason') || content.includes('purpose'))) {
        keywordScore += 1;
      }
      
      return {
        ...chunk,
        score: keywordScore,
        relevantWords: questionWords.filter(word => content.includes(word))
      };
    });

    // Sort by relevance and take top chunks
    const relevantChunks = scoredChunks
      .filter(chunk => chunk.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    console.log('Relevant chunks found:', relevantChunks.length);
    console.log('Top chunk scores:', relevantChunks.map(c => ({ score: c.score, preview: c.content.substring(0, 100) })));

    // Generate response based on the actual content found
    let response = '';
    const sources: Array<{ document: string; page: number; excerpt: string }> = [];

    if (relevantChunks.length === 0) {
      response = `I couldn't find specific information about "${question}" in the uploaded documents. The documents might not contain relevant content, or you could try rephrasing your question with different keywords.`;
    } else {
      // Combine relevant chunks to create a comprehensive answer
      const combinedContent = relevantChunks.map(chunk => chunk.content).join(' ');
      
      // Create a response based on the found content
      if (questionLower.includes('what is') || questionLower.includes('define') || questionLower.includes('definition')) {
        response = `Based on the uploaded documents: ${relevantChunks[0].content}`;
        if (relevantChunks.length > 1) {
          response += ` Additionally, ${relevantChunks[1].content}`;
        }
      } else if (questionLower.includes('how') || questionLower.includes('process') || questionLower.includes('method')) {
        const processChunks = relevantChunks.filter(chunk => 
          chunk.content.toLowerCase().includes('step') || 
          chunk.content.toLowerCase().includes('process') || 
          chunk.content.toLowerCase().includes('method')
        );
        if (processChunks.length > 0) {
          response = `According to the documents: ${processChunks[0].content}`;
        } else {
          response = `Based on the available information: ${relevantChunks[0].content}`;
        }
      } else if (questionLower.includes('why') || questionLower.includes('reason') || questionLower.includes('because')) {
        response = `The documents explain: ${relevantChunks[0].content}`;
      } else if (questionLower.includes('list') || questionLower.includes('types') || questionLower.includes('kinds')) {
        response = `From the uploaded documents, here are the key points: ${combinedContent}`;
      } else {
        // General question - provide the most relevant information
        response = `According to your uploaded documents: ${relevantChunks[0].content}`;
        if (relevantChunks.length > 1) {
          response += ` The documents also mention: ${relevantChunks[1].content}`;
        }
      }
      
      // Ensure response isn't too long
      if (response.length > 500) {
        response = response.substring(0, 500) + '...';
      }
    }

    console.log('Generated response:', response);

    // Add sources from relevant chunks
    for (const chunk of relevantChunks) {
      try {
        const doc = await kv.get(`doc:${chunk.documentId}`);
        if (doc) {
          sources.push({
            document: doc.name,
            page: chunk.page,
            excerpt: chunk.content.substring(0, 150) + '...'
          });
        }
      } catch (docError) {
        console.log('Error fetching document for chunk:', docError);
      }
    }

    console.log('Sources:', sources);

    const result = {
      answer: response,
      sources: sources
    };

    console.log('Returning result:', result);
    return c.json(result);

  } catch (error) {
    console.log('Ask endpoint error:', error);
    console.log('Error details:', error.message, error.stack);
    return c.json({ error: `Failed to process question: ${error.message}` }, 500);
  }
});

// Get document content endpoint
app.get('/make-server-a02bb2b5/documents/:id/content', async (c) => {
  try {
    const documentId = c.req.param('id');
    console.log('Fetching content for document:', documentId);
    
    // Get page content directly
    const pageEntries = await kv.getByPrefix(`page:${documentId}:`);
    console.log('Found page entries:', pageEntries.length);
    
    if (pageEntries.length === 0) {
      // Fallback to chunks if pages not found
      const chunks = await kv.getByPrefix(`chunk:${documentId}:`);
      const pages = chunks.reduce((acc, entry) => {
        const chunk = entry.value;
        if (!acc[chunk.page]) {
          acc[chunk.page] = [];
        }
        acc[chunk.page].push(chunk);
        return acc;
      }, {} as Record<number, any[]>);

      const pageContent = Object.keys(pages).map(pageNum => ({
        page: parseInt(pageNum),
        content: pages[parseInt(pageNum)].map(chunk => chunk.content).join('\n\n')
      })).sort((a, b) => a.page - b.page);

      return c.json(pageContent);
    }

    // Return actual page content
    const pageContent = pageEntries
      .map(entry => entry.value)
      .sort((a, b) => a.page - b.page)
      .map(page => ({
        page: page.page,
        content: page.content
      }));

    console.log('Returning content for', pageContent.length, 'pages');
    return c.json(pageContent);
  } catch (error) {
    console.log('Get content error:', error);
    return c.json({ error: 'Failed to fetch document content' }, 500);
  }
});

Deno.serve(app.fetch);