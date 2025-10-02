
import React, { useState, useCallback, useEffect } from 'react';
import { CHAPTERS } from './constants';
import type { Standard, ChatSession, ChatMessage, TopicContent, VoiceSettings, ActiveContentView, Subject } from './types';
import { getChapterTopics, getTopicContent, generateImageForTopic, startChatSession, continueChatStream, getMCQsForTopic, getELI5ForTopic } from './services/geminiService';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ChatBox } from './components/ChatBox';
import { SettingsModal } from './components/SettingsModal';
import { ChapterDropdown } from './components/ChapterDropdown';
import { TopicDropdown } from './components/TopicDropdown';
import { ContentDisplay } from './components/ContentDisplay';
import { CourseSelector } from './components/CourseSelector';
import { SelectedCoursePanel } from './components/SelectedCoursePanel';

type Theme = 'light' | 'dark';

interface SpeechState {
    isPlaying: boolean;
    currentTopic: string | null;
}

const defaultVoiceSettings: VoiceSettings = {
    voiceURI: null,
    rate: 1,
    pitch: 1,
};

// State that will be persisted to localStorage
interface PersistentState {
  subject: Subject | null;
  standard: Standard | null;
  isCourseSelected: boolean;
  selectedChapter: string | null;
  selectedTopic: string | null;
  topics: Record<string, string[]>;
  content: Record<string, TopicContent>;
  activeView: Record<string, ActiveContentView>;
  noMoreTopics: Record<string, boolean>;
}

const APP_STATE_KEY = 'quliqatAppState';

