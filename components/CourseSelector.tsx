

import React from 'react';
import { SUBJECTS, STANDARDS, CHAPTERS } from '../constants';
import type { Subject, Standard } from '../types';

interface CourseSelectorProps {
  onSelectCourse: (subject: Subject, standard: Standard) => void;
  isLoading: boolean;
}

// FIX: Changed component to be of type React.FC to correctly handle the 'key' prop used when rendering a list of components.
interface CourseCardProps {
    subject: Subject;
    standard: Standard;
    onSelect: () => void;
    disabled: boolean;
}
const CourseCard: React.FC<CourseCardProps> = ({ subject, standard, onSelect, disabled }) => (
    <button
        onClick={onSelect}
        disabled={disabled}
        className="w-full text-left p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
        <p className="font-semibold text-slate-800 dark:text-slate-100">{subject}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{standard}</p>
    </button>
);

export function CourseSelector({ onSelectCourse, isLoading }: CourseSelectorProps) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 animate-fade-in">
      <h2 className="text-sm font-bold uppercase text-slate-600 dark:text-slate-400 tracking-wider mb-4">
        Select Your Course
      </h2>
      <div className="space-y-3">
        {SUBJECTS.map(subject => (
            <div key={subject}>
                {STANDARDS.map(standard => {
                    // Check if there are chapters defined for this subject-standard combination
                    if (CHAPTERS[subject]?.[standard]) {
                        return (
                            <CourseCard 
                                key={`${subject}-${standard}`}
                                subject={subject}
                                standard={standard}
                                onSelect={() => onSelectCourse(subject, standard)}
                                disabled={isLoading}
                            />
                        );
                    }
                    return null;
                })}
            </div>
        ))}
      </div>
    </div>
  );
}