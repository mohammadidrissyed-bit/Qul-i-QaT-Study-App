import React, { useState, PropsWithChildren } from 'react';
import type { MCQ } from '../types';

// Utility components and functions, can be in the same file or a separate utils file
export const isCodeSnippet = (text: string): boolean => {
  const codeKeywords = ['def ', 'for ', 'while ', 'if ', 'else:', 'elif ', 'import ', 'class ', 'print('];
  const lines = text.split('\n');
  if (lines.length > 1 || text.trim().startsWith('```')) return true;
  return codeKeywords.some(keyword => text.trim().startsWith(keyword));
};

const ClipboardIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>);
const CheckIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>);

// FIX: Changed component to be of type React.FC to correctly handle the 'key' prop used when rendering a list of components.
const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
    const [isCopied, setIsCopied] = useState(false);

    // Robustly remove markdown fences without affecting code content.
    // This handles ```python at the start and ``` at the end.
    const codeContent = code.replace(/^```[a-z]*\n?/, '').replace(/```$/, '').trim();

    const handleCopy = () => {
        navigator.clipboard.writeText(codeContent);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="not-prose bg-slate-800 dark:bg-black/50 text-white rounded-lg border border-slate-700 my-4">
            <div className="flex justify-between items-center px-4 py-1.5 bg-slate-900/50 rounded-t-lg border-b border-slate-700">
                <span className="text-xs font-sans text-slate-400">Python</span>
                <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                    {isCopied ? <CheckIcon /> : <ClipboardIcon />} {isCopied ? 'Copied' : 'Copy'}
                </button>
            </div>
            {/* The `whitespace-pre` class ensures newlines and spaces are respected */}
            <pre className="text-slate-200 p-4 text-sm overflow-x-auto font-mono whitespace-pre">
                <code>{codeContent}</code>
            </pre>
        </div>
    );
};

const MCQViewer = ({ mcqs }: { mcqs: MCQ[] }) => {
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);
    
    const handleAnswerSelect = (questionIndex: number, option: string) => {
        setUserAnswers(prev => ({ ...prev, [questionIndex]: option }));
        if (showResults) setShowResults(false);
    };

    const handleCheckAnswers = () => setShowResults(true);
    
    const score = showResults ? mcqs.reduce((acc, mcq, index) => (userAnswers[index] === mcq.correctAnswer ? acc + 1 : acc), 0) : 0;

    return (
        <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
                 {showResults && <span className="text-lg font-bold text-blue-600 dark:text-blue-400">Score: {score}/{mcqs.length}</span>}
            </div>
            <div className="space-y-6">
                {mcqs.map((mcq, index) => {
                    const selectedAnswer = userAnswers[index];
                    const isCorrect = showResults && selectedAnswer === mcq.correctAnswer;
                    const isIncorrect = showResults && selectedAnswer && selectedAnswer !== mcq.correctAnswer;
                    
                    return (
                        <div key={index}>
                            <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 mb-3">{index + 1}. {mcq.question}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {mcq.options.map((option) => {
                                    const isSelected = selectedAnswer === option;
                                    const isTheCorrectAnswer = showResults && mcq.correctAnswer === option;

                                    let optionClass = 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-transparent';
                                    if (showResults) {
                                        if (isTheCorrectAnswer) optionClass = 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-500';
                                        else if (isSelected && isIncorrect) optionClass = 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-red-500';
                                        else optionClass = 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent';
                                    } else if (isSelected) {
                                        optionClass = 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-blue-500';
                                    }

                                    return (
                                        <button key={option} onClick={() => handleAnswerSelect(index, option)} disabled={showResults} className={`w-full text-left p-2.5 text-sm rounded-md transition-colors border ${showResults ? 'cursor-default' : ''} ${optionClass}`}>
                                            {option}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-6 flex justify-end">
                {showResults ? (
                    <button onClick={() => { setShowResults(false); setUserAnswers({}); }} className="bg-slate-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-700 transition-all">
                        Try Again
                    </button>
                ) : (
                    <button onClick={handleCheckAnswers} disabled={Object.keys(userAnswers).length !== mcqs.length} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all">
                        Check Answers
                    </button>
                )}
            </div>
        </div>
    );
};


// Main exported components
// FIX: Used PropsWithChildren to correctly type a component that accepts children, resolving a TypeScript error.
const GeneratedCard = ({ title, children }: PropsWithChildren<{ title: string }>) => (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 animate-fade-in">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">{title}</h3>
        {children}
    </div>
);

export const AnswerCard = ({ title, content }: { title: string, content: string }) => {
    // Split the content by markdown code blocks, keeping the code blocks
    const parts = content.split(/(```[\s\S]*?```)/g).filter(part => part.trim() !== '');

    return (
        <GeneratedCard title={title}>
            <div className="prose prose-sm max-w-none prose-p:text-slate-600 dark:prose-p:text-slate-300">
                {parts.map((part, index) => {
                    if (part.startsWith('```')) {
                        // It's a code block
                        return <CodeBlock key={index} code={part} />;
                    } else {
                        // It's a regular text paragraph
                        return part.split('\n').filter(p => p.trim() !== '').map((paragraph, pIndex) => (
                            <p key={`${index}-${pIndex}`}>{paragraph}</p>
                        ));
                    }
                })}
            </div>
        </GeneratedCard>
    );
};

export const ImageCard = ({ title, imageData, topic }: { title: string, imageData: string, topic: string }) => (
    <GeneratedCard title={title}>
        <div className="flex justify-center">
            <div className="border border-slate-200 dark:border-slate-700 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 w-full max-w-md">
                <img src={`data:image/png;base64,${imageData}`} alt={`Visualization for ${topic}`} className="rounded-md w-full object-contain"/>
            </div>
        </div>
    </GeneratedCard>
);

export const QuizCard = ({ title, mcqs }: { title: string, mcqs: MCQ[] }) => (
    <GeneratedCard title={title}>
        <MCQViewer mcqs={mcqs} />
    </GeneratedCard>
);