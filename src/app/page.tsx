'use client';

import { useState, useEffect } from 'react';
import Navigation, { MobileNavigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Task, Document, TaskStats } from '@/types';
import { calculateTaskStats, getTasksDueToday, getOverdueTasks } from '@/lib/task-utils';
import { loadTasksFromStorage, loadDocumentsFromStorage } from '@/lib/document-utils';

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load data from localStorage
    const loadedTasks = loadTasksFromStorage();
    const loadedDocuments = loadDocumentsFromStorage();
    
    setTasks(loadedTasks);
    setDocuments(loadedDocuments);
    setStats(calculateTaskStats(loadedTasks));
    setLoading(false);
  }, []);

  const todayTasks = tasks ? getTasksDueToday(tasks) : [];
  const overdueTasks = tasks ? getOverdueTasks(tasks) : [];
  const recentDocuments = documents.slice(0, 3);

  const completionRate = stats ? Math.round((stats.completed / Math.max(stats.total, 1)) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <Navigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your productivity dashboard...</p>
          </div>
        </div>
        <MobileNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome to Your AI Assistant
            </h1>
            <p className="text-xl text-gray-400">
              Your intelligent productivity companion for tasks, voice commands, and document analysis
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats?.total || 0}</div>
                <div className="flex items-center space-x-2 mt-2">
                  <Progress value={completionRate} className="flex-1" />
                  <span className="text-sm text-gray-400">{completionRate}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Today's Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">{todayTasks.length}</div>
                <p className="text-sm text-gray-500 mt-1">
                  {todayTasks.length === 0 ? 'All caught up!' : 'Tasks due today'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Overdue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-400">{overdueTasks.length}</div>
                <p className="text-sm text-gray-500 mt-1">
                  {overdueTasks.length === 0 ? 'Nothing overdue' : 'Need attention'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">{documents.length}</div>
                <p className="text-sm text-gray-500 mt-1">
                  {documents.length === 0 ? 'Upload your first document' : 'Ready for analysis'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <span>🎯</span>
                <span>Quick Actions</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Jump into your most common tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white h-auto py-4 px-4"
                  onClick={() => window.location.href = '/tasks'}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">📋</div>
                    <div className="text-sm">Manage Tasks</div>
                  </div>
                </Button>
                
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 text-white h-auto py-4 px-4"
                  onClick={() => window.location.href = '/documents'}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">📄</div>
                    <div className="text-sm">Analyze Docs</div>
                  </div>
                </Button>
              </div>
              
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white h-auto py-4"
                onClick={() => {
                  // This would trigger voice recording
                  alert('Voice assistant would be activated here. Click OK to continue to the tasks page.');
                  window.location.href = '/tasks';
                }}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">🎤</div>
                  <div className="text-sm">Voice Command</div>
                  <div className="text-xs text-green-200 mt-1">Say "Create task" to get started</div>
                </div>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <span>🤖</span>
                <span>AI Features</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Powered by Claude Sonnet 4 for intelligent assistance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                  <h4 className="text-white font-medium">🧠 Smart Task Creation</h4>
                  <p className="text-sm text-gray-400 mt-1">Natural language processing for intelligent task generation</p>
                </div>
                
                <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                  <h4 className="text-white font-medium">🎙️ Voice Commands</h4>
                  <p className="text-sm text-gray-400 mt-1">Hands-free operation with speech recognition</p>
                </div>
                
                <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                  <h4 className="text-white font-medium">📊 Document Insights</h4>
                  <p className="text-sm text-gray-400 mt-1">AI-powered analysis and automatic task extraction</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Tasks Preview */}
        {todayTasks.length > 0 && (
          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-white">Today's Tasks</CardTitle>
                  <CardDescription className="text-gray-400">
                    Tasks due today that need your attention
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/tasks'}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-gray-400 mt-1">{task.description.substring(0, 100)}...</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="secondary"
                        className={
                          task.priority === 'urgent' ? 'bg-red-900 text-red-300' :
                          task.priority === 'high' ? 'bg-orange-900 text-orange-300' :
                          task.priority === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                          'bg-green-900 text-green-300'
                        }
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
                {todayTasks.length > 3 && (
                  <div className="text-center pt-2">
                    <p className="text-sm text-gray-400">
                      {todayTasks.length - 3} more tasks due today
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Documents */}
        {recentDocuments.length > 0 && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-white">Recent Documents</CardTitle>
                  <CardDescription className="text-gray-400">
                    Your recently uploaded documents
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/documents'}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">📄</div>
                      <div>
                        <h4 className="text-white font-medium">{doc.name}</h4>
                        <p className="text-sm text-gray-400">
                          Uploaded {doc.uploadedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary"
                      className={doc.analysisComplete ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}
                    >
                      {doc.analysisComplete ? 'Analyzed' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {tasks.length === 0 && documents.length === 0 && (
          <Card className="bg-gray-800/50 border-gray-700 text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-white mb-2">Get Started with Your AI Assistant</h3>
              <p className="text-gray-400 mb-6">
                Create your first task, upload a document, or try voice commands to begin
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.location.href = '/tasks'}
                >
                  Create Your First Task
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => window.location.href = '/documents'}
                >
                  Upload a Document
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <MobileNavigation />
    </div>
  );
}