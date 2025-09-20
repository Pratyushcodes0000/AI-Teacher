import React from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

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

interface ExportChatButtonProps {
  messages: Message[];
  disabled?: boolean;
}

export function ExportChatButton({ messages, disabled }: ExportChatButtonProps) {
  const exportToMarkdown = () => {
    if (messages.length === 0) return;

    const markdown = messages.map(message => {
      const timestamp = message.timestamp.toLocaleString();
      const header = message.type === 'user' 
        ? `## 🙋 Question (${timestamp})\n\n`
        : `## 🤖 Answer (${timestamp})\n\n`;
      
      let content = header + message.content + '\n\n';
      
      if (message.sources && message.sources.length > 0) {
        content += '### Sources:\n\n';
        message.sources.forEach((source, index) => {
          content += `${index + 1}. **${source.document}** (Page ${source.page})\n`;
          content += `   > ${source.excerpt}\n\n`;
        });
      }
      
      return content;
    }).join('---\n\n');

    const finalMarkdown = `# Academic Assistant Chat Export\n\nExported on: ${new Date().toLocaleString()}\n\n---\n\n${markdown}`;
    
    const blob = new Blob([finalMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `academic-chat-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToTxt = () => {
    if (messages.length === 0) return;

    const text = messages.map(message => {
      const timestamp = message.timestamp.toLocaleString();
      const header = message.type === 'user' 
        ? `QUESTION (${timestamp}):\n`
        : `ANSWER (${timestamp}):\n`;
      
      let content = header + message.content + '\n';
      
      if (message.sources && message.sources.length > 0) {
        content += '\nSOURCES:\n';
        message.sources.forEach((source, index) => {
          content += `${index + 1}. ${source.document} (Page ${source.page})\n`;
          content += `   "${source.excerpt}"\n`;
        });
      }
      
      return content;
    }).join('\n' + '='.repeat(80) + '\n\n');

    const finalText = `ACADEMIC ASSISTANT CHAT EXPORT\n\nExported on: ${new Date().toLocaleString()}\n\n${'='.repeat(80)}\n\n${text}`;
    
    const blob = new Blob([finalText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `academic-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (messages.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Download className="h-4 w-4 mr-2" />
          Export Chat
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToMarkdown}>
          <FileText className="h-4 w-4 mr-2" />
          Export as Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToTxt}>
          <FileText className="h-4 w-4 mr-2" />
          Export as Text
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}