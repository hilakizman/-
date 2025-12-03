
import React, { useState, useEffect, useRef } from 'react';
import LinearGraph from './LinearGraph';
import { generateGameChallenge, formatLinearEquation } from '../services/geminiService';
import { GameChallenge, GameState } from '../types';

interface GameRoomProps {
  onBack: () => void;
}

const GameRoom: React.FC<GameRoomProps> = ({ onBack }) => {
  const [challenge, setChallenge] = useState<GameChallenge | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.LOADING);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [feedback, setFeedback] = useState<{correct: boolean, text: string} | null>(null);
  const [openAnswerInput, setOpenAnswerInput] = useState('');
  
  // Timer logic
  const [timer, setTimer] = useState(60);
  const timerRef = useRef<number | null>(null);

  const loadChallenge = async () => {
    setGameState(GameState.LOADING);
    setFeedback(null);
    setOpenAnswerInput('');
    setTimer(challenge?.difficulty === 'hard' ? 45 : 60); // Reset timer based on difficulty

    try {
      const data = await generateGameChallenge();
      setChallenge(data);
      setGameState(GameState.PLAYING);
    } catch (e) {
      console.error(e);
      // Simple fallback to keep game running if API fails
      setChallenge({
         type: 'true-false',
         question: 'האם השיפוע חיובי?',
         line1: {m: 2, b:0, color: 'blue', id:1},
         correctAnswer: true,
         explanation: 'm=2 ולכן חיובי',
         difficulty: 'easy'
      });
      setGameState(GameState.PLAYING);
    }
  };

  useEffect(() => {
    loadChallenge();
    return () => stopTimer();
  }, []);

  // Timer Effect
  useEffect(() => {
    if (gameState === GameState.PLAYING && !feedback) {
      timerRef.current = window.setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
             handleTimeOut();
             return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => stopTimer();
  }, [gameState, feedback]);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTimeOut = () => {
    stopTimer();
    setLives(l => l - 1);
    setStreak(0);
    setFeedback({ correct: false, text: 'נגמר הזמן! ⏰' });
    checkGameOver(lives - 1);
  };

  const checkGameOver = (currentLives: number) => {
    if (currentLives <= 0) {
      setGameState(GameState.FINISHED);
    }
  };

  const handleAnswer = (userAnswer: string | number | boolean) => {
    if (!challenge || feedback) return;
    stopTimer();

    let isCorrect = false;

    // Normalize comparison
    if (challenge.type === 'true-false') {
      isCorrect = userAnswer === challenge.correctAnswer;
    } else if (challenge.type === 'multiple-choice') {
      isCorrect = userAnswer === challenge.correctAnswer;
    } else if (challenge.type === 'open-answer') {
       // Allow slight numeric tolerance or exact string match
       const numUser = parseFloat(userAnswer as string);
       const numCorrect = parseFloat(challenge.correctAnswer as string);
       if (!isNaN(numUser) && !isNaN(numCorrect)) {
         isCorrect = Math.abs(numUser - numCorrect) < 0.1;
       } else {
         isCorrect = String(userAnswer).trim() === String(challenge.correctAnswer).trim();
       }
    }
    
    if (isCorrect) {
      const timeBonus = Math.floor(timer / 5);
      const points = 10 + (streak * 2) + timeBonus;
      setScore(s => s + points);
      setStreak(s => s + 1);
      setFeedback({ correct: true, text: `נכון מאוד! ${challenge.explanation} (+${points} נק')` });
    } else {
      setLives(l => l - 1);
      setStreak(0);
      setFeedback({ correct: false, text: `טעות... ${challenge.explanation}` });
      checkGameOver(lives - 1);
    }
  };

  const handleRestart = () => {
    setScore(0);
    setLives(3);
    setStreak(0);
    setGameState(GameState.LOADING);
    loadChallenge();
  };

  // --- RENDER HELPERS ---

  const renderVisuals = () => {
    if (!challenge) return null;
    if (challenge.line1 && challenge.line2) {
       return (
         <div className="bg-white p-2 rounded-xl shadow-lg border-4 border-orange-200 h-64 w-full max-w-md mx-auto">
            <LinearGraph 
               line1={challenge.line1}
               line2={challenge.line2}
               showIntersection={true}
               intersectionPoint={{x:0, y:0}} 
               interactiveX={null}
               showOverlay={false}
               enableTooltip={false}
            />
         </div>
       );
    }
    return null;
  };

  const renderInputArea = () => {
    if (!challenge) return null;

    if (challenge.type === 'true-false') {
      return (
        <div className="flex gap-4 justify-center">
          <button 
            onClick={() => handleAnswer(true)}
            className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black text-xl shadow-lg transform transition active:scale-95 w-32"
          >
            אמת ✔️
          </button>
          <button 
             onClick={() => handleAnswer(false)}
             className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xl shadow-lg transform transition active:scale-95 w-32"
          >
            שקר ❌
          </button>
        </div>
      );
    }

    if (challenge.type === 'multiple-choice' && challenge.options) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenge.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(opt)}
              className="px-6 py-4 bg-white border-2 border-orange-200 hover:bg-orange-50 hover:border-orange-400 rounded-xl font-bold text-slate-700 shadow-sm transition"
              dir="ltr"
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }

    if (challenge.type === 'open-answer') {
      return (
        <div className="flex flex-col items-center gap-4">
           <input
             type="text"
             value={openAnswerInput}
             onChange={(e) => setOpenAnswerInput(e.target.value)}
             className="text-2xl p-3 border-2 border-orange-300 rounded-xl text-center w-full max-w-xs font-mono"
             placeholder="הכנס תשובה..."
             dir="ltr"
             onKeyDown={(e) => e.key === 'Enter' && handleAnswer(openAnswerInput)}
           />
           <button 
             onClick={() => handleAnswer(openAnswerInput)}
             className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-full font-bold shadow-lg"
           >
             בדיקה
           </button>
        </div>
      );
    }
    return null;
  };

  // --- MAIN RENDER ---

  if (gameState === GameState.FINISHED) {
    return (
      <div className="min-h-screen bg-orange-50 p-6 flex items-center justify-center font-sans">
         <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-md w-full border-t-8 border-orange-500 animate-fade-in">
            <div className="text-6xl mb-4">🏁</div>
            <h1 className="text-4xl font-black text-slate-800 mb-2">המשחק נגמר!</h1>
            <p className="text-slate-500 mb-6">ניסיון יפה! הנה הסיכום שלך:</p>
            
            <div className="bg-orange-50 p-6 rounded-2xl mb-8">
               <div className="text-sm font-bold text-orange-400 uppercase">ניקוד סופי</div>
               <div className="text-5xl font-black text-orange-600">{score}</div>
            </div>
            
            <div className="flex gap-4">
               <button onClick={onBack} className="flex-1 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300">יציאה</button>
               <button onClick={handleRestart} className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-xl shadow-lg hover:bg-orange-700">שחק שוב</button>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-4 font-sans flex flex-col">
       {/* Header with Stats */}
       <header className="max-w-4xl mx-auto w-full flex justify-between items-center mb-6">
        <button onClick={onBack} className="p-2 bg-white rounded-full shadow hover:bg-orange-100 transition text-slate-500">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        
        <div className="flex gap-4">
           {/* Lives */}
           <div className="flex gap-1 bg-white px-3 py-1 rounded-full shadow border border-red-100">
              {[...Array(3)].map((_, i) => (
                <span key={i} className={`text-xl transition-all ${i < lives ? 'scale-100' : 'scale-75 opacity-20 grayscale'}`}>❤️</span>
              ))}
           </div>
           
           {/* Score */}
           <div className="bg-white px-4 py-1 rounded-full shadow border border-orange-200 flex items-center gap-2">
              <span className="font-black text-orange-600 text-lg">{score}</span>
              {streak > 1 && <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">x{streak} 🔥</span>}
           </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 max-w-3xl mx-auto w-full flex flex-col justify-center items-center gap-6">
        
        {/* Timer Bar */}
        {gameState === GameState.PLAYING && (
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
             <div 
               className={`h-full transition-all duration-1000 ease-linear ${timer < 10 ? 'bg-red-500' : 'bg-green-500'}`} 
               style={{ width: `${(timer / 60) * 100}%` }}
             ></div>
          </div>
        )}

        {gameState === GameState.LOADING && (
          <div className="text-center py-20 animate-pulse text-orange-400 font-bold text-xl">
             מכין חידה מתמטית... 🎲
          </div>
        )}

        {gameState === GameState.PLAYING && challenge && (
          <div className="w-full space-y-6">
            
            {/* Visual Context (if applicable) */}
            {renderVisuals()}

            {/* Question Card */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border-t-8 border-orange-400 text-center relative overflow-hidden">
               {/* Timer Badge inside card */}
               <div className="absolute top-4 right-4 bg-slate-100 text-slate-600 font-mono font-bold px-3 py-1 rounded-lg">
                  {timer}s
               </div>

               <h3 className="text-slate-400 font-bold mb-4 uppercase tracking-wider text-sm">
                  {challenge.type === 'true-false' ? 'אמת או שקר?' : challenge.type === 'multiple-choice' ? 'בחר את התשובה הנכונה' : 'חשב את התשובה'}
               </h3>
               
               <p className="text-2xl md:text-3xl font-black text-slate-800 mb-8 leading-relaxed">
                 {challenge.question}
               </p>
               
               {/* Render Inputs / Buttons */}
               {!feedback ? (
                  <div className="animate-fade-in">
                    {renderInputArea()}
                  </div>
               ) : (
                  <div className="animate-fade-in">
                     <div className={`p-4 rounded-xl mb-6 border-2 ${feedback.correct ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                        <div className="font-black text-2xl mb-2">{feedback.correct ? 'יש! 🎉' : 'אוי לא... 😕'}</div>
                        <div className="text-lg font-medium">{feedback.text}</div>
                     </div>
                     <button 
                       onClick={loadChallenge} 
                       className="w-full py-4 bg-orange-600 text-white font-bold rounded-xl shadow-lg hover:bg-orange-700 transition transform hover:scale-105"
                     >
                        החידה הבאה &rarr;
                     </button>
                  </div>
               )}
            </div>
            
            <div className="text-center text-slate-400 text-sm">
               השיא שלך הוא המטרה הבאה!
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default GameRoom;
