// Voice processing utilities for speech recognition and synthesis

import { VoiceSession } from '@/types';

export class VoiceManager {
  private recognition: any = null;
  private synthesis: SpeechSynthesis;
  private currentSession: VoiceSession | null = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeSpeechRecognition();
  }

  /**
   * Initialize speech recognition
   */
  private initializeSpeechRecognition(): void {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      this.recognition = new (window as any).SpeechRecognition();
    }

    if (this.recognition) {
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    }
  }

  /**
   * Check if speech recognition is supported
   */
  isRecognitionSupported(): boolean {
    return this.recognition !== null;
  }

  /**
   * Check if speech synthesis is supported
   */
  isSynthesisSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  /**
   * Start voice recording
   */
  async startRecording(): Promise<VoiceSession> {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported in this browser');
    }

    const sessionId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.currentSession = {
      id: sessionId,
      isRecording: true,
      isProcessing: false,
      startTime: new Date()
    };

    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not available'));
        return;
      }

      this.recognition.onstart = () => {
        console.log('Voice recording started');
        resolve(this.currentSession!);
      };

      this.recognition.onresult = (event) => {
        const result = event.results[0];
        if (this.currentSession) {
          this.currentSession.transcript = result[0].transcript;
          this.currentSession.confidence = result[0].confidence;
          this.currentSession.isRecording = false;
          this.currentSession.endTime = new Date();
        }
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (this.currentSession) {
          this.currentSession.isRecording = false;
          this.currentSession.isProcessing = false;
        }
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.onend = () => {
        if (this.currentSession) {
          this.currentSession.isRecording = false;
        }
      };

      try {
        this.recognition.start();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop voice recording
   */
  stopRecording(): VoiceSession | null {
    if (this.recognition && this.currentSession?.isRecording) {
      this.recognition.stop();
      this.currentSession.isRecording = false;
      this.currentSession.endTime = new Date();
    }
    return this.currentSession;
  }

  /**
   * Get current voice session
   */
  getCurrentSession(): VoiceSession | null {
    return this.currentSession;
  }

  /**
   * Clear current session
   */
  clearSession(): void {
    this.currentSession = null;
  }

  /**
   * Speak text using text-to-speech
   */
  async speak(text: string, options?: {
    voice?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
  }): Promise<void> {
    if (!this.isSynthesisSupported()) {
      throw new Error('Speech synthesis not supported in this browser');
    }

    // Cancel any ongoing speech
    this.synthesis.cancel();

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice options
      if (options?.rate) utterance.rate = options.rate;
      if (options?.pitch) utterance.pitch = options.pitch;
      if (options?.volume) utterance.volume = options.volume;

      // Find and set voice
      const voices = this.synthesis.getVoices();
      if (options?.voice) {
        const selectedVoice = voices.find(v => v.name === options.voice);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      } else {
        // Use first English voice found
        const englishVoice = voices.find(v => v.lang.startsWith('en'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));

      this.synthesis.speak(utterance);
    });
  }

  /**
   * Stop any ongoing speech
   */
  stopSpeaking(): void {
    this.synthesis.cancel();
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  /**
   * Parse voice commands for task operations
   */
  parseVoiceCommand(transcript: string): {
    action: string;
    parameters: Record<string, any>;
  } | null {
    const lower = transcript.toLowerCase().trim();

    // Task creation commands
    if (lower.startsWith('create task') || lower.startsWith('add task') || lower.startsWith('new task')) {
      const taskText = lower.replace(/^(create task|add task|new task)\s*/, '');
      return {
        action: 'create_task',
        parameters: { text: taskText }
      };
    }

    // Task completion commands
    if (lower.includes('complete') || lower.includes('finish') || lower.includes('done')) {
      return {
        action: 'complete_task',
        parameters: { query: lower }
      };
    }

    // Show tasks commands
    if (lower.includes('show') && lower.includes('task')) {
      let filter = 'all';
      if (lower.includes('today')) filter = 'today';
      else if (lower.includes('overdue')) filter = 'overdue';
      else if (lower.includes('completed')) filter = 'completed';
      
      return {
        action: 'show_tasks',
        parameters: { filter }
      };
    }

    // Document analysis commands
    if (lower.includes('analyze') && lower.includes('document')) {
      return {
        action: 'analyze_document',
        parameters: {}
      };
    }

    // General chat
    return {
      action: 'chat',
      parameters: { message: transcript }
    };
  }

  /**
   * Convert audio blob to base64
   */
  async audioToBase64(audioBlob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Remove data URL prefix to get just base64
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert audio to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
  }

  /**
   * Create voice command shortcuts
   */
  getVoiceCommandHelp(): string[] {
    return [
      "Say 'Create task' followed by your task description",
      "Say 'Complete [task name]' to mark tasks as done",
      "Say 'Show my tasks today' to see today's tasks",
      "Say 'Show overdue tasks' to see what's past due",
      "Say 'Analyze document' to process uploaded files",
      "Just speak naturally to chat with the AI assistant"
    ];
  }

  /**
   * Get voice settings for user customization
   */
  getVoiceSettings(): {
    recognition: {
      language: string;
      continuous: boolean;
      interimResults: boolean;
    };
    synthesis: {
      voices: Array<{ name: string; lang: string; }>;
      defaultRate: number;
      defaultPitch: number;
      defaultVolume: number;
    };
  } {
    return {
      recognition: {
        language: this.recognition?.lang || 'en-US',
        continuous: this.recognition?.continuous || false,
        interimResults: this.recognition?.interimResults || false
      },
      synthesis: {
        voices: this.getAvailableVoices().map(v => ({
          name: v.name,
          lang: v.lang
        })),
        defaultRate: 1,
        defaultPitch: 1,
        defaultVolume: 1
      }
    };
  }

  /**
   * Update voice settings
   */
  updateVoiceSettings(settings: {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
  }): void {
    if (this.recognition) {
      if (settings.language) this.recognition.lang = settings.language;
      if (settings.continuous !== undefined) this.recognition.continuous = settings.continuous;
      if (settings.interimResults !== undefined) this.recognition.interimResults = settings.interimResults;
    }
  }
}

// Export singleton instance
export const voiceManager = new VoiceManager();

// Voice command presets
export const VOICE_COMMANDS = {
  TASK_CREATION: [
    'Create task',
    'Add task',
    'New task',
    'Remind me to'
  ],
  TASK_COMPLETION: [
    'Complete task',
    'Finish task',
    'Mark done',
    'Task complete'
  ],
  TASK_VIEWING: [
    'Show my tasks',
    'List tasks',
    'What tasks',
    'My schedule'
  ],
  DOCUMENT_ANALYSIS: [
    'Analyze document',
    'Process file',
    'Review document',
    'Extract tasks from document'
  ],
  GENERAL: [
    'Help me',
    'What can you do',
    'Assistant',
    'AI help'
  ]
};

// Voice feedback messages
export const VOICE_FEEDBACK = {
  LISTENING: "I'm listening...",
  PROCESSING: "Processing your request...",
  ERROR: "Sorry, I didn't catch that. Please try again.",
  TASK_CREATED: "Task created successfully!",
  TASK_COMPLETED: "Task marked as complete!",
  NO_TASKS: "You have no tasks matching that criteria.",
  DOCUMENT_ANALYZED: "Document analysis complete!"
};