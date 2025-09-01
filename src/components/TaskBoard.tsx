'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Task } from '@/types';
import { 
  getTaskPriorityColor, 
  formatDueDate, 
  updateTask, 
  completeTask,
  createTask
} from '@/lib/task-utils';

interface TaskBoardProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  className?: string;
}

interface TaskCardProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

function TaskCard({ task, onUpdate, onDelete }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    status: task.status,
    category: task.category,
    dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : ''
  });

  const handleStatusChange = (newStatus: Task['status']) => {
    const updatedTask = updateTask(task, { status: newStatus });
    onUpdate(updatedTask);
  };

  const handleComplete = () => {
    const completedTask = completeTask(task);
    onUpdate(completedTask);
  };

  const handleSaveEdit = () => {
    const updatedTask = updateTask(task, {
      title: editForm.title || 'Untitled Task',
      description: editForm.description,
      priority: editForm.priority,
      status: editForm.status,
      category: editForm.category,
      dueDate: editForm.dueDate ? new Date(editForm.dueDate) : undefined
    });
    onUpdate(updatedTask);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-4 space-y-4">
          <Input
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            placeholder="Task title"
            className="bg-gray-700 border-gray-600 text-white"
          />
          <Textarea
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            placeholder="Description (optional)"
            className="bg-gray-700 border-gray-600 text-white min-h-20"
          />
          <div className="grid grid-cols-2 gap-3">
            <Select value={editForm.priority} onValueChange={(value) => setEditForm({ ...editForm, priority: value as Task['priority'] })}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value as Task['status'] })}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              value={editForm.category}
              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              placeholder="Category"
              className="bg-gray-700 border-gray-600 text-white"
            />
            <Input
              type="date"
              value={editForm.dueDate}
              onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700">
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-white text-sm font-medium flex-1">
            {task.title}
          </CardTitle>
          <div className="flex space-x-1 ml-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-white"
              onClick={() => setIsEditing(true)}
            >
              ✏️
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-red-400"
              onClick={() => onDelete(task.id)}
            >
              🗑️
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {task.description && (
          <p className="text-sm text-gray-400 mb-3">{task.description}</p>
        )}
        
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge className={getTaskPriorityColor(task.priority)} variant="outline">
            {task.priority}
          </Badge>
          <Badge className="bg-gray-700 text-gray-300">
            {task.category}
          </Badge>
          {task.aiGenerated && (
            <Badge className="bg-purple-900 text-purple-300" variant="secondary">
              🤖 AI
            </Badge>
          )}
        </div>

        {task.dueDate && (
          <p className="text-xs text-gray-500 mb-3">
            📅 {formatDueDate(task.dueDate)}
          </p>
        )}

        <div className="flex justify-between items-center">
          <Select value={task.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          {task.status !== 'completed' && (
            <Button
              size="sm"
              onClick={handleComplete}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              ✓ Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CreateTaskDialog({ onTaskCreate }: { onTaskCreate: (task: Task) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    category: 'general',
    dueDate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const newTask = createTask({
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
      category: formData.category || 'general',
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined
    });

    onTaskCreate(newTask);
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      category: 'general',
      dueDate: ''
    });
    
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          + Create Task
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Task</DialogTitle>
          <DialogDescription className="text-gray-400">
            Add a new task to your productivity list
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-white">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title"
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description" className="text-white">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the task (optional)"
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority" className="text-white">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as Task['priority'] })}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category" className="text-white">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., work, personal"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="dueDate" className="text-white">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function TaskBoard({ tasks, onTasksChange, className = '' }: TaskBoardProps) {
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('priority');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter and sort tasks
  const filteredTasks = tasks.filter(task => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!task.title.toLowerCase().includes(searchLower) && 
          !task.description?.toLowerCase().includes(searchLower) &&
          !task.category.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Status filter
    if (filter === 'active') return task.status !== 'completed' && task.status !== 'cancelled';
    if (filter === 'completed') return task.status === 'completed';
    if (filter === 'overdue') {
      const now = new Date();
      return task.dueDate && task.dueDate < now && task.status !== 'completed';
    }
    
    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    if (sortBy === 'dueDate') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.getTime() - b.dueDate.getTime();
    }
    if (sortBy === 'created') {
      return b.createdAt.getTime() - a.createdAt.getTime();
    }
    return a.title.localeCompare(b.title);
  });

  const handleTaskUpdate = (updatedTask: Task) => {
    const newTasks = tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    );
    onTasksChange(newTasks);
  };

  const handleTaskDelete = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      const newTasks = tasks.filter(task => task.id !== taskId);
      onTasksChange(newTasks);
    }
  };

  const handleTaskCreate = (newTask: Task) => {
    onTasksChange([...tasks, newTask]);
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Task Board</h2>
          <p className="text-gray-400">
            {filteredTasks.length} of {tasks.length} tasks
          </p>
        </div>
        <CreateTaskDialog onTaskCreate={handleTaskCreate} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-gray-700 border-gray-600 text-white"
        />
        
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-40 bg-gray-700 border-gray-600 text-white">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-40 bg-gray-700 border-gray-600 text-white">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="dueDate">Due Date</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="title">Title</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks Grid */}
      {sortedTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdate={handleTaskUpdate}
              onDelete={handleTaskDelete}
            />
          ))}
        </div>
      ) : (
        <Card className="bg-gray-800/50 border-gray-700 text-center py-12">
          <CardContent>
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm || filter !== 'all' ? 'No matching tasks' : 'No tasks yet'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Create your first task to get started with your AI assistant'}
            </p>
            {!searchTerm && filter === 'all' && (
              <CreateTaskDialog onTaskCreate={handleTaskCreate} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}