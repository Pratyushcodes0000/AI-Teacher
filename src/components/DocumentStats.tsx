import React from 'react';
import { FileText, Clock, MessageSquare, TrendingUp, Zap } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { TextQualityIndicator } from './TextQualityIndicator';

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

interface DocumentStatsProps {
  documents: Document[];
  messages: Message[];
}

export function DocumentStats({ documents, messages }: DocumentStatsProps) {
  const readyDocuments = documents.filter(doc => doc.status === 'ready');
  const totalPages = readyDocuments.reduce((acc, doc) => acc + (doc.pageCount || 3), 0);
  const userMessages = messages.filter(m => m.type === 'user');
  const averageResponseTime = 2.3; // Mock average response time in seconds
  
  // Calculate average text quality
  const documentsWithQuality = readyDocuments.filter(doc => doc.processingQuality !== undefined);
  const averageQuality = documentsWithQuality.length > 0 
    ? documentsWithQuality.reduce((acc, doc) => acc + (doc.processingQuality || 0), 0) / documentsWithQuality.length
    : 0;
    
  // Count total text improvements
  const totalImprovements = readyDocuments.reduce((acc, doc) => acc + (doc.textImprovements?.length || 0), 0);
  
  // Calculate document usage from sources
  const documentUsage = new Map<string, number>();
  messages.forEach(message => {
    if (message.sources) {
      message.sources.forEach(source => {
        const current = documentUsage.get(source.document) || 0;
        documentUsage.set(source.document, current + 1);
      });
    }
  });

  const mostUsedDocument = Array.from(documentUsage.entries())
    .sort(([,a], [,b]) => b - a)[0];

  const recentActivity = messages
    .slice(-5)
    .reverse()
    .map(message => ({
      type: message.type,
      timestamp: message.timestamp,
      preview: message.content.substring(0, 50) + '...'
    }));

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Document Analysis</h3>
      
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <FileText className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{documents.length}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Total Documents</p>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="font-medium">{readyDocuments.length}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Ready for Q&A</p>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <MessageSquare className="h-4 w-4 text-purple-500" />
            <span className="font-medium">{userMessages.length}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Questions Asked</p>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <Clock className="h-4 w-4 text-orange-500" />
            <span className="font-medium">{averageResponseTime}s</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Avg Response</p>
        </Card>
      </div>

      {/* Document Usage */}
      {mostUsedDocument && (
        <Card className="p-3">
          <h4 className="font-medium mb-2">Most Referenced</h4>
          <div className="flex items-center justify-between">
            <span className="text-sm truncate flex-1">{mostUsedDocument[0]}</span>
            <Badge variant="secondary" className="text-xs">
              {mostUsedDocument[1]} refs
            </Badge>
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card className="p-3">
          <h4 className="font-medium mb-2">Recent Activity</h4>
          <div className="space-y-2">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  activity.type === 'user' ? 'bg-blue-500' : 'bg-green-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">{activity.preview}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Text Quality Overview */}
      {documentsWithQuality.length > 0 && (
        <Card className="p-3">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500" />
            Text Processing
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Average Quality</span>
              <span className="font-medium">{Math.round(averageQuality * 100)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Enhancements Applied</span>
              <Badge variant="secondary" className="text-xs">
                {totalImprovements} improvements
              </Badge>
            </div>
          </div>
        </Card>
      )}

      {/* Storage Usage */}
      <Card className="p-3">
        <h4 className="font-medium mb-2">Storage</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total Pages</span>
            <span>{totalPages}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total Size</span>
            <span>
              {(documents.reduce((acc, doc) => acc + doc.size, 0) / (1024 * 1024)).toFixed(1)} MB
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}