// Function to load state from local storage
const loadPersistentState = (): PersistentState => {
  try {
    const savedState = localStorage.getItem(APP_STATE_KEY);
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch (error) {
    console.error("Failed to parse persistent state from localStorage", error);
    localStorage.removeItem(APP_STATE_KEY); // Clear corrupted state
  }
  // Return default state if nothing is saved or if parsing fails
  return {
    subject: null,
    standard: null,
    isCourseSelected: false,
    selectedChapter: null,
    selectedTopic: null,
    topics: {},
    content: {},
    activeView: {},
    noMoreTopics: {},
  };
};

function App(): React.ReactNode {
  // --- STATE MANAGEMENT ---
  
  // A single state object for all data that needs to be persisted
  const [persistentState, setPersistentState] = useState<PersistentState>(loadPersistentState);
  const { subject, standard, isCourseSelected, selectedChapter, selectedTopic, topics, content, activeView, noMoreTopics } = persistentState;
  
  // Theme state (persisted separately)
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'light';
  });

  // Ephemeral state (not persisted across reloads)
  const [isTopicsLoading, setIsTopicsLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [isChatReady, setIsChatReady] = useState<boolean>(false);
  const [speechState, setSpeechState] = useState<SpeechState>({ isPlaying: false, currentTopic: null });
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    try {
        const savedSettings = localStorage.getItem('voiceSettings');
        return savedSettings ? JSON.parse(savedSettings) : defaultVoiceSettings;
    } catch { return defaultVoiceSettings; }
  });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // --- EFFECTS ---

  // Save persistent state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(APP_STATE_KEY, JSON.stringify(persistentState));
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [persistentState]);
  
  // Manage theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  // Speech synthesis cleanup
  useEffect(() => {
    const cleanup = () => { if (window.speechSynthesis.speaking) window.speechSynthesis.cancel(); };
    window.addEventListener('beforeunload', cleanup);
    return () => { cleanup(); window.removeEventListener('beforeunload', cleanup); };
  }, []);

  // Load available speech synthesis voices
  useEffect(() => {
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Initialize or update chat session based on course/chapter selection
  useEffect(() => {
    if (isCourseSelected && standard && subject) {
        const newChatSession = startChatSession(standard, subject, selectedChapter || undefined);
        setChatSession(newChatSession);
        // Set initial chat message if history is empty
        if (chatHistory.length === 0) {
           setChatHistory([{
              role: 'model',
              parts: `I'm your AI study buddy! Ask me anything about the ${subject} syllabus for ${standard}, or select a chapter to begin.`
           }]);
        }
        setIsChatReady(true);
    } else {
        setIsChatReady(false);
        setChatHistory([]);
    }
  }, [isCourseSelected, standard, subject, selectedChapter]);

  // --- HANDLERS & LOGIC ---

  const handleVoiceSettingsChange = (newSettings: VoiceSettings) => {
    setVoiceSettings(newSettings);
    localStorage.setItem('voiceSettings', JSON.stringify(newSettings));
  };

  const toggleTheme = () => setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  
  const cancelSpeech = useCallback(() => {
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    setSpeechState({ isPlaying: false, currentTopic: null });
  }, []);

  const fetchTopics = useCallback(async (chapter: string) => {
    if (isTopicsLoading[chapter] || !standard || !subject) return;

    setIsTopicsLoading(prev => ({ ...prev, [chapter]: true }));
    setError(null);

    try {
      const newTopics = await getChapterTopics(chapter, standard, subject, topics[chapter]);
      if (newTopics.length === 0) {
        setPersistentState(prev => ({ ...prev, noMoreTopics: {...prev.noMoreTopics, [chapter]: true } }));
      } else {
        setPersistentState(prev => ({ ...prev, topics: {...prev.topics, [chapter]: [...(prev.topics[chapter] || []), ...newTopics]} }));
      }
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('An unexpected error occurred.');
    } finally {
      setIsTopicsLoading(prev => ({ ...prev, [chapter]: false }));
    }
  }, [standard, subject, topics, isTopicsLoading]);

  const handleChapterSelect = (chapter: string) => {
    if (selectedChapter === chapter || !standard || !subject) return;

    setPersistentState(prev => ({ ...prev, selectedChapter: chapter, selectedTopic: null }));
    cancelSpeech();
    
    if (!topics[chapter]) fetchTopics(chapter);

    setChatHistory([{
        role: 'model',
        parts: `Great! Let's focus on "${chapter}". Select a topic, or ask me a specific question.`
    }]);
  };
  
  const fetchContent = useCallback(async (topic: string, type: 'answer' | 'image' | 'mcqs' | 'eli5'): Promise<void> => {
     if (!selectedChapter || !standard || !subject) return;

    const contentUpdater = (isLoading: boolean, data?: any, error?: string) => {
        setPersistentState(prev => {
            const currentTopicContent = prev.content[topic] || { question: topic, answer: { isLoading: false }, image: { isLoading: false }, mcqs: { isLoading: false }, eli5: { isLoading: false } };
            return {
                ...prev,
                content: {
                    ...prev.content,
                    [topic]: {
                        ...currentTopicContent,
                        [type]: { isLoading, data, error }
                    }
                }
            };
        });
    };
    contentUpdater(true);

    try {
        let result;
        if (type === 'answer') result = await getTopicContent(topic, selectedChapter, standard, subject);
        else if (type === 'image') result = await generateImageForTopic(topic, subject);
        else if (type === 'mcqs') result = await getMCQsForTopic(topic, subject);
        else if (type === 'eli5') result = await getELI5ForTopic(topic, subject);
        contentUpdater(false, result);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load content.';
        contentUpdater(false, undefined, errorMessage);
    }
  }, [selectedChapter, standard, subject]);
  
  const handleGenerateAnswer = (topic: string) => {
    setPersistentState(prev => ({...prev, activeView: {...prev.activeView, [topic]: 'answer'}}));
    if (!content[topic]?.answer.data) fetchContent(topic, 'answer');
  }
  const handleGenerateImage = (topic: string) => {
    setPersistentState(prev => ({...prev, activeView: {...prev.activeView, [topic]: 'image'}}));
    if (!content[topic]?.image.data) fetchContent(topic, 'image');
  }
  const handleGenerateMCQs = (topic: string) => {
    setPersistentState(prev => ({...prev, activeView: {...prev.activeView, [topic]: 'mcqs'}}));
    if (!content[topic]?.mcqs.data) fetchContent(topic, 'mcqs');
  }
  const handleGenerateELI5 = (topic: string) => {
    setPersistentState(prev => ({...prev, activeView: {...prev.activeView, [topic]: 'eli5'}}));
    if (!content[topic]?.eli5.data) fetchContent(topic, 'eli5');
  }

  const handleTopicSelect = (topic: string) => {
      setPersistentState(prev => ({ ...prev, selectedTopic: topic }));
      cancelSpeech();
  }
  
  const handleToggleSpeech = useCallback(async (topic: string) => {
    if (speechState.isPlaying && speechState.currentTopic === topic) {
        cancelSpeech();
        return;
    }
    cancelSpeech();
    
    setSpeechState({ isPlaying: true, currentTopic: topic });

    let answer = content[topic]?.answer?.data;
    if (!answer) {
        await fetchContent(topic, 'answer');
        // Re-check content state after fetch
        let fetchedAnswer: string | undefined;
        setPersistentState(prev => {
            fetchedAnswer = prev.content[topic]?.answer?.data;
            return prev;
        });
        answer = fetchedAnswer;
    }

    if (!answer) {
        setSpeechState({ isPlaying: false, currentTopic: null });
        return;
    }
    
    const utterance = new SpeechSynthesisUtterance(answer);
    const selectedVoice = voices.find(v => v.voiceURI === voiceSettings.voiceURI);
    utterance.voice = selectedVoice || voices.find(v => v.default) || voices[0];
    utterance.rate = voiceSettings.rate;
    utterance.pitch = voiceSettings.pitch;
    utterance.onend = () => setSpeechState({ isPlaying: false, currentTopic: null });
    utterance.onerror = () => setSpeechState({ isPlaying: false, currentTopic: null });
    
    window.speechSynthesis.speak(utterance);
  }, [content, speechState, voices, voiceSettings, fetchContent, cancelSpeech]);

  const handleSendMessage = async (message: string) => {
    if (!chatSession || isChatLoading || !message.trim()) return;

    setIsChatLoading(true);
    const userMessage: ChatMessage = { role: 'user', parts: message };
    setChatHistory(prev => [...prev, userMessage, { role: 'model', parts: '' }]);

    try {
        const stream = await continueChatStream(chatSession, message);
        for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
                setChatHistory(prev => {
                    const newHistory = [...prev];
                    const lastMessage = newHistory[newHistory.length - 1];
                    if (lastMessage.role === 'model') {
                        lastMessage.parts += chunkText;
                    }
                    return newHistory;
                });
            }
        }
    } catch (err) {
        const errorText = err instanceof Error ? `Sorry, an error occurred: ${err.message}` : "Sorry, I couldn't get a response.";
        setChatHistory(prev => {
             const newHistory = [...prev];
             newHistory[newHistory.length - 1] = { role: 'model', parts: errorText };
             return newHistory;
        });
    } finally {
        setIsChatLoading(false);
    }
  };

  const resetStateForNewSelection = () => {
    localStorage.removeItem(APP_STATE_KEY);
    setPersistentState(loadPersistentState()); // Resets to default
    setError(null);
    setChatSession(null);
    setChatHistory([]);
    setIsChatReady(false);
    cancelSpeech();
  };

  const handleCourseSelect = (newSubject: Subject, newStandard: Standard) => {
    setPersistentState(prev => ({ ...prev, subject: newSubject, standard: newStandard, isCourseSelected: true }));
  };

  const currentChapters = (subject && standard && CHAPTERS[subject]?.[standard]) || [];

  return (
    <div className="h-screen flex flex-col font-sans bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <Header 
        theme={theme} 
        onToggleTheme={toggleTheme} 
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      
      <div className="flex-grow overflow-y-auto">
        <main className="w-full container mx-auto p-4 md:p-6 lg:p-8 flex flex-col">
          <div className="flex-grow grid grid-cols-1 md:grid-cols-5 gap-6">
            <aside className="md:col-span-1 flex flex-col gap-6">
              {!isCourseSelected ? (
                <CourseSelector 
                  onSelectCourse={handleCourseSelect}
                  isLoading={Object.values(isTopicsLoading).some(Boolean)}
                />
              ) : (
                subject && standard && (
                  <>
                    <SelectedCoursePanel 
                      subject={subject}
                      standard={standard}
                      onChangeCourse={resetStateForNewSelection}
                    />
                    <ChapterDropdown
                        chapters={currentChapters}
                        selectedChapter={selectedChapter}
                        onSelectChapter={handleChapterSelect}
                        isLoading={Object.values(isTopicsLoading).some(Boolean)}
                    />
                    <TopicDropdown
                        selectedChapter={selectedChapter}
                        topics={topics[selectedChapter || ''] || []}
                        selectedTopic={selectedTopic}
                        onSelectTopic={handleTopicSelect}
                        isLoading={isTopicsLoading[selectedChapter || ''] || false}
                        noMoreTopics={noMoreTopics[selectedChapter || ''] || false}
                        onLoadMore={() => selectedChapter && fetchTopics(selectedChapter)}
                    />
                  </>
                )
              )}
            </aside>
            
            <section className="md:col-span-4 min-w-0">
              <ContentDisplay
                error={error}
                selectedTopic={selectedTopic}
                isCourseSelected={isCourseSelected}
                content={content[selectedTopic || '']}
                activeView={activeView[selectedTopic || '']}
                speechState={speechState}
                onGenerateAnswer={handleGenerateAnswer}
                onGenerateImage={handleGenerateImage}
                onGenerateMCQs={handleGenerateMCQs}
                onGenerateELI5={handleGenerateELI5}
                onToggleSpeech={handleToggleSpeech}
              />
            </section>
          </div>
        </main>
        
        <div className="w-full container mx-auto px-4 md:px-6 lg:px-8 space-y-4 mb-4">
          {isChatReady && (
              <ChatBox 
                  key={`${subject}-${standard}-${selectedChapter || 'general'}-chat`}
                  chatHistory={chatHistory} 
                  isLoading={isChatLoading} 
                  onSendMessage={handleSendMessage} 
              />
          )}
        </div>

        <Footer selectedStandard={standard} />
      </div>
      
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={voiceSettings}
        onSettingsChange={handleVoiceSettingsChange}
        voices={voices}
      />
    </div>
  );
}

export default App;