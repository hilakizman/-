
import React, { useState, useEffect } from 'react';
import { generateQuiz, evaluateQuiz } from '../services/geminiService';
import { QuizQuestion, QuizResult } from '../types';

interface QuizRoomProps {
  onBack: () => void;
}

const QuizRoom: React.FC<QuizRoomProps> = ({ onBack }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    const init = async () => {
      const q = await generateQuiz();
      setQuestions(q);
      setLoading(false);
    };
    init();
  }, []);

  const handleOptionSelect = (val: string) => {
    setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: val }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await evaluateQuiz(questions, answers);
      setResult(res);
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <div className="text-2xl font-bold text-pink-600 animate-pulse">מכין את המבדק המסכם...</div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-pink-50 p-6 flex items-center justify-center font-sans">
        <div className="bg-white max-w-2xl w-full p-8 rounded-3xl shadow-2xl text-center border-t-8 border-pink-500 animate-fade-in">
           <h1 className="text-3xl font-black text-slate-800 mb-2">תעודת סיכום</h1>
           <div className="text-slate-500 mb-8">נושא: חקירת ישרים וחיתוך</div>
           
           <div className="flex justify-center mb-8">
             <div className="relative">
               <svg className="w-40 h-40 transform -rotate-90">
                 <circle cx="80" cy="80" r="70" stroke="#fce7f3" strokeWidth="10" fill="transparent" />
                 <circle cx="80" cy="80" r="70" stroke="#ec4899" strokeWidth="10" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * result.score) / 100} />
               </svg>
               <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
                 <span className="text-5xl font-black text-pink-600">{result.score}</span>
                 <span className="text-sm text-pink-400">ציון סופי</span>
               </div>
             </div>
           </div>

           <div className="text-right bg-pink-50 p-6 rounded-2xl mb-6">
             <h3 className="font-bold text-pink-800 mb-2 border-b border-pink-200 pb-2">משוב אישי:</h3>
             <p className="text-slate-700 leading-relaxed mb-4">{result.feedback}</p>
             
             <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-3 rounded-lg border border-green-200">
                  <span className="block font-bold text-green-700 mb-1">נקודת חוזק 💪</span>
                  {result.strengthArea}
                </div>
                <div className="bg-white p-3 rounded-lg border border-orange-200">
                   <span className="block font-bold text-orange-700 mb-1">נקודה לשיפור 🎯</span>
                   {result.weaknessArea}
                </div>
             </div>
           </div>

           <button onClick={onBack} className="bg-slate-800 text-white px-8 py-3 rounded-full font-bold hover:bg-slate-900 transition shadow-lg">
             חזרה ללובי
           </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-pink-50 p-4 font-sans">
       <header className="max-w-3xl mx-auto mb-8 pt-4">
         <div className="flex justify-between items-end mb-2">
           <h1 className="text-2xl font-black text-pink-900">מבדק סיכום</h1>
           <span className="font-bold text-pink-600">שאלה {currentIndex + 1} מתוך {questions.length}</span>
         </div>
         <div className="h-3 bg-pink-200 rounded-full overflow-hidden">
            <div className="h-full bg-pink-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
         </div>
       </header>

       <main className="max-w-3xl mx-auto bg-white p-8 rounded-3xl shadow-xl min-h-[400px] flex flex-col justify-between">
          <div>
            <div className="text-xl font-bold text-slate-800 mb-8 leading-loose">
              {currentQ.text}
            </div>

            {currentQ.type === 'multiple-choice' && currentQ.options ? (
               <div className="grid gap-4">
                 {currentQ.options.map((opt, idx) => (
                   <button 
                     key={idx}
                     onClick={() => handleOptionSelect(opt)}
                     className={`p-4 rounded-xl border-2 text-right transition-all text-lg font-medium ${
                       answers[currentQ.id] === opt 
                         ? 'border-pink-500 bg-pink-50 text-pink-900 shadow-md' 
                         : 'border-slate-100 hover:border-pink-200 text-slate-600'
                     }`}
                     dir="ltr"
                   >
                     {opt}
                   </button>
                 ))}
               </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-8">
                 <input 
                   type="text" 
                   value={answers[currentQ.id] || ''}
                   onChange={(e) => handleOptionSelect(e.target.value)}
                   className="text-3xl font-mono text-center border-b-4 border-pink-200 focus:border-pink-500 outline-none p-2 w-48 text-pink-900"
                   placeholder="הקלד תשובה"
                   dir="ltr"
                 />
                 <div className="text-slate-400 text-sm">הכנס ערך מספרי</div>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-12 pt-6 border-t border-slate-100">
             <button 
               onClick={handlePrev} 
               disabled={currentIndex === 0}
               className="text-slate-400 font-bold hover:text-slate-600 disabled:opacity-30 flex items-center gap-2"
             >
               &rarr; הקודם
             </button>

             {currentIndex === questions.length - 1 ? (
               <button 
                 onClick={handleSubmit}
                 disabled={submitting}
                 className="bg-green-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-green-700 transition transform hover:scale-105"
               >
                 {submitting ? 'בודק...' : 'הגש מבחן ✨'}
               </button>
             ) : (
                <button 
                  onClick={handleNext}
                  className="bg-pink-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-pink-700 transition transform hover:scale-105 flex items-center gap-2"
                >
                  הבא &larr;
                </button>
             )}
          </div>
       </main>
    </div>
  );
};

export default QuizRoom;
