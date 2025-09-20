import React, { useState, useCallback, useEffect } from 'react';
import { BookOpen, Upload, MessageSquare, FileText, Brain, AlertCircle, Menu, X, Zap, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
import { Card, CardContent } from './components/ui/card';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
          content: `🎉 **${file.name}** is now ready for questions!\n\n✨ **Advanced Text Processing** - I can now answer questions based on the content extracted from your document using intelligent local processing.\n\nYou can ask me anything about this document. Try questions like:\n• "What are the main findings?"\n• "Summarize the key points"\n• "What methodology was used?"\n• "Define [specific term from document]"\n\nWhat would you like to know?`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, readyMsg]);
      }
    }
  }, []);

  const handleRemoveDocument = useCallback(async (id: string) => {
    const result = await api.deleteDocument(id);
    if (result.error) {
      setError(`Failed to delete document: ${result.error}`);
    } else {
      setDocuments(docs => docs.filter(doc => doc.id !== id));
      if (selectedDocument === id) {
        setSelectedDocument(undefined);
      }
    }
  }, [selectedDocument]);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <Brain className="h-12 w-12 text-primary mx-auto mb-4" />
          </motion.div>
          <motion.p 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-muted-foreground"
          >
            Loading...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5"
      >
        <AuthForm onSignIn={handleSignIn} onSignUp={handleSignUp} />
      </motion.div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Enhanced Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50"
      >
        <div className="flex items-center justify-between p-4">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg"
                whileHover={{ rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Brain className="h-5 w-5 text-primary-foreground" />
              </motion.div>
              <div>
                <h1 className="text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Academic Assistant
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI-powered study companion
                </p>
              </div>
            </div>
          </motion.div>
          
          <div className="flex items-center gap-3">
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Badge variant="secondary" className="flex items-center gap-1 hover:bg-secondary/80 transition-colors">
                <FileText className="h-3 w-3" />
                {documents.length}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1 hover:bg-secondary/80 transition-colors">
                <MessageSquare className="h-3 w-3" />
                {messages.filter(m => m.type === 'user').length}
              </Badge>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
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
              />
              <ThemeToggle />
              {authState.user && (
                <UserMenu user={authState.user} onSignOut={handleSignOut} />
              )}
            </motion.div>
          </div>
        </div>
        
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4"
            >
              <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <motion.div 
          className="flex-1 flex flex-col"
          layout
        >
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="h-full flex flex-col">
            {/* Enhanced Tab Navigation */}
            <div className="border-b bg-card/50 backdrop-blur-sm">
              <div className="px-6 py-2">
                <TabsList className="grid w-full max-w-md grid-cols-3 bg-muted/30 backdrop-blur-sm">
                  <TabsTrigger value="upload" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">Upload</span>
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                    <MessageSquare className="h-4 w-4" />
                    <span className="hidden sm:inline">Chat</span>
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                    <BookOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">Documents</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Enhanced Tab Content */}
            <div className="flex-1 relative">
              <AnimatePresence mode="wait">
                <TabsContent 
                  value="upload" 
                  className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col"
                >
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full flex flex-col"
                  >
                    <div className="flex-1 p-8">
                      <div className="max-w-3xl mx-auto">
                        <motion.div 
                          className="text-center mb-12"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                            <Zap className="h-4 w-4" />
                            <span className="text-sm font-medium">Powered by Advanced AI</span>
                          </div>
                          <h2 className="text-3xl font-semibold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                            Upload Your Research Documents
                          </h2>
                          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Upload PDF files to start asking questions and getting insights from your academic materials with our intelligent AI assistant.
                          </p>
                        </motion.div>
                        
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <DocumentUploader
                            documents={documents}
                            onUpload={handleUpload}
                            onRemove={handleRemoveDocument}
                          />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent 
                  value="chat" 
                  className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col"
                >
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <ChatInterface
                      messages={messages}
                      onSendMessage={handleSendMessage}
                      isProcessing={isProcessing}
                      hasDocuments={documents.length > 0}
                    />
                  </motion.div>
                </TabsContent>

                <TabsContent 
                  value="documents" 
                  className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col"
                >
                  <motion.div
                    key="documents"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <DocumentViewer
                      documents={documents}
                      selectedDocument={selectedDocument}
                      onSelectDocument={setSelectedDocument}
                    />
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </div>
          </Tabs>
        </motion.div>

        {/* Enhanced Dynamic Sidebar */}
        <AnimatePresence>
          {documents.length > 0 && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ 
                width: sidebarCollapsed ? 60 : 360, 
                opacity: 1 
              }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="border-l bg-card/60 backdrop-blur-sm flex flex-col overflow-hidden"
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b bg-card/80">
                <div className="flex items-center justify-between">
                  {!sidebarCollapsed && (
                    <motion.h3 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-medium text-sm text-muted-foreground"
                    >
                      Workspace
                    </motion.h3>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="h-8 w-8 p-0 hover:bg-accent transition-colors"
                  >
                    <motion.div
                      animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </motion.div>
                  </Button>
                </div>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-4 space-y-6"
                    >
                      {/* Usage Indicator */}
                      {authState.user && usageStats && remainingUsage && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
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
                        </motion.div>
                      )}
                      
                      {/* Document Stats */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Card className="border-0 bg-gradient-to-br from-card to-card/50 shadow-sm">
                          <CardContent className="p-4">
                            <DocumentStats documents={documents} messages={messages} />
                          </CardContent>
                        </Card>
                      </motion.div>
                      
                      {/* Dynamic FAQ */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <DynamicFAQ 
                          onAskQuestion={(question) => {
                            setCurrentTab('chat');
                            handleSendMessage(question);
                          }}
                          hasDocuments={readyDocs.length > 0}
                          documentCount={readyDocs.length}
                        />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Plan Upgrade Prompt */}
      <AnimatePresence>
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
      </AnimatePresence>
    </div>
  );
}