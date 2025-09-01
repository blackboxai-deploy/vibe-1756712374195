// Utility functions for task management

import { Task, TaskFilter, TaskStats, SortOption } from '@/types';

/**
 * Generate a unique task ID
 */
export function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new task with default values
 */
export function createTask(partial: Partial<Task>): Task {
  const now = new Date();
  
  return {
    id: generateTaskId(),
    title: '',
    priority: 'medium',
    status: 'todo',
    category: 'general',
    createdAt: now,
    updatedAt: now,
    tags: [],
    aiGenerated: false,
    ...partial
  };
}

/**
 * Filter tasks based on criteria
 */
export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  return tasks.filter(task => {
    // Filter by status
    if (filter.status && !filter.status.includes(task.status)) {
      return false;
    }
    
    // Filter by priority
    if (filter.priority && !filter.priority.includes(task.priority)) {
      return false;
    }
    
    // Filter by category
    if (filter.category && !filter.category.includes(task.category)) {
      return false;
    }
    
    // Filter by AI generated
    if (filter.aiGenerated !== undefined && task.aiGenerated !== filter.aiGenerated) {
      return false;
    }
    
    // Filter by date range
    if (filter.dateRange) {
      const taskDate = task.dueDate || task.createdAt;
      if (taskDate < filter.dateRange.start || taskDate > filter.dateRange.end) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Sort tasks by specified option
 */
export function sortTasks(tasks: Task[], sortBy: SortOption, ascending = false): Task[] {
  return [...tasks].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
        
      case 'dueDate':
        const aDate = a.dueDate || new Date('9999-12-31');
        const bDate = b.dueDate || new Date('9999-12-31');
        comparison = aDate.getTime() - bDate.getTime();
        break;
        
      case 'createdAt':
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
        break;
        
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
        
      case 'status':
        const statusOrder = { todo: 1, 'in-progress': 2, completed: 3, cancelled: 4 };
        comparison = statusOrder[a.status] - statusOrder[b.status];
        break;
        
      default:
        comparison = 0;
    }
    
    return ascending ? comparison : -comparison;
  });
}

/**
 * Calculate task statistics
 */
export function calculateTaskStats(tasks: Task[]): TaskStats {
  const stats: TaskStats = {
    total: tasks.length,
    completed: 0,
    inProgress: 0,
    overdue: 0,
    byPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
    byCategory: {}
  };
  
  const now = new Date();
  
  tasks.forEach(task => {
    // Count by status
    if (task.status === 'completed') {
      stats.completed++;
    } else if (task.status === 'in-progress') {
      stats.inProgress++;
    }
    
    // Count overdue tasks
    if (task.dueDate && task.dueDate < now && task.status !== 'completed') {
      stats.overdue++;
    }
    
    // Count by priority
    stats.byPriority[task.priority]++;
    
    // Count by category
    if (!stats.byCategory[task.category]) {
      stats.byCategory[task.category] = 0;
    }
    stats.byCategory[task.category]++;
  });
  
  return stats;
}

/**
 * Get tasks due today
 */
export function getTasksDueToday(tasks: Task[]): Task[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate >= today && dueDate < tomorrow;
  });
}

/**
 * Get overdue tasks
 */
export function getOverdueTasks(tasks: Task[]): Task[] {
  const now = new Date();
  return tasks.filter(task => 
    task.dueDate && 
    task.dueDate < now && 
    task.status !== 'completed' && 
    task.status !== 'cancelled'
  );
}

/**
 * Get upcoming tasks (next 7 days)
 */
export function getUpcomingTasks(tasks: Task[]): Task[] {
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  return tasks.filter(task => 
    task.dueDate && 
    task.dueDate >= now && 
    task.dueDate <= nextWeek &&
    task.status !== 'completed'
  );
}

/**
 * Update task status and modification time
 */
export function updateTask(task: Task, updates: Partial<Task>): Task {
  return {
    ...task,
    ...updates,
    updatedAt: new Date()
  };
}

/**
 * Mark task as completed
 */
export function completeTask(task: Task): Task {
  return updateTask(task, { status: 'completed' });
}

/**
 * Get task priority color
 */
export function getTaskPriorityColor(priority: Task['priority']): string {
  switch (priority) {
    case 'urgent': return 'text-red-500 border-red-500';
    case 'high': return 'text-orange-500 border-orange-500';
    case 'medium': return 'text-yellow-500 border-yellow-500';
    case 'low': return 'text-green-500 border-green-500';
    default: return 'text-gray-500 border-gray-500';
  }
}

/**
 * Get task status color
 */
export function getTaskStatusColor(status: Task['status']): string {
  switch (status) {
    case 'completed': return 'text-green-500 bg-green-100';
    case 'in-progress': return 'text-blue-500 bg-blue-100';
    case 'cancelled': return 'text-red-500 bg-red-100';
    case 'todo': return 'text-gray-500 bg-gray-100';
    default: return 'text-gray-500 bg-gray-100';
  }
}

/**
 * Format due date for display
 */
export function formatDueDate(date: Date | undefined): string {
  if (!date) return 'No due date';
  
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `Overdue by ${Math.abs(diffDays)} day(s)`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} day(s)`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Parse natural language date
 */
export function parseNaturalDate(input: string): Date | null {
  const lower = input.toLowerCase();
  const now = new Date();
  
  if (lower.includes('today')) {
    return now;
  }
  
  if (lower.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  
  if (lower.includes('next week')) {
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;
  }
  
  // Try to parse specific dates
  const dateMatch = lower.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dateMatch) {
    const [, month, day, year] = dateMatch;
    const fullYear = year.length === 2 ? 2000 + parseInt(year) : parseInt(year);
    return new Date(fullYear, parseInt(month) - 1, parseInt(day));
  }
  
  return null;
}

/**
 * Extract category from task text
 */
export function extractCategory(text: string): string {
  const lower = text.toLowerCase();
  
  if (lower.includes('work') || lower.includes('office') || lower.includes('meeting')) {
    return 'work';
  }
  if (lower.includes('personal') || lower.includes('home') || lower.includes('family')) {
    return 'personal';
  }
  if (lower.includes('health') || lower.includes('doctor') || lower.includes('exercise')) {
    return 'health';
  }
  if (lower.includes('shop') || lower.includes('buy') || lower.includes('purchase')) {
    return 'shopping';
  }
  if (lower.includes('learn') || lower.includes('study') || lower.includes('course')) {
    return 'learning';
  }
  
  return 'general';
}

/**
 * Save tasks to localStorage
 */
export function saveTasksToStorage(tasks: Task[]): void {
  try {
    localStorage.setItem('ai_assistant_tasks', JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to save tasks to storage:', error);
  }
}

/**
 * Load tasks from localStorage
 */
export function loadTasksFromStorage(): Task[] {
  try {
    const stored = localStorage.getItem('ai_assistant_tasks');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined
      }));
    }
  } catch (error) {
    console.error('Failed to load tasks from storage:', error);
  }
  return [];
}