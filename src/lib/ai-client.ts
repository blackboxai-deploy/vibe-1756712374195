// AI Client for OpenRouter API Integration

import { ChatRequest, ChatResponse, DocumentAnalysisResponse } from '@/types';

// Custom OpenRouter endpoint configuration (no API keys required)
const AI_CONFIG = {
  endpoint: 'https://oi-server.onrender.com/chat/completions',
  headers: {
    'customerId': 'sunelepraveen987@gmail.com',
    'Content-Type': 'application/json',
    'Authorization': 'Bearer xxx'
  },
  model: 'openrouter/anthropic/claude-sonnet-4',
  maxTokens: 4000,
  temperature: 0.7
};

// Default system prompt for the AI assistant
export const DEFAULT_SYSTEM_PROMPT = `You are a Personal AI Productivity Assistant that combines task management, voice interaction, and document analysis capabilities.

Your core responsibilities:
1. TASK MANAGEMENT: Help create, organize, prioritize, and track tasks intelligently
2. VOICE ASSISTANCE: Respond to voice commands and provide audio feedback
3. DOCUMENT ANALYSIS: Analyze uploaded documents and extract actionable insights

Key behaviors:
- Parse natural language into structured tasks with priorities and categories
- Suggest task scheduling and conflict resolution
- Extract action items from documents automatically  
- Provide productivity advice and insights
- Maintain context across conversations
- Be concise but helpful in responses

When creating tasks from user input:
- Always include a clear title and description
- Set appropriate priority levels (low, medium, high, urgent)
- Suggest relevant categories and tags
- Estimate due dates when context allows
- Mark as AI-generated for tracking

For document analysis:
- Provide clear summaries and key insights
- Extract specific action items and next steps
- Identify important dates, deadlines, and commitments
- Suggest related tasks based on document content

Respond in JSON format when creating tasks or analyzing documents.`;

export class AIClient {
  private systemPrompt: string;

  constructor(customSystemPrompt?: string) {
    this.systemPrompt = customSystemPrompt || DEFAULT_SYSTEM_PROMPT;
  }

