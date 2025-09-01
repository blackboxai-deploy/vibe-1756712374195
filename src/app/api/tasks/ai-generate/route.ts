// AI-powered task generation endpoint

import { NextRequest, NextResponse } from 'next/server';
import { aiClient } from '@/lib/ai-client';
import { TaskGenerationRequest, Task } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: TaskGenerationRequest = await request.json();
    
    if (!body.input || typeof body.input !== 'string') {
      return NextResponse.json(
        { error: 'Input text is required for task generation' },
        { status: 400 }
      );
    }

    // Generate tasks using AI
    const generatedTasks = await aiClient.generateTasks(body.input, body.context);
    
    // Process and format the generated tasks
    const processedTasks = generatedTasks.map(taskData => {
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
        ...(taskData.dueDate && { 
          dueDate: new Date(taskData.dueDate) 
        })
      } as Task;
    });

    return NextResponse.json({
      tasks: processedTasks,
      generated: processedTasks.length,
      source: 'ai_generation',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI task generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate tasks with AI',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}