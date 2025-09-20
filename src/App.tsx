import React, { useState, useCallback, useEffect } from 'react';
import { BookOpen, Upload, MessageSquare, FileText, Brain, AlertCircle } from 'lucide-react';

import { DocumentUploader } from './components/DocumentUploader';
import { ChatInterface } from './components/ChatInterface';
import { DocumentViewer } from './components/DocumentViewer';
import { AuthForm } from './components/AuthForm';
import { UserMenu } from './components/UserMenu';
import { ThemeToggle } from './components/ThemeToggle';
import { ExportChatButton } from './components/ExportChatButton';
import { DocumentStats } from './components/DocumentStats';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { DynamicFAQ } from './components/DynamicFAQ';

import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Alert, AlertDescription } from './components/ui/alert';

import { api, type Document as ApiDocument } from './utils/api';
import { authService, type AuthState, type User } from './utils/auth';
import { extractPDFTextAndSummarize } from './utils/pdfSummary';
import { UsageTracker } from './utils/usageTracking';
import { PlanUpgradePrompt } from './components/PlanUpgradePrompt';
import { UsageIndicator } from './components/UsageIndicator';
import { findPredefinedAnswer, isResearchPaperQuestion, isMLResearchQuestion, isNuclearPhysicsQuestion } from './utils/predefinedQA';

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

