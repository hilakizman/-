import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MathProblem, LearningExample, InvestigationProblem } from '../types';
import { getTutorHelp, getLearningHelp, getInvestigationHelp } from '../services/geminiService';

interface TutorChatProps {
  problem?: MathProblem | null;
  learningExample?: LearningExample | null;
  investigationProblem?: InvestigationProblem | null;
  mode: 'practice' | 'learning' | 'investigation';
}

const TutorChat: React.FC<TutorChatProps> = ({ problem, learningExample, investigationProblem, mode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize chat based on mode
  useEffect(() => {
    setMessages([]); // Reset on problem change
    if (mode === 'practice' && problem) {
      setMessages([{ role: 'model', text: 'היי! אני כאן לעזור לך לפתור את מערכת המשוואות. נתקעת? תשאל חופשי!' }]);
    } else if (mode === 'learning' && learningExample) {
      setMessages([{ role: 'model', text: 'שלום! אני הבוט המלווה שלך ללמידה. אני כאן כדי להסביר כל דבר שלא מובן בגרף או באלגברה. מה תרצה לדעת?' }]);
    } else if (mode === 'investigation' && investigationProblem) {
      setMessages([{ role: 'model', text: 'ברוכים הבאים לחקירה המלאה. נתחיל בנקודת החיתוך ונתקדם לתחומי חיוביות ושליליות. אני כאן לכל שאלה!' }]);
    }
  }, [problem, learningExample, investigationProblem, mode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const processMessage = async (text: string) => {
    // Determine active data based on mode
    const hasData = (mode === 'practice' && problem) || 
                    (mode === 'learning' && learningExample) || 
                    (mode === 'investigation' && investigationProblem);

    if (!hasData) return;
    
    setLoading(true);
    let reply = '';
    
    // Create temp history including current message
    const currentHistory: ChatMessage[] = [...messages, { role: 'user', text }];

    if (mode === 'practice' && problem) {
      reply = await getTutorHelp(currentHistory, problem, text);
    } else if (mode === 'learning' && learningExample) {
      reply = await getLearningHelp(currentHistory, learningExample, text);
    } else if (mode === 'investigation' && investigationProblem) {
      reply = await getInvestigationHelp(currentHistory, investigationProblem, text);
    }
    
    setMessages(prev => [...prev, { role: 'model', text: reply }]);
    setLoading(false);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    processMessage(input);
  };
  
  const handleHint = () => {
     if (loading) return;
     const hintText = "אשמח לקבל רמז קטן שיעזור לי להתקדם.";
     const userMsg: ChatMessage = { role: 'user', text: hintText };
     setMessages(prev => [...prev, userMsg]);
     processMessage(hintText);
  };

  const getHeaderColor = () => {
    if (mode === 'learning') return 'bg-purple-600';
    if (mode === 'investigation') return 'bg-teal-600';
    return 'bg-indigo-600';
  };

  const getUserBubbleColor = () => {
    if (mode === 'learning') return 'bg-purple-100 text-purple-900';
    if (mode === 'investigation') return 'bg-teal-100 text-teal-900';
    return 'bg-indigo-100 text-indigo-900';
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      <div className={`${getHeaderColor()} p-4 text-white transition-colors`}>
        <h3 className="font-bold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          {mode === 'learning' ? 'עוזר למידה' : mode === 'investigation' ? 'עוזר חקירה' : 'המורה הפרטי'}
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 min-h-[300px]" ref={scrollRef}>
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
              m.role === 'user' 
                ? `${getUserBubbleColor()} rounded-br-none` 
                : 'bg-white border border-slate-200 shadow-sm text-slate-800 rounded-bl-none'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-end">
            <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none text-sm text-slate-500 animate-pulse">
              חושב...
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
        <button
          onClick={handleHint}
          disabled={loading}
          className="bg-yellow-100 text-yellow-600 p-2 rounded-full hover:bg-yellow-200 transition-colors shadow-sm"
          title="קבל רמז"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2v1"/><path d="M12 7a5 5 0 1 0-4.9 6.07c.36.98.85 1.93 1.45 2.83h6.9c.6-.9 1.09-1.85 1.45-2.83A5 5 0 0 0 12 7z"/></svg>
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="שאל שאלה..."
          className="flex-1 px-4 py-2 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className={`${getHeaderColor()} text-white p-2 rounded-full transition-colors disabled:opacity-50`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
    </div>
  );
};

export default TutorChat;