  /**
   * Send a chat message to the AI assistant
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const messages = [
        {
          role: 'system' as const,
          content: this.systemPrompt
        },
        {
          role: 'user' as const,
          content: this.buildUserMessage(request)
        }
      ];

      const response = await fetch(AI_CONFIG.endpoint, {
        method: 'POST',
        headers: AI_CONFIG.headers,
        body: JSON.stringify({
          model: AI_CONFIG.model,
          messages,
          max_tokens: AI_CONFIG.maxTokens,
          temperature: AI_CONFIG.temperature
        })
      });

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || '';

      return this.parseAIResponse(aiResponse);
    } catch (error) {
      console.error('AI chat error:', error);
      throw new Error('Failed to get AI response. Please try again.');
    }
  }

  /**
   * Analyze a document with AI
   */
  async analyzeDocument(
    documentContent: string,
    documentName: string,
    options: {
      extractTasks: boolean;
      generateSummary: boolean;
      getInsights: boolean;
    }
  ): Promise<DocumentAnalysisResponse> {
    try {
      const analysisPrompt = this.buildDocumentAnalysisPrompt(documentContent, documentName, options);
      
      const messages = [
        {
          role: 'system' as const,
          content: `You are an expert document analyzer. Analyze the provided document and return structured insights in JSON format.`
        },
        {
          role: 'user' as const,
          content: [
            { type: 'text', text: analysisPrompt },
            { type: 'file', file: { filename: documentName, file_data: `data:text/plain;base64,${btoa(documentContent)}` } }
          ]
        }
      ];

      const response = await fetch(AI_CONFIG.endpoint, {
        method: 'POST',
        headers: AI_CONFIG.headers,
        body: JSON.stringify({
          model: AI_CONFIG.model,
          messages,
          max_tokens: AI_CONFIG.maxTokens,
          temperature: 0.3 // Lower temperature for more factual analysis
        })
      });

      if (!response.ok) {
        throw new Error(`Document analysis failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const analysisResult = data.choices[0]?.message?.content || '';

      return this.parseDocumentAnalysis(analysisResult);
    } catch (error) {
      console.error('Document analysis error:', error);
      throw new Error('Failed to analyze document. Please try again.');
    }
  }

  /**
   * Generate tasks from natural language input
   */
  async generateTasks(input: string, context?: { existingTasks?: any[]; documents?: any[] }): Promise<any[]> {
    try {
      const taskPrompt = `Create structured tasks from this input: "${input}"

Context: ${context ? JSON.stringify(context, null, 2) : 'None'}

Return JSON array of tasks with this structure:
{
  "title": "Clear task title",
  "description": "Detailed description",
  "priority": "low|medium|high|urgent",
  "category": "work|personal|health|shopping|etc",
  "dueDate": "ISO date string if mentioned or implied",
  "tags": ["relevant", "tags"],
  "aiGenerated": true
}`;

      const messages = [
        {
          role: 'system' as const,
          content: 'You are a task creation specialist. Convert natural language into well-structured tasks.'
        },
        {
          role: 'user' as const,
          content: taskPrompt
        }
      ];

      const response = await fetch(AI_CONFIG.endpoint, {
        method: 'POST',
        headers: AI_CONFIG.headers,
        body: JSON.stringify({
          model: AI_CONFIG.model,
          messages,
          max_tokens: 2000,
          temperature: 0.5
        })
      });

      if (!response.ok) {
        throw new Error(`Task generation failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const tasksResult = data.choices[0]?.message?.content || '';

      return this.parseTasksFromResponse(tasksResult);
    } catch (error) {
      console.error('Task generation error:', error);
      throw new Error('Failed to generate tasks. Please try again.');
    }
  }

  /**
   * Update system prompt
   */
  updateSystemPrompt(newPrompt: string): void {
    this.systemPrompt = newPrompt;
  }

  /**
   * Get current system prompt
   */
  getSystemPrompt(): string {
    return this.systemPrompt;
  }

  // Private helper methods

  private buildUserMessage(request: ChatRequest): string {
    let message = request.message;
    
    if (request.context) {
      message += '\n\nContext:\n';
      
      if (request.context.tasks?.length) {
        message += `Current tasks: ${JSON.stringify(request.context.tasks.slice(0, 10), null, 2)}\n`;
      }
      
      if (request.context.documents?.length) {
        message += `Recent documents: ${request.context.documents.map(d => d.name).join(', ')}\n`;
      }
      
      if (request.context.voiceMode) {
        message += 'Note: This is a voice interaction - provide concise, spoken-friendly responses.\n';
      }
    }
    
    return message;
  }

  private buildDocumentAnalysisPrompt(
    _content: string, 
    name: string, 
    options: { extractTasks: boolean; generateSummary: boolean; getInsights: boolean }
  ): string {
    let prompt = `Analyze this document: "${name}"\n\n`;
    
    if (options.generateSummary) {
      prompt += '1. Provide a concise summary (2-3 sentences)\n';
    }
    
    if (options.getInsights) {
      prompt += '2. Extract 3-5 key insights or important points\n';
    }
    
    if (options.extractTasks) {
      prompt += '3. Identify actionable tasks, deadlines, and next steps\n';
    }
    
    prompt += '\nReturn response as JSON with keys: summary, insights, extractedTasks, keyTopics, actionItems';
    
    return prompt;
  }

  private parseAIResponse(response: string): ChatResponse {
    try {
      // Try to parse as JSON first (for structured responses)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          response: parsed.response || response,
          suggestions: parsed.suggestions,
          generatedTasks: parsed.generatedTasks,
          actions: parsed.actions
        };
      }
    } catch (error) {
      // Fallback to plain text response
    }
    
    return {
      response: response.trim(),
      suggestions: [],
      generatedTasks: []
    };
  }

  private parseDocumentAnalysis(response: string): DocumentAnalysisResponse {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse document analysis:', error);
    }
    
    return {
      summary: response,
      insights: [],
      extractedTasks: [],
      keyTopics: [],
      actionItems: []
    };
  }

  private parseTasksFromResponse(response: string): any[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse tasks:', error);
    }
    
    return [];
  }
}

// Export singleton instance
export const aiClient = new AIClient();