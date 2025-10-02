import React, { useState, useEffect } from 'react';
import type { VoiceSettings } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: VoiceSettings;
    onSettingsChange: (settings: VoiceSettings) => void;
    voices: SpeechSynthesisVoice[];
}

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const SpeakerPlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
);


export function SettingsModal({ isOpen, onClose, settings, onSettingsChange, voices }: SettingsModalProps) {
    const [localSettings, setLocalSettings] = useState(settings);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);
    
     useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);


    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        const newSettings = { ...localSettings, [name]: name === 'voiceURI' ? value : parseFloat(value) };
        setLocalSettings(newSettings);
        onSettingsChange(newSettings);
    };

    const handlePreview = () => {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
        const utterance = new SpeechSynthesisUtterance("This is a preview of the selected voice.");
        const selectedVoice = voices.find(v => v.voiceURI === localSettings.voiceURI);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        utterance.rate = localSettings.rate;
        utterance.pitch = localSettings.pitch;
        window.speechSynthesis.speak(utterance);
    };
    
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
        >
            <div 
                className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md m-4 border border-slate-200 dark:border-slate-800 animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 id="settings-title" className="text-lg font-semibold text-slate-800 dark:text-slate-100">Voice Settings</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close settings">
                        <CloseIcon />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label htmlFor="voiceURI" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Voice</label>
                        <select
                            id="voiceURI"
                            name="voiceURI"
                            value={localSettings.voiceURI || ''}
                            onChange={handleChange}
                            className="w-full p-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                        >
                            {voices.length === 0 && <option>Loading voices...</option>}
                            {voices.map(voice => (
                                <option key={voice.voiceURI} value={voice.voiceURI}>
                                    {voice.name} ({voice.lang})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="rate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Speed: {localSettings.rate.toFixed(1)}x</label>
                        <input
                            type="range"
                            id="rate"
                            name="rate"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={localSettings.rate}
                            onChange={handleChange}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="pitch" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Pitch: {localSettings.pitch.toFixed(1)}</label>
                         <input
                            type="range"
                            id="pitch"
                            name="pitch"
                            min="0"
                            max="2"
                            step="0.1"
                            value={localSettings.pitch}
                            onChange={handleChange}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 rounded-b-lg">
                    <button
                        onClick={handlePreview}
                        className="inline-flex items-center justify-center py-2 px-4 text-sm font-semibold rounded-md transition-colors bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                        disabled={voices.length === 0}
                    >
                        <SpeakerPlayIcon/> Preview Voice
                    </button>
                    <button
                        onClick={onClose}
                        className="py-2 px-4 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}