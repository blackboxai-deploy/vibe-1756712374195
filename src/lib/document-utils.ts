// Document processing utilities

import { Document } from '@/types';

/**
 * Generate a unique document ID
 */
export function generateDocumentId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convert file to base64
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove data URL prefix to get just base64
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Extract text content from file
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type.toLowerCase();
  
  if (fileType.includes('text/') || fileType.includes('application/json')) {
    // Plain text files
    return await file.text();
  }
  
  if (fileType.includes('application/pdf')) {
    // For PDF files, we'll send to AI for processing
    return `[PDF File: ${file.name} - ${file.size} bytes]`;
  }
  
  if (fileType.includes('application/msword') || 
      fileType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
    // For Word documents, we'll send to AI for processing
    return `[Word Document: ${file.name} - ${file.size} bytes]`;
  }
  
  if (fileType.includes('text/markdown')) {
    return await file.text();
  }
  
  // For other file types, return basic info
  return `[File: ${file.name} - Type: ${file.type} - Size: ${file.size} bytes]`;
}

/**
 * Validate file for processing
 */
export function validateFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const maxSize = 10 * 1024 * 1024; // 10MB limit
  const supportedTypes = [
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size exceeds 10MB limit'
    };
  }

  if (!supportedTypes.some(type => file.type.toLowerCase().includes(type.split('/')[1]))) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}. Supported types: PDF, Word, Text, Markdown, CSV, JSON, Excel`
    };
  }

  return { valid: true };
}

/**
 * Create document object from file
 */
export async function createDocumentFromFile(file: File): Promise<Document> {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const content = await extractTextFromFile(file);
  
  return {
    id: generateDocumentId(),
    name: file.name,
    type: file.type,
    size: file.size,
    uploadedAt: new Date(),
    content,
    analysisComplete: false
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  
  return `${Math.round(size * 100) / 100} ${sizes[i]}`;
}

/**
 * Get file type icon/emoji
 */
export function getFileTypeIcon(mimeType: string): string {
  const type = mimeType.toLowerCase();
  
  if (type.includes('pdf')) return '📄';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
  if (type.includes('image')) return '🖼️';
  if (type.includes('text')) return '📃';
  if (type.includes('json')) return '📋';
  if (type.includes('csv')) return '📈';
  if (type.includes('markdown')) return '📖';
  
  return '📎';
}

/**
 * Extract key information from document content
 */
export function extractDocumentInfo(content: string): {
  wordCount: number;
  estimatedReadTime: number;
  keyPhrases: string[];
  hasNumbers: boolean;
  hasDates: boolean;
  hasEmails: boolean;
  hasUrls: boolean;
} {
  const wordCount = content.trim().split(/\s+/).length;
  const readingSpeed = 200; // words per minute
  const readTime = Math.ceil(wordCount / readingSpeed);
  
  // Extract key information
  const numberPattern = /\b\d+(?:\.\d+)?\b/g;
  const datePattern = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/g;
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const urlPattern = /https?:\/\/[^\s]+/g;
  
  // Simple key phrase extraction (most common non-stop words)
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
  ]);
  
  const wordFreq: Record<string, number> = {};
  const wordMatches = content.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  
  wordMatches.forEach(word => {
    if (!stopWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  const keyPhrases = Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
  
  return {
    wordCount,
    estimatedReadTime: readTime,
    keyPhrases,
    hasNumbers: numberPattern.test(content),
    hasDates: datePattern.test(content),
    hasEmails: emailPattern.test(content),
    hasUrls: urlPattern.test(content)
  };
}

/**
 * Search within document content
 */
export function searchInDocument(document: Document, query: string): {
  matches: Array<{
    text: string;
    context: string;
    position: number;
  }>;
  totalMatches: number;
} {
  if (!document.content || !query.trim()) {
    return { matches: [], totalMatches: 0 };
  }
  
  const searchTerm = query.toLowerCase();
  const content = document.content.toLowerCase();
  const matches: Array<{ text: string; context: string; position: number }> = [];
  
  let position = 0;
  while ((position = content.indexOf(searchTerm, position)) !== -1) {
    const contextStart = Math.max(0, position - 50);
    const contextEnd = Math.min(content.length, position + searchTerm.length + 50);
    const context = document.content.substring(contextStart, contextEnd);
    
    matches.push({
      text: document.content.substring(position, position + searchTerm.length),
      context,
      position
    });
    
    position += searchTerm.length;
  }
  
  return {
    matches,
    totalMatches: matches.length
  };
}

/**
 * Save documents to localStorage
 */
export function saveDocumentsToStorage(documents: Document[]): void {
  try {
    localStorage.setItem('ai_assistant_documents', JSON.stringify(documents));
  } catch (error) {
    console.error('Failed to save documents to storage:', error);
  }
}

/**
 * Load documents from localStorage
 */
export function loadDocumentsFromStorage(): Document[] {
  try {
    const stored = localStorage.getItem('ai_assistant_documents');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((doc: any) => ({
        ...doc,
        uploadedAt: new Date(doc.uploadedAt)
      }));
    }
  } catch (error) {
    console.error('Failed to load documents from storage:', error);
  }
  return [];
}

/**
 * Get document analysis summary
 */
export function getDocumentSummary(document: Document): {
  title: string;
  subtitle: string;
  stats: Array<{ label: string; value: string }>;
  status: 'pending' | 'analyzing' | 'complete';
} {
  const info = document.content ? extractDocumentInfo(document.content) : null;
  
  return {
    title: document.name,
    subtitle: `${getFileTypeIcon(document.type)} ${document.type}`,
    stats: [
      { label: 'Size', value: formatFileSize(document.size) },
      { label: 'Words', value: info?.wordCount.toString() || '0' },
      { label: 'Read Time', value: info ? `${info.estimatedReadTime} min` : 'N/A' },
      { label: 'Uploaded', value: document.uploadedAt.toLocaleDateString() }
    ],
    status: document.analysisComplete ? 'complete' : 'pending'
  };
}

/**
 * Generate document insights prompt
 */
export function generateDocumentPrompt(document: Document, analysisType: 'summary' | 'tasks' | 'insights' | 'qa'): string {
  const baseInfo = `Document: ${document.name} (${document.type}, ${formatFileSize(document.size)})`;
  
  switch (analysisType) {
    case 'summary':
      return `${baseInfo}

Please provide a comprehensive summary of this document including:
1. Main topics and themes
2. Key points and findings
3. Important details and context
4. Overall purpose and conclusion`;

    case 'tasks':
      return `${baseInfo}

Extract actionable tasks and next steps from this document:
1. Specific action items mentioned
2. Deadlines and due dates
3. Responsibilities and assignments
4. Follow-up actions required

Format as a JSON array of tasks with: title, description, priority, dueDate, category`;

    case 'insights':
      return `${baseInfo}

Provide analytical insights about this document:
1. Key trends or patterns identified
2. Important data points or metrics
3. Potential implications or consequences
4. Strategic recommendations or suggestions
5. Areas requiring attention or concern`;

    case 'qa':
      return `${baseInfo}

Prepare to answer questions about this document. Focus on:
1. Understanding the main content and context
2. Identifying key facts, figures, and details
3. Recognizing relationships and connections
4. Being ready to explain concepts and terminology used`;

    default:
      return `${baseInfo}\n\nPlease analyze this document and provide relevant insights.`;
  }
}