import { STANDARDS, SUBJECTS } from './constants';
import type { Chat } from '@google/genai';

export interface QuestionAnswer {
  question: string;
  answerSteps: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

export type Subject = (typeof SUBJECTS)[number];
export type Standard = (typeof STANDARDS)[number];
export type ChatSession = Chat;

export interface VoiceSettings {
  voiceURI: string | null;
  rate: number;
  pitch: number;
}

interface LoadingState<T> {
    isLoading: boolean;
    data?: T;
    error?: string;
}

export interface MCQ {
    question: string;
    options: string[];
    correctAnswer: string;
}

export type ActiveContentView = 'answer' | 'image' | 'mcqs';

export interface TopicContent {
    question: string;
    answer: LoadingState<string>;
    image: LoadingState<string>; // base64 image data
    mcqs: LoadingState<MCQ[]>;
}