'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Document } from '@/types';
import { validateFile, getFileTypeIcon, formatFileSize } from '@/lib/document-utils';

interface DocumentUploadProps {
  documents: Document[];
  onDocumentsChange: (documents: Document[]) => void;
  className?: string;
}

interface DocumentCardProps {
  document: Document;
  onAnalyze: (document: Document) => void;
  onExtractTasks: (document: Document) => void;
  onDelete: (documentId: string) => void;
}

function DocumentCard({ document, onAnalyze, onExtractTasks, onDelete }: DocumentCardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      await onAnalyze(document);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExtractTasks = async () => {
    setIsExtracting(true);
    try {
      await onExtractTasks(document);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getFileTypeIcon(document.type)}</div>
            <div className="flex-1">
              <CardTitle className="text-white text-sm font-medium">
                {document.name}
              </CardTitle>
              <CardDescription className="text-gray-400 text-xs">
                {formatFileSize(document.size)} • {document.uploadedAt.toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-red-400"
            onClick={() => onDelete(document.id)}
          >
            🗑️
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge 
            variant="secondary"
            className={document.analysisComplete ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}
          >
            {document.analysisComplete ? '✓ Analyzed' : '⏳ Pending'}
          </Badge>
          {document.extractedTasks && document.extractedTasks.length > 0 && (
            <Badge variant="secondary" className="bg-blue-900 text-blue-300">
              🤖 {document.extractedTasks.length} tasks
            </Badge>
          )}
        </div>

        {document.summary && (
          <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
            <h4 className="text-white text-sm font-medium mb-1">Summary</h4>
            <p className="text-gray-300 text-xs">{document.summary.substring(0, 200)}...</p>
          </div>
        )}

        {document.insights && document.insights.length > 0 && (
          <div className="mb-4">
            <h4 className="text-white text-sm font-medium mb-2">Key Insights</h4>
            <div className="space-y-1">
              {document.insights.slice(0, 2).map((insight, index) => (
                <div key={index} className="text-xs text-gray-400 flex items-start space-x-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col space-y-2">
          <Button
            size="sm"
            onClick={handleAnalyze}
            disabled={isAnalyzing || isExtracting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin mr-2"></div>
                Analyzing...
              </>
            ) : (
              <>🔍 {document.analysisComplete ? 'Re-analyze' : 'Analyze Document'}</>
            )}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleExtractTasks}
            disabled={isAnalyzing || isExtracting || !document.content}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            {isExtracting ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                Extracting...
              </>
            ) : (
              <>📋 Extract Tasks</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentDetailsDialog({ document }: { document: Document }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center space-x-2">
            <span>{getFileTypeIcon(document.type)}</span>
            <span>{document.name}</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Document analysis results and details
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {/* Document Info */}
            <div className="p-3 bg-gray-700/50 rounded-lg">
              <h4 className="text-white font-medium mb-2">Document Information</h4>
              <div className="space-y-1 text-sm">
                <p className="text-gray-300">Size: {formatFileSize(document.size)}</p>
                <p className="text-gray-300">Type: {document.type}</p>
                <p className="text-gray-300">Uploaded: {document.uploadedAt.toLocaleString()}</p>
                <p className="text-gray-300">Analysis: {document.analysisComplete ? 'Complete' : 'Pending'}</p>
              </div>
            </div>

            {/* Summary */}
            {document.summary && (
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <h4 className="text-white font-medium mb-2">Summary</h4>
                <p className="text-gray-300 text-sm">{document.summary}</p>
              </div>
            )}

            {/* Insights */}
            {document.insights && document.insights.length > 0 && (
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <h4 className="text-white font-medium mb-2">Key Insights</h4>
                <div className="space-y-2">
                  {document.insights.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <p className="text-gray-300 text-sm">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted Tasks */}
            {document.extractedTasks && document.extractedTasks.length > 0 && (
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <h4 className="text-white font-medium mb-2">Extracted Tasks</h4>
                <div className="space-y-2">
                  {document.extractedTasks.map((task, index) => (
                    <div key={index} className="p-2 bg-gray-800 rounded border border-gray-600">
                      <p className="text-white text-sm font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-gray-400 text-xs mt-1">{task.description}</p>
                      )}
                      <div className="flex space-x-2 mt-2">
                        {task.priority && (
                          <Badge variant="outline" className="text-xs">
                            {task.priority}
                          </Badge>
                        )}
                        {task.category && (
                          <Badge variant="secondary" className="text-xs">
                            {task.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content Preview */}
            {document.content && document.content.length < 1000 && (
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <h4 className="text-white font-medium mb-2">Content Preview</h4>
                <pre className="text-gray-300 text-xs whitespace-pre-wrap font-mono">
                  {document.content}
                </pre>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default function DocumentUpload({ documents, onDocumentsChange, className = '' }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    handleFileUpload(file);
  };

  const handleFileUpload = async (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      alert(`Upload failed: ${validation.error}`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      const newDocument: Document = {
        ...data.document,
        uploadedAt: new Date(data.document.uploadedAt)
      };

      onDocumentsChange([...documents, newDocument]);
      
      // Auto-analyze if it's a text document
      if (data.needsAnalysis === false) {
        setTimeout(() => handleAnalyzeDocument(newDocument), 1000);
      }

    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleAnalyzeDocument = async (document: Document) => {
    try {
      const response = await fetch('/api/documents/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          generateSummary: true,
          getInsights: true,
          extractTasks: false
        })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      const updatedDocument = { ...data.document };

      const updatedDocuments = documents.map(doc => 
        doc.id === document.id ? updatedDocument : doc
      );
      onDocumentsChange(updatedDocuments);

    } catch (error) {
      console.error('Analysis error:', error);
      alert(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExtractTasks = async (document: Document) => {
    try {
      const response = await fetch('/api/documents/extract-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          autoCreate: false
        })
      });

      if (!response.ok) {
        throw new Error('Task extraction failed');
      }

      const data = await response.json();
      
      // Update document with extracted tasks
      const updatedDocument = {
        ...document,
        extractedTasks: data.extractedTasks
      };

      const updatedDocuments = documents.map(doc => 
        doc.id === document.id ? updatedDocument : doc
      );
      onDocumentsChange(updatedDocuments);

      // Show success message
      alert(`Extracted ${data.totalExtracted} tasks from ${document.name}`);

    } catch (error) {
      console.error('Task extraction error:', error);
      alert(`Task extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      const updatedDocuments = documents.filter(doc => doc.id !== documentId);
      onDocumentsChange(updatedDocuments);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Document Analyzer</h2>
          <p className="text-gray-400">
            Upload documents for AI-powered analysis and task extraction
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <Card className="bg-gray-800/50 border-gray-700 mb-8">
        <CardContent className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="space-y-4">
                <div className="text-4xl">📤</div>
                <h3 className="text-lg font-semibold text-white">Uploading...</h3>
                <Progress value={uploadProgress} className="w-64 mx-auto" />
                <p className="text-sm text-gray-400">{uploadProgress}% complete</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-4xl">📄</div>
                <h3 className="text-lg font-semibold text-white">Upload Document</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  Drag and drop a document here, or click to select a file.
                  Supports PDF, Word, Text, Markdown, CSV, JSON (max 10MB)
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Choose File
                </Button>
              </div>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.md,.csv,.json"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </CardContent>
      </Card>

      {/* Documents Grid */}
      {documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map(document => (
            <div key={document.id} className="space-y-2">
              <DocumentCard
                document={document}
                onAnalyze={handleAnalyzeDocument}
                onExtractTasks={handleExtractTasks}
                onDelete={handleDeleteDocument}
              />
              <DocumentDetailsDialog document={document} />
            </div>
          ))}
        </div>
      ) : (
        <Card className="bg-gray-800/50 border-gray-700 text-center py-12">
          <CardContent>
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-white mb-2">No documents yet</h3>
            <p className="text-gray-400 mb-6">
              Upload your first document to get AI-powered insights and automatic task extraction
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}