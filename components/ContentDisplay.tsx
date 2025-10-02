
import React from 'react';
import type { TopicContent, MCQ, ActiveContentView } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { AnswerCard, ImageCard, QuizCard } from './GeneratedContent';

interface ContentDisplayProps {
  error: string | null;
  selectedTopic: string | null;
  isCourseSelected: boolean;
  content: TopicContent | undefined;
  activeView: ActiveContentView | undefined;
  speechState: { isPlaying: boolean; currentTopic: string | null; };
  onGenerateAnswer: (topic: string) => void;
  onGenerateImage: (topic: string) => void;
  onGenerateMCQs: (topic: string) => void;
  onToggleSpeech: (topic: string) => void;
}

const WelcomeMessage = () => (
    <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center h-full animate-fade-in">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Welcome to QuliQaT</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">Select a course from the left panel to begin your interactive learning journey.</p>
    </div>
);

const ChapterPrompt = () => (
    <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center h-full animate-fade-in">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Ready to Dive In?</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">Select a chapter from the dropdown, then choose a topic to start generating study materials.</p>
    </div>
);

const ActionButton = ({ icon, text, onClick, isLoading }: { icon: React.ReactNode, text: string, onClick: () => void, isLoading: boolean }) => (
    <button
        onClick={onClick}
        disabled={isLoading}
        className="flex flex-col items-center justify-center text-center p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
    >
        <div className="text-blue-600 dark:text-blue-400 mb-2">{icon}</div>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{text}</span>
        {isLoading && <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex justify-center items-center"><div className="w-6 h-6 border-2 border-t-blue-500 rounded-full animate-spin"></div></div>}
    </button>
);


export function ContentDisplay({ 
    error, selectedTopic, isCourseSelected, content, activeView, speechState, onGenerateAnswer, onGenerateImage, onGenerateMCQs, onToggleSpeech
}: ContentDisplayProps): React.ReactNode {

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!isCourseSelected) {
    return <WelcomeMessage />;
  }
  
  if (!selectedTopic) {
    return <ChapterPrompt />;
  }

  const isGeneratingAudio = speechState.isPlaying && speechState.currentTopic === selectedTopic;
  
  return (
    <div key={selectedTopic} className="space-y-8 animate-fade-in">
      <div>
        <p className="text-md text-blue-600 dark:text-blue-400 font-medium mb-1">Selected Topic</p>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{selectedTopic}</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ActionButton
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            text="Explanation"
            isLoading={content?.answer.isLoading ?? false}
            onClick={() => onGenerateAnswer(selectedTopic)}
          />
          <ActionButton
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>}
            text="Visualize Concept"
            isLoading={content?.image.isLoading ?? false}
            onClick={() => onGenerateImage(selectedTopic)}
          />
          <ActionButton
            icon={isGeneratingAudio ? <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 14l4-4m0 4l-4-4" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>}
            text={isGeneratingAudio ? "Stop Summary" : "Audio Summary"}
            isLoading={false} // speech handles its own state visually
            onClick={() => onToggleSpeech(selectedTopic)}
          />
          <ActionButton
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
            text="Create a Quiz"
            isLoading={content?.mcqs.isLoading ?? false}
            onClick={() => onGenerateMCQs(selectedTopic)}
          />
      </div>

      <div className="space-y-6">
        {activeView === 'answer' && content?.answer.data && <AnswerCard title="Explanation" content={content.answer.data} />}
        {activeView === 'image' && content?.image.data && <ImageCard title="Visualization" imageData={content.image.data} topic={selectedTopic} />}
        {activeView === 'mcqs' && content?.mcqs.data && <QuizCard title="Quiz" mcqs={content.mcqs.data} />}
        
        {activeView === 'answer' && content?.answer.error && <ErrorMessage message={content.answer.error} />}
        {activeView === 'image' && content?.image.error && <ErrorMessage message={content.image.error} />}
        {activeView === 'mcqs' && content?.mcqs.error && <ErrorMessage message={content.mcqs.error} />}
      </div>
    </div>
  );
}
