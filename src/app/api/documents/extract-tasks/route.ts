// Extract tasks from documents endpoint

import { NextRequest, NextResponse } from 'next/server';
import { aiClient } from '@/lib/ai-client';
import { Task } from '@/types';

// Import documents store (in a real app, this would be a database)
let documentsStore: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, autoCreate = false } = body;
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required for task extraction' },
        { status: 400 }
      );
    }

    // Find the document
    const document = documentsStore.find(doc => doc.id === documentId);
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (!document.content) {
      return NextResponse.json(
        { error: 'Document has no content to extract tasks from' },
        { status: 400 }
      );
    }

    // Extract tasks using AI
    const taskPrompt = `Extract actionable tasks from this document: "${document.name}"

Content:
${document.content.substring(0, 4000)} ${document.content.length > 4000 ? '...' : ''}

Instructions:
1. Identify specific action items, to-dos, and next steps
2. Look for deadlines, due dates, and time-sensitive items
3. Find assignments and responsibilities mentioned
4. Extract follow-up actions and commitments
5. Prioritize based on urgency and importance mentioned

Return a JSON array of tasks with this structure:
{
  "title": "Clear, actionable task title",
  "description": "Detailed description with context",
  "priority": "low|medium|high|urgent",
  "category": "work|personal|project|meeting|etc",
  "dueDate": "ISO date string if mentioned",
  "tags": ["relevant", "tags", "from", "document"],
  "aiGenerated": true,
  "sourceDocument": "${document.name}"
}`;

    try {
      const extractedTasks = await aiClient.generateTasks(taskPrompt);
      
      // Process and format tasks
      const processedTasks = extractedTasks.map(taskData => {
        const now = new Date();
        
        return {
          id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: taskData.title || 'Untitled Task',
          description: taskData.description || '',
          priority: taskData.priority || 'medium',
          status: 'todo' as const,
          category: taskData.category || 'general',
          createdAt: now,
          updatedAt: now,
          tags: taskData.tags || [],
          aiGenerated: true,
          sourceDocument: document.name,
          ...(taskData.dueDate && { 
            dueDate: new Date(taskData.dueDate) 
          })
        } as Task;
      });

      // Update document with extracted tasks
      const updatedDocument = {
        ...document,
        extractedTasks: processedTasks
      };

      const docIndex = documentsStore.findIndex(doc => doc.id === documentId);
      if (docIndex !== -1) {
        documentsStore[docIndex] = updatedDocument;
      }

      // Optionally auto-create tasks if requested
      let createdTasks: Task[] = [];
      if (autoCreate && processedTasks.length > 0) {
        // In a real app, this would save to the tasks database
        createdTasks = processedTasks;
      }

      return NextResponse.json({
        extractedTasks: processedTasks,
        totalExtracted: processedTasks.length,
        autoCreated: autoCreate ? createdTasks.length : 0,
        createdTasks: autoCreate ? createdTasks : [],
        sourceDocument: {
          id: document.id,
          name: document.name
        },
        timestamp: new Date().toISOString()
      });

    } catch (aiError) {
      console.error('AI task extraction error:', aiError);
      
      return NextResponse.json(
        { 
          error: 'AI failed to extract tasks from document',
          details: aiError instanceof Error ? aiError.message : 'AI processing error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Task extraction error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to extract tasks from document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const document = documentsStore.find(doc => doc.id === documentId);
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      documentId: document.id,
      documentName: document.name,
      extractedTasks: document.extractedTasks || [],
      totalTasks: document.extractedTasks?.length || 0,
      hasTasksExtracted: Boolean(document.extractedTasks?.length)
    });

  } catch (error) {
    console.error('Get extracted tasks error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get extracted tasks' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}