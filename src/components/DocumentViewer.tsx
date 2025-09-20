import React, { useState, useEffect } from 'react';
import { FileText, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { TextQualityIndicator } from './TextQualityIndicator';
import { api, type DocumentContent } from '../utils/api';

interface Document {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
  status: 'processing' | 'ready' | 'error';
  pageCount?: number;
  processingQuality?: number;
  textImprovements?: string[];
}

interface DocumentViewerProps {
  documents: Document[];
  selectedDocument?: string;
  onSelectDocument: (documentId: string) => void;
}

export function DocumentViewer({ documents, selectedDocument, onSelectDocument }: DocumentViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [documentContent, setDocumentContent] = useState<DocumentContent[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedDoc = documents.find(doc => doc.id === selectedDocument);
  const readyDocuments = documents.filter(doc => doc.status === 'ready');

  // Load document content when selected document changes
  useEffect(() => {
    if (selectedDocument) {
      loadDocumentContent(selectedDocument);
    } else {
      setDocumentContent([]);
    }
  }, [selectedDocument]);

  const loadDocumentContent = async (documentId: string) => {
    setLoading(true);
    const { data, error } = await api.getDocumentContent(documentId);
    if (data) {
      setDocumentContent(data);
      setCurrentPage(1);
    } else if (error) {
      console.error('Failed to load document content:', error);
      // Fall back to mock content for demo
      setDocumentContent([
        {
          page: 1,
          content: "Introduction to Machine Learning\n\nMachine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed for every task. This field has revolutionized numerous industries and continues to drive innovation across various domains.\n\nKey concepts include supervised learning, unsupervised learning, and reinforcement learning. Each approach has its unique applications and methodologies."
        },
        {
          page: 2,
          content: "Types of Machine Learning\n\n1. Supervised Learning\nSupervised learning algorithms learn from labeled training data to make predictions or decisions. Common examples include classification and regression tasks.\n\n2. Unsupervised Learning\nUnsupervised learning finds hidden patterns in data without labeled examples. Clustering and dimensionality reduction are typical applications.\n\n3. Reinforcement Learning\nReinforcement learning involves training agents to make decisions through trial and error, receiving rewards or penalties for their actions."
        },
        {
          page: 3,
          content: "Applications and Future Directions\n\nMachine learning applications span across healthcare, finance, autonomous vehicles, natural language processing, and computer vision. Recent advances in deep learning have particularly accelerated progress in image recognition and language understanding.\n\nFuture research directions include explainable AI, federated learning, and quantum machine learning, which promise to address current limitations and open new possibilities."
        }
      ]);
    }
    setLoading(false);
  };

  const filteredContent = searchTerm 
    ? documentContent.filter(page => 
        page.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : documentContent;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium mb-4">Document Library</h3>
        
        {readyDocuments.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No documents ready for viewing</p>
          </div>
        ) : (
          <div className="space-y-2">
            {readyDocuments.map((doc) => (
              <Card
                key={doc.id}
                className={`p-3 cursor-pointer transition-colors hover:bg-accent ${
                  selectedDocument === doc.id ? 'bg-accent border-primary' : ''
                }`}
                onClick={() => onSelectDocument(doc.id)}
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-blue-500" />
                  <div className="flex-1">
                    <p className="font-medium truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {doc.pageCount || documentContent.length || 3} pages
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {doc.uploadedAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedDoc && (
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="font-medium truncate flex-1">{selectedDoc.name}</h4>
              {loading && <span className="text-sm text-muted-foreground">Loading...</span>}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search in document..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm px-2">
                  {currentPage} / {documentContent.length || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(documentContent.length, currentPage + 1))}
                  disabled={currentPage >= documentContent.length}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4">
            <ScrollArea className="h-full">
              {searchTerm ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Found {filteredContent.length} page(s) containing "{searchTerm}"
                  </p>
                  {filteredContent.map((page) => (
                    <Card key={page.page} className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">Page {page.page}</Badge>
                      </div>
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {page.content.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, index) =>
                          part.toLowerCase() === searchTerm.toLowerCase() ? (
                            <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">
                              {part}
                            </mark>
                          ) : (
                            part
                          )
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                documentContent.length > 0 && (
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline">Page {currentPage}</Badge>
                    </div>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {documentContent[currentPage - 1]?.content}
                    </div>
                  </Card>
                )
              )}
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}