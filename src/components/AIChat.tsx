'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AIMessage, Task, Document } from '@/types';
import { voiceManager } from '@/lib/voice-utils';

interface AIChatProps {
  tasks?: Task[];
  documents?: Document[];
  onTasksGenerated?: (tasks: Task[]) => void;
  className?: string;
}

export default function AIChat({ tasks = [], documents = [], onTasksGenerated, className = '' }: AIChatProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m your Personal AI Assistant. I can help you create and manage tasks, analyze documents, and respond to voice commands. How can I assist you today?',
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (message: string, isVoice = false) => {
    if (!message.trim()) return;

    const userMessage: AIMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
      type: isVoice ? 'voice' : 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          context: {
            tasks: tasks.slice(-10), // Send last 10 tasks for context
            documents: documents.slice(-5), // Send last 5 documents
            voiceMode: isVoice
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: AIMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: data.response || 'I apologize, but I couldn\'t process your request properly.',
        timestamp: new Date(),
        type: isVoice ? 'voice' : 'text',
        metadata: {
          taskIds: data.generatedTasks?.map((t: any) => t.id) || [],
        }
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle generated tasks
      if (data.generatedTasks && data.generatedTasks.length > 0 && onTasksGenerated) {
        onTasksGenerated(data.generatedTasks);
      }

      // If voice mode, speak the response
      if (isVoice && voiceManager.isSynthesisSupported()) {
        try {
          await voiceManager.speak(data.response);
        } catch (voiceError) {
          console.error('Text-to-speech error:', voiceError);
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: AIMessage = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      handleSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleVoiceToggle = async () => {
    if (!voiceManager.isRecognitionSupported()) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isRecording) {
      // Stop recording
      const session = voiceManager.stopRecording();
      setIsRecording(false);
      setIsListening(false);
      
      if (session?.transcript) {
        handleSendMessage(session.transcript, true);
      }
      voiceManager.clearSession();
    } else {
      // Start recording
      try {
        setIsRecording(true);
        setIsListening(true);
        
        await voiceManager.startRecording();
        
        // Set up listeners for voice session
        const checkSession = setInterval(() => {
          const currentSession = voiceManager.getCurrentSession();
          if (currentSession && !currentSession.isRecording && currentSession.transcript) {
            setIsRecording(false);
            setIsListening(false);
            handleSendMessage(currentSession.transcript, true);
            voiceManager.clearSession();
            clearInterval(checkSession);
          }
        }, 500);
        
        // Auto-stop after 30 seconds
        setTimeout(() => {
          if (isRecording) {
            const finalSession = voiceManager.stopRecording();
            setIsRecording(false);
            setIsListening(false);
            if (finalSession?.transcript) {
              handleSendMessage(finalSession.transcript, true);
            }
            voiceManager.clearSession();
          }
          clearInterval(checkSession);
        }, 30000);
        
      } catch (error) {
        console.error('Voice recording error:', error);
        setIsRecording(false);
        setIsListening(false);
        alert('Failed to start voice recording: ' + (error as Error).message);
      }
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className={`${className} bg-gray-800/50 border-gray-700 flex flex-col h-full`}>
      <CardContent className="p-4 flex flex-col h-full">
        {/* Messages */}
        <ScrollArea className="flex-1 mb-4 h-64">
          <div className="space-y-4 pr-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-100'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-70">
                      {formatTimestamp(message.timestamp)}
                    </span>
                    {message.type === 'voice' && (
                      <Badge variant="secondary" className="text-xs ml-2">
                        🎤 Voice
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-gray-100 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-sm text-gray-400">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Voice Status */}
        {isListening && (
          <div className="mb-3 p-2 bg-blue-900/50 border border-blue-700 rounded-lg">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-blue-300">
                {isRecording ? 'Listening... Speak now' : 'Processing speech...'}
              </span>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message or use voice command..."
            disabled={isLoading || isRecording}
            className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
          
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleVoiceToggle}
            disabled={isLoading}
            className={`${
              isRecording 
                ? 'bg-red-600 hover:bg-red-700 border-red-600 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300'
            }`}
          >
            {isRecording ? '⏹️' : '🎤'}
          </Button>
          
          <Button 
            type="submit" 
            disabled={isLoading || !inputValue.trim() || isRecording}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Send
          </Button>
        </form>

        {/* Voice Help */}
        {voiceManager.isRecognitionSupported() && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            Try voice commands: "Create task", "Show my tasks today", "Analyze document"
          </div>
        )}
      </CardContent>
    </Card>
  );
}