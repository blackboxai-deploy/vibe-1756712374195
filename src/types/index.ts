// Core Types for Personal AI Productivity Assistant

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in-progress' | 'completed' | 'cancelled';
  category: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  aiGenerated: boolean;
  sourceDocument?: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type: 'text' | 'voice' | 'document';
  metadata?: {
    voiceRecording?: boolean;
    documentName?: string;
    taskIds?: string[];
  };
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  content?: string;
  summary?: string;
  insights?: string[];
  extractedTasks?: Partial<Task>[];
  analysisComplete: boolean;
}

export interface VoiceSession {
  id: string;
  isRecording: boolean;
  isProcessing: boolean;
  transcript?: string;
  confidence?: number;
  startTime?: Date;
  endTime?: Date;
}

export interface AISettings {
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  voiceEnabled: boolean;
  autoTaskGeneration: boolean;
  documentAutoAnalysis: boolean;
}

export interface AppState {
  tasks: Task[];
  documents: Document[];
  aiMessages: AIMessage[];
  currentVoiceSession?: VoiceSession;
  settings: AISettings;
  isLoading: boolean;
  error?: string;
}

// API Request/Response Types
export interface ChatRequest {
  message: string;
  context?: {
    tasks?: Task[];
    documents?: Document[];
    voiceMode?: boolean;
  };
}

export interface ChatResponse {
  response: string;
  suggestions?: string[];
  generatedTasks?: Partial<Task>[];
  actions?: {
    type: 'create_task' | 'update_task' | 'analyze_document';
    data: any;
  }[];
}

export interface TaskGenerationRequest {
  input: string;
  context?: {
    existingTasks: Task[];
    documents?: Document[];
  };
}

export interface DocumentAnalysisRequest {
  documentId: string;
  extractTasks: boolean;
  generateSummary: boolean;
  getInsights: boolean;
}

export interface DocumentAnalysisResponse {
  summary?: string;
  insights?: string[];
  extractedTasks?: Partial<Task>[];
  keyTopics?: string[];
  actionItems?: string[];
}

export interface VoiceProcessingRequest {
  audioData: string; // base64 encoded audio
  action: 'transcribe' | 'synthesize';
  text?: string; // for synthesis
}

export interface VoiceProcessingResponse {
  transcript?: string;
  audioUrl?: string;
  confidence?: number;
  success: boolean;
  error?: string;
}

// Utility Types
export type TaskFilter = {
  status?: Task['status'][];
  priority?: Task['priority'][];
  category?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  aiGenerated?: boolean;
};

export type SortOption = 'priority' | 'dueDate' | 'createdAt' | 'title' | 'status';

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  byPriority: Record<Task['priority'], number>;
  byCategory: Record<string, number>;
}