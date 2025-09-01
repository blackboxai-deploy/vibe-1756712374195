// Task management CRUD API endpoints

import { NextRequest, NextResponse } from 'next/server';
import { Task } from '@/types';

// In a real application, this would be a database
// For this demo, we'll use a simple in-memory store that persists in localStorage client-side
let tasksStore: Task[] = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');
    const sortBy = searchParams.get('sortBy');
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    let filteredTasks = [...tasksStore];

    // Apply filters
    if (status) {
      filteredTasks = filteredTasks.filter(task => task.status === status);
    }

    if (category) {
      filteredTasks = filteredTasks.filter(task => task.category === category);
    }

    if (filter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      filteredTasks = filteredTasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today && dueDate < tomorrow;
      });
    }

    if (filter === 'overdue') {
      const now = new Date();
      filteredTasks = filteredTasks.filter(task => 
        task.dueDate && 
        task.dueDate < now && 
        task.status !== 'completed' && 
        task.status !== 'cancelled'
      );
    }

    // Apply sorting
    if (sortBy === 'priority') {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      filteredTasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    } else if (sortBy === 'dueDate') {
      filteredTasks.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    }

    return NextResponse.json({
      tasks: filteredTasks,
      total: filteredTasks.length
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const taskData = await request.json();

    // Validate required fields
    if (!taskData.title || typeof taskData.title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required and must be a string' },
        { status: 400 }
      );
    }

    // Create new task
    const newTask: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: taskData.title,
      description: taskData.description || '',
      priority: taskData.priority || 'medium',
      status: taskData.status || 'todo',
      category: taskData.category || 'general',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: taskData.tags || [],
      aiGenerated: taskData.aiGenerated || false,
      ...(taskData.dueDate && { dueDate: new Date(taskData.dueDate) }),
      ...(taskData.sourceDocument && { sourceDocument: taskData.sourceDocument })
    };

    tasksStore.push(newTask);

    return NextResponse.json(newTask, { status: 201 });

  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const taskData = await request.json();

    if (!taskData.id) {
      return NextResponse.json(
        { error: 'Task ID is required for updates' },
        { status: 400 }
      );
    }

    const taskIndex = tasksStore.findIndex(task => task.id === taskData.id);
    if (taskIndex === -1) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Update task
    const updatedTask: Task = {
      ...tasksStore[taskIndex],
      ...taskData,
      updatedAt: new Date(),
      // Ensure date fields are properly converted
      ...(taskData.dueDate && { dueDate: new Date(taskData.dueDate) })
    };

    tasksStore[taskIndex] = updatedTask;

    return NextResponse.json(updatedTask);

  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('id');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const taskIndex = tasksStore.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const deletedTask = tasksStore.splice(taskIndex, 1)[0];

    return NextResponse.json({ 
      message: 'Task deleted successfully',
      deletedTask 
    });

  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}