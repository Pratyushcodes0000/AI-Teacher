import React, { useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface Document {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
  status: 'processing' | 'ready' | 'error';
}

interface DocumentUploaderProps {
  documents: Document[];
  onUpload: (files: FileList) => void;
  onRemove: (id: string) => void;
}

export function DocumentUploader({ documents, onUpload, onRemove }: DocumentUploaderProps) {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onUpload(files);
    }
  }, [onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
  }, [onUpload]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <Card
        className="border-2 border-dashed border-muted-foreground/25 p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="flex flex-col items-center gap-4">
          <Upload className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="text-lg mb-2">Drop PDF files here or click to upload</p>
            <p className="text-sm text-muted-foreground">
              Support for PDF documents up to 10MB
            </p>
          </div>
          <input
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <Button asChild>
            <label htmlFor="file-upload" className="cursor-pointer">
              Choose Files
            </label>
          </Button>
        </div>
      </Card>

      {documents.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Uploaded Documents</h3>
          {documents.map((doc) => (
            <Card key={doc.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(doc.size)} • {doc.status === 'ready' ? 'Ready' : doc.status === 'processing' ? 'Processing...' : 'Error'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(doc.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}