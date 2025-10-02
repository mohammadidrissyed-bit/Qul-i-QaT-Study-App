import React from 'react';

export function LoadingSpinner(): React.ReactNode {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
        <div className="w-10 h-10 border-4 border-t-4 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-center">Generating Topics...</p>
    </div>
  );
}