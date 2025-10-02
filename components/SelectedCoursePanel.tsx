
import React from 'react';
import type { Subject, Standard } from '../types';

interface SelectedCoursePanelProps {
  subject: Subject;
  standard: Standard;
  onChangeCourse: () => void;
}

export function SelectedCoursePanel({ subject, standard, onChangeCourse }: SelectedCoursePanelProps) {
  return (
    <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Selected Course</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {subject} - {standard.replace(' (11th Std)', '').replace(' (12th Std)', '')}
          </p>
        </div>
        <button 
          onClick={onChangeCourse}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          Change
        </button>
      </div>
    </div>
  );
}