export default function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTab, setCurrentTab] = useState('upload');
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true
  });
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeTrigger, setUpgradeTrigger] = useState<'documents' | 'questions' | 'feature'>('documents');

  // Get ready documents
  const readyDocs = documents.filter(d => d.status === 'ready');

  // Get usage stats
  const usageStats = authState.user ? UsageTracker.getUsageStats(authState.user.id) : null;
  const remainingUsage = authState.user ? UsageTracker.getRemainingUsage(authState.user.id) : null;

  // Listen for auth changes
  useEffect(() => {
    const unsubscribe = authService.subscribe((newAuthState) => {
      setAuthState(newAuthState);
      
      if (newAuthState.isAuthenticated && !authState.isAuthenticated) {
        // User just signed in, load their docs
        loadDocuments();
      }
      
      if (!newAuthState.isAuthenticated && authState.isAuthenticated) {
        // User signed out - clean up
        setDocuments([]);
        setMessages([]);
        setSelectedDocument(undefined);
        setCurrentTab('upload');
        setError(null);
      }
    });

    return unsubscribe;
  }, [authState.isAuthenticated]);

  useEffect(() => {
    if (authState.isAuthenticated) {
      loadDocuments();
    }
  }, [authState.isAuthenticated]);

  const loadDocuments = async () => {
    console.log('Loading documents...');
    const result = await api.getDocuments();
    console.log('Load documents result:', result);
    
    if (result.error) {
      setError(`Failed to load documents: ${result.error}`);
    } else if (result.data) {
      const docsWithDates = result.data.map(doc => ({
        ...doc,
        uploadedAt: new Date(doc.uploadedAt)
      }));
      setDocuments(docsWithDates);
    }
  };

  // Check for processing documents every few seconds
  useEffect(() => {
    const checkProcessing = setInterval(() => {
      const stillProcessing = documents.filter(d => d.status === 'processing');
      if (stillProcessing.length > 0) {
        loadDocuments();
      }
    }, 2000);

    return () => clearInterval(checkProcessing);
  }, [documents]);

  const handleUpload = useCallback(async (files: FileList) => {
    setError(null);
    console.log('Starting upload for files:', Array.from(files).map(f => f.name));
    
    // Check usage limits before processing
    if (authState.user && !UsageTracker.updateUsage(authState.user.id, 'document')) {
      setUpgradeTrigger('documents');
      setShowUpgradePrompt(true);
      return;
    }
    
    // Track if this is the first document upload
    const isFirstUpload = documents.length === 0;
    
    // Jump to chat to show processing
    setCurrentTab('chat');
    
    for (const file of Array.from(files)) {
      if (file.type !== 'application/pdf') {
        setError('Please upload only PDF files');
        continue;
      }

      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        continue;
      }

      // Create temp doc while processing
      const tempDoc: Document = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        uploadedAt: new Date(),
        status: 'processing',
        pageCount: 0
      };
      
      setDocuments(prev => [...prev, tempDoc]);

      // Show processing message
      const processingMsg: Message = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'assistant',
        content: `📄 Processing **${file.name}**...\n\nI'm analyzing your document and will provide a summary shortly!`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, processingMsg]);

      try {
        // Try to extract and summarize
        console.log('Extracting text and generating summary for:', file.name);
        const summary = await extractPDFTextAndSummarize(file);
        
        if (summary.success && summary.summary) {
          const summaryMsg: Message = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'assistant',
            content: summary.summary,
            timestamp: new Date(),
            sources: [{
              document: file.name,
              page: 1,
              excerpt: summary.fullText ? 
                'Auto-generated summary from extracted document text' : 
                'Auto-generated summary from document metadata'
            }]
          };
          setMessages(prev => [...prev, summaryMsg]);
          
          if (summary.fullText && summary.fullText !== 'Metadata-based summary (text extraction unavailable)') {
            console.log(`✅ Successfully extracted ${summary.fullText.length} characters from ${file.name}`);
          }
        } else {
          // Fallback when summary fails
          const fallbackMsg: Message = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'assistant',
            content: `✅ **${file.name}** has been uploaded successfully!\n\nI had trouble generating an automatic summary, but you can now ask me questions about the document content.`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, fallbackMsg]);
          
          if (summary.error) {
            console.warn('Summary generation failed:', summary.error);
          }
        }
      } catch (err) {
        console.error('Error during PDF summary generation:', err);
        const errorMsg: Message = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'assistant',
          content: `⚠️ I couldn't generate an automatic summary for **${file.name}**, but the document has been uploaded successfully. You can still ask me questions about its content!`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
      }

      // Process the actual file
      console.log('Processing PDF file for local storage:', file.name);
      const result = await api.uploadDocument(file);
      console.log('Processing result:', result);
      
      if (result.error) {
        setError(`Failed to process ${file.name}: ${result.error}`);
        setDocuments(prev => 
          prev.map(d => 
            d.id === tempDoc.id 
              ? { ...d, status: 'error' as const } 
              : d
          )
        );
      } else if (result.data) {
        setDocuments(prev => 
          prev.map(d => 
            d.id === tempDoc.id 
              ? {
                  ...result.data,
                  uploadedAt: new Date(result.data.uploadedAt)
                }
              : d
          )
        );
        console.log('PDF processed successfully:', result.data);
        
        // Final ready message
        const readyMsg: Message = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'assistant',
          content: `🎉 **${file.name}** is now ready for questions!\n\n✨ **Advanced Text Processing** - I can now answer questions based on the content extracted from your document using intelligent local processing.\n\nYou can ask me anything about this document. Try questions like:\n• "What are the main findings?"\n• "Summarize the key points"\n• "What methodology was used?"\n• "Define [specific term from document]"\n\n${isFirstUpload ? '📚 **New!** Check out the Documents tab to explore your uploaded files.\n\n' : ''}What would you like to know?`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, readyMsg]);
        
        // Auto-switch to documents tab after first successful upload
        if (isFirstUpload) {
          setTimeout(() => {
            setCurrentTab('documents');
          }, 2000);
        }
      }
    }
  }, []);

  const handleRemoveDocument = useCallback(async (id: string) => {
    const result = await api.deleteDocument(id);
    if (result.error) {
      setError(`Failed to delete document: ${result.error}`);
    } else {
      const updatedDocs = documents.filter(doc => doc.id !== id);
      setDocuments(updatedDocs);
      if (selectedDocument === id) {
        setSelectedDocument(undefined);
      }
      
      // If we're on the documents tab and no documents remain, switch to upload
      if (updatedDocs.length === 0 && currentTab === 'documents') {
        setCurrentTab('upload');
      }
    }
  }, [selectedDocument, documents, currentTab]);

  const handleSendMessage = useCallback(async (content: string) => {
    setError(null);
    console.log('Sending message:', content);
    console.log('Ready documents:', readyDocs);
    
    // Check usage limits before processing question
    if (authState.user && !UsageTracker.updateUsage(authState.user.id, 'question')) {
      setUpgradeTrigger('questions');
      setShowUpgradePrompt(true);
      return;
    }
    
    const userMsg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(msgs => [...msgs, userMsg]);
    setIsProcessing(true);

    // Check for predefined answers first
    const predefinedAnswer = findPredefinedAnswer(content);
    
    if (predefinedAnswer) {
      console.log('Found predefined answer for question:', content);
      
      // Determine which knowledge base the answer is from
      const isML = isMLResearchQuestion(content);
      const isNuclear = isNuclearPhysicsQuestion(content);
      
      let knowledgeBase = 'Integrated Research Knowledge Base';
      let documentName = 'Research Papers.pdf';
      
      if (isML && !isNuclear) {
        knowledgeBase = 'ML Research Paper knowledge base';
        documentName = 'ML Research Paper.pdf';
      } else if (isNuclear && !isML) {
        knowledgeBase = 'Nuclear Physics knowledge base';
        documentName = 'Nuclear Physics Paper.pdf';
      }
      
      const assistantMsg: Message = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'assistant',
        content: `${predefinedAnswer}\n\n---\n*This answer is from the ${knowledgeBase}.*`,
        timestamp: new Date(),
        sources: [{
          document: documentName,
          page: 1,
          excerpt: `Predefined answer from integrated ${knowledgeBase.toLowerCase()}`
        }]
      };

      setMessages(msgs => [...msgs, assistantMsg]);
      setIsProcessing(false);
      return;
    }

    // If no predefined answer found, proceed with normal API call
    const result = await api.askQuestion(content);
    console.log('Ask question result:', result);
    
    if (result.error) {
      console.error('Question failed with error:', result.error);
      setError(`Failed to get answer: ${result.error}`);
      
      const errorMsg: Message = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'assistant',
        content: `Sorry, I encountered an error: ${result.error}. Please try again or check that your documents are properly uploaded and processed.`,
        timestamp: new Date()
      };
      setMessages(msgs => [...msgs, errorMsg]);
      setIsProcessing(false);
    } else if (result.data) {
      const assistantMsg: Message = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'assistant',
        content: result.data.answer,
        timestamp: new Date(),
        sources: result.data.sources
      };

      setMessages(msgs => [...msgs, assistantMsg]);
      setIsProcessing(false);
    } else {
      console.error('No data or error returned from API');
      setError('Received empty response');
      setIsProcessing(false);
    }
  }, [readyDocs]);

  const handleSignIn = async (email: string, password: string) => {
    return authService.signIn(email, password);
  };

  const handleSignUp = async (name: string, email: string, password: string) => {
    return authService.signUp(name, email, password);
  };

  const handleSignOut = async () => {
    await authService.signOut();
  };

  const handlePlanUpgrade = async (plan: 'pro' | 'premium') => {
    if (!authState.user) return;
    
    // In production, this would integrate with Stripe or similar
    console.log(`Upgrading to ${plan} plan`);
    
    // For demo purposes, just upgrade locally
    UsageTracker.upgradePlan(authState.user.id, plan);
    
    setShowUpgradePrompt(false);
    
    // Show success message
    const upgradeMsg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'assistant',
      content: `🎉 Welcome to the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan! You now have unlimited access to all features. Thank you for upgrading!`,
      timestamp: new Date(),
    };
    setMessages(msgs => [...msgs, upgradeMsg]);
  };

  // Setup demo account and test PDF processing on mount
  useEffect(() => {
    const setupDemo = async () => {
      const demoEmail = 'demo@example.com';
      try {
        const result = await authService.signUp('Demo User', demoEmail, 'demo123');
        if (!result.success && result.error?.includes('already exists')) {
          // Already exists, no problem
        }
      } catch (error) {
        // Ignore demo setup errors
      }
    };
    
    const testPDFProcessing = async () => {
      try {
        const { testPDFRestIntegration } = await import('./utils/pdfRestTest');
        const test = await testPDFRestIntegration();
        
        if (test.fallbackWorking) {
          console.log('✅ Document processing ready:', {
            localExtraction: 'Working',
            apiNotes: 'PDFRest API requires server-side implementation (CORS expected)'
          });
        } else {
          console.warn('⚠️ Document processing may have issues:', test);
        }
      } catch (error) {
        console.warn('PDFRest integration test error:', error);
      }
    };
    
    setupDemo();
    testPDFProcessing();
  }, []);

  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return <AuthForm onSignIn={handleSignIn} onSignUp={handleSignUp} />;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold">Academic Assistant</h1>
              <p className="text-sm text-muted-foreground">AI-powered study companion</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {documents.length}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {messages.filter(m => m.type === 'user').length}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <ExportChatButton messages={messages} />
              <KeyboardShortcuts 
                onSwitchToChat={() => setCurrentTab('chat')}
                onSwitchToUpload={() => setCurrentTab('upload')}
                onSwitchToDocuments={() => setCurrentTab('documents')}
                onFocusSearch={() => {
                  const searchInput = document.querySelector('input[placeholder*="search" i]') as HTMLInputElement;
                  if (searchInput) {
                    searchInput.focus();
                  }
                }}
                hasDocuments={documents.length > 0}
              />
              <ThemeToggle />
              {authState.user && (
                <UserMenu user={authState.user} onSignOut={handleSignOut} />
              )}
            </div>
          </div>
        </div>
        
        {error && (
          <div className="px-4 pb-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="h-full flex flex-col">
            {/* Tab Navigation */}
            <div className="border-b flex-shrink-0">
              <div className="px-6 py-2">
                <TabsList className={`grid w-full max-w-md ${documents.length > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">Upload</span>
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span className="hidden sm:inline">Chat</span>
                  </TabsTrigger>
                  {documents.length > 0 && (
                    <TabsTrigger value="documents" className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span className="hidden sm:inline">Documents</span>
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>
            </div>

            {/* Tab Content - Scrollable Main Content */}
            <div className="flex-1 min-h-0">
              <TabsContent value="upload" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <div className="flex-1 main-content-scroll">
                  <div className="p-8">
                    <div className="max-w-3xl mx-auto">
                      <div className="text-center mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Upload Your Research Documents</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                          Upload PDF files to start asking questions and getting insights from your academic materials.
                        </p>
                      </div>
                      
                      <DocumentUploader
                        documents={documents}
                        onUpload={handleUpload}
                        onRemove={handleRemoveDocument}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="chat" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <div className="flex-1 flex flex-col min-h-0">
                  <ChatInterface
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isProcessing={isProcessing}
                    hasDocuments={documents.length > 0}
                  />
                </div>
              </TabsContent>

              {documents.length > 0 && (
                <TabsContent value="documents" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                  <div className="flex-1 main-content-scroll">
                    <DocumentViewer
                      documents={documents}
                      selectedDocument={selectedDocument}
                      onSelectDocument={setSelectedDocument}
                    />
                  </div>
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>

        {/* Fixed Workspace Sidebar - Always Visible */}
        <div className="workspace-sidebar border-l bg-card flex flex-col">
          <div className="p-4 border-b flex-shrink-0">
            <h3 className="font-medium text-sm text-muted-foreground">Workspace</h3>
          </div>
          
          <div className="flex-1 workspace-sidebar-content p-4 space-y-6 min-h-0">
            {/* Usage Indicator */}
            {authState.user && usageStats && remainingUsage && (
              <UsageIndicator
                currentUsage={{
                  documents: usageStats.documentsProcessed,
                  questions: usageStats.questionsAsked
                }}
                remaining={remainingUsage}
                planType={usageStats.planType}
                onUpgradeClick={() => {
                  setUpgradeTrigger('feature');
                  setShowUpgradePrompt(true);
                }}
              />
            )}
            
            {/* Document Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {documents.length > 0 ? 'Document Statistics' : 'Getting Started'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length > 0 ? (
                  <DocumentStats documents={documents} messages={messages} />
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Welcome to your AI Academic Assistant! Get started by:
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-sm">
                        <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">1</span>
                        <span>Upload PDF documents</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">2</span>
                        <span>Ask questions about your content</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">3</span>
                        <span>Get AI-powered insights</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Dynamic FAQ */}
            <DynamicFAQ 
              onAskQuestion={(question) => {
                setCurrentTab('chat');
                handleSendMessage(question);
              }}
              hasDocuments={readyDocs.length > 0}
              documentCount={readyDocs.length}
            />

            {/* Quick Actions when no documents */}
            {documents.length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setCurrentTab('upload')}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Documents
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setCurrentTab('chat')}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Try Sample Questions
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Plan Upgrade Prompt */}
      {showUpgradePrompt && usageStats && remainingUsage && (
        <PlanUpgradePrompt
          onUpgrade={handlePlanUpgrade}
          onClose={() => setShowUpgradePrompt(false)}
          limitType={upgradeTrigger}
          currentUsage={{
            documents: usageStats.documentsProcessed,
            questions: usageStats.questionsAsked
          }}
        />
      )}
    </div>
  );
}