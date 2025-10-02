import React from 'react';

interface TopicDropdownProps {
  topics: string[];
  selectedTopic: string | null;
  onSelectTopic: (topic: string) => void;
  isLoading: boolean;
  noMoreTopics: boolean;
  onLoadMore: () => void;
  selectedChapter: string | null;
}

export function TopicDropdown({ topics, selectedTopic, onSelectTopic, isLoading, noMoreTopics, onLoadMore, selectedChapter }: TopicDropdownProps) {
  if (!selectedChapter) {
    return null; // Don't show if no chapter is selected
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'load-more') {
      onLoadMore();
      // After clicking "Load More", we don't want the select element's value to be 'load-more'.
      // It will visually revert to the selectedTopic on the next render.
    } else if (value) {
      onSelectTopic(value);
    }
  };

  return (
    <div className="relative animate-fade-in">
      <label htmlFor="topic-select" className="sr-only">Select a Topic</label>
      <select
        id="topic-select"
        value={selectedTopic || ''}
        onChange={handleChange}
        disabled={isLoading && topics.length === 0}
        className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="" disabled>
          {isLoading && topics.length === 0 ? 'Loading topics...' : 'Select a topic...'}
        </option>

        {topics.map((topic) => (
          <option key={topic} value={topic}>
            {topic}
          </option>
        ))}
        
        {topics.length > 0 && !noMoreTopics && (
           <option value="load-more" className="font-semibold text-blue-600 dark:text-blue-500 bg-slate-200 dark:bg-slate-700">
             {isLoading ? 'Loading...' : 'Load More Topics...'}
           </option>
        )}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
      </div>
    </div>
  );
}