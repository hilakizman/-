
import React, { useState, useEffect } from 'react';
import { generateProblem } from './services/geminiService';
import { MathProblem, GameState, AppMode } from './types';
import LinearGraph from './components/LinearGraph';
import EquationCard from './components/EquationCard';
import TutorChat from './components/TutorChat';
import LearningRoom from './components/LearningRoom';
import InvestigationRoom from './components/InvestigationRoom';
import GameRoom from './components/GameRoom';
import QuizRoom from './components/QuizRoom';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('lobby');
  
  // Game State (Practice Mode)
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [userGuess, setUserGuess] = useState<{ x: string, y: string }>({ x: '', y: '' });
  const [gameState, setGameState] = useState<GameState>(GameState.LOADING);
  const [message, setMessage] = useState<string>('');
  const [score, setScore] = useState(0);
  
  // Interactive Slider State (Practice Mode)
  const [sliderX, setSliderX] = useState<number>(0);
  const [showSlider, setShowSlider] = useState(true);

  const initGame = async () => {
    setGameState(GameState.LOADING);
    setMessage('');
    setUserGuess({ x: '', y: '' });
    setShowSlider(true);
    
    // Generate new problem
    const newProblem = await generateProblem('medium');
    setProblem(newProblem);
    setSliderX(0);
    setGameState(GameState.PLAYING);
  };

  useEffect(() => {
    if (appMode === 'practice') {
      initGame();
    }
  }, [appMode]);

  const handleCheck = () => {
    if (!problem) return;

    const xVal = parseFloat(userGuess.x);
    const yVal = parseFloat(userGuess.y);

    if (isNaN(xVal) || isNaN(yVal)) {
      setMessage('נא להכניס מספרים תקינים');
      return;
    }

    const tolerance = 0.1;
    if (Math.abs(xVal - problem.solution.x) < tolerance && Math.abs(yVal - problem.solution.y) < tolerance) {
      setGameState(GameState.SOLVED);
      setScore(s => s + 10);
      setMessage('כל הכבוד! תשובה נכונה! 🎉');
      setShowSlider(false); 
    } else {
      setMessage('לא בדיוק... נסה שוב או היעזר במורה הפרטי.');
    }
  };

  const getProblemTitle = (type: string) => {
    switch (type) {
      case 'implicit': return 'סדר את המשוואות ומצא חיתוך';
      case 'word': return 'בעיה מילולית';
      default: return 'משוואות מפורשות';
    }
  };

  // --- RENDER VIEWS ---

  if (appMode === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4 md:p-8 flex items-center justify-center font-sans">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-black text-indigo-900 mb-4 tracking-tight">נקודת חיתוך בין שני ישרים</h1>
            <p className="text-xl text-indigo-600 font-medium">מערכת לחקירה ולימוד עצמאי</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Learning Room Card */}
            <button 
              onClick={() => setAppMode('learn')}
              className="group bg-white p-6 rounded-3xl shadow-xl border-2 border-transparent hover:border-purple-400 hover:shadow-2xl transition-all duration-300 text-right relative overflow-hidden"
            >
              <div className="absolute top-4 left-4 font-black text-6xl text-purple-50 group-hover:text-purple-100 transition-colors pointer-events-none">1</div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-4 text-2xl">🎓</div>
                <h2 className="text-xl font-black text-slate-800 mb-2 group-hover:text-purple-600 transition-colors">חדר לימוד</h2>
                <p className="text-slate-500 mb-4 text-sm flex-1">
                  חיבור בין הגרף למשוואה בצורה אינטראקטיבית.
                </p>
                <span className="inline-block px-3 py-1 bg-purple-50 text-purple-700 font-bold rounded-full text-xs self-start">כניסה &larr;</span>
              </div>
            </button>

            {/* 2. Practice Room Card */}
            <button 
              onClick={() => setAppMode('practice')}
              className="group bg-white p-6 rounded-3xl shadow-xl border-2 border-transparent hover:border-indigo-400 hover:shadow-2xl transition-all duration-300 text-right relative overflow-hidden"
            >
              <div className="absolute top-4 left-4 font-black text-6xl text-indigo-50 group-hover:text-indigo-100 transition-colors pointer-events-none">2</div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4 text-2xl">🚀</div>
                <h2 className="text-xl font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">חדר תרגול</h2>
                <p className="text-slate-500 mb-4 text-sm flex-1">
                  תרגול שאלות מכל הסוגים: מפורשות, סידור ובעיות מילוליות.
                </p>
                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-full text-xs self-start">כניסה &larr;</span>
              </div>
            </button>

            {/* 3. Investigation Room Card */}
            <button 
              onClick={() => setAppMode('investigation')}
              className="group bg-white p-6 rounded-3xl shadow-xl border-2 border-transparent hover:border-teal-400 hover:shadow-2xl transition-all duration-300 text-right relative overflow-hidden"
            >
              <div className="absolute top-4 left-4 font-black text-6xl text-teal-50 group-hover:text-teal-100 transition-colors pointer-events-none">3</div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mb-4 text-2xl">🔎</div>
                <h2 className="text-xl font-black text-slate-800 mb-2 group-hover:text-teal-600 transition-colors">חקירה מלאה</h2>
                <p className="text-slate-500 mb-4 text-sm flex-1">
                  חקירה מלאה: מציאת שיפוע, משוואה, חיתוך, וחיוביות.
                </p>
                <span className="inline-block px-3 py-1 bg-teal-50 text-teal-700 font-bold rounded-full text-xs self-start">כניסה &larr;</span>
              </div>
            </button>

            {/* 4. Games Room Card */}
            <button 
              onClick={() => setAppMode('games')}
              className="group bg-white p-6 rounded-3xl shadow-xl border-2 border-transparent hover:border-orange-400 hover:shadow-2xl transition-all duration-300 text-right relative overflow-hidden"
            >
              <div className="absolute top-4 left-4 font-black text-6xl text-orange-50 group-hover:text-orange-100 transition-colors pointer-events-none">4</div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 text-2xl">🎮</div>
                <h2 className="text-xl font-black text-slate-800 mb-2 group-hover:text-orange-600 transition-colors">חדר משחקים</h2>
                <p className="text-slate-500 mb-4 text-sm flex-1">
                  אתגרי חשיבה ומשחקים מתמטיים ברמה גבוהה.
                </p>
                <span className="inline-block px-3 py-1 bg-orange-50 text-orange-700 font-bold rounded-full text-xs self-start">כניסה &larr;</span>
              </div>
            </button>

             {/* 5. Quiz Room Card */}
             <button 
              onClick={() => setAppMode('quiz')}
              className="group bg-white p-6 rounded-3xl shadow-xl border-2 border-transparent hover:border-pink-400 hover:shadow-2xl transition-all duration-300 text-right relative overflow-hidden md:col-span-2 lg:col-span-4"
            >
              <div className="absolute top-4 left-4 font-black text-6xl text-pink-50 group-hover:text-pink-100 transition-colors pointer-events-none">5</div>
              <div className="relative z-10 flex flex-col items-center text-center h-full">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4 text-3xl">🏆</div>
                <h2 className="text-2xl font-black text-slate-800 mb-2 group-hover:text-pink-600 transition-colors">מבדק סיכום</h2>
                <p className="text-slate-500 mb-4 text-sm max-w-md">
                  בחן את הידע שלך! קבל ציון ומשוב אישי מבוסס AI על כל הנושאים שנלמדו.
                </p>
                <span className="inline-block px-6 py-2 bg-pink-50 text-pink-700 font-bold rounded-full text-sm">התחל מבדק &larr;</span>
              </div>
            </button>
          </div>
          
          <div className="mt-12 text-center text-slate-400 text-sm font-medium">
            פותח עבור כיתות ח' אומן קציר משגב
          </div>
        </div>
      </div>
    );
  }

  if (appMode === 'learn') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4 md:p-8 font-sans">
        <LearningRoom onBack={() => setAppMode('lobby')} />
      </div>
    );
  }

  if (appMode === 'investigation') {
    return (
       <InvestigationRoom onBack={() => setAppMode('lobby')} />
    );
  }

  if (appMode === 'games') {
    return <GameRoom onBack={() => setAppMode('lobby')} />;
  }

  if (appMode === 'quiz') {
    return <QuizRoom onBack={() => setAppMode('lobby')} />;
  }

  // PRACTICE MODE
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4 md:p-8 font-sans">
      {/* Header */}
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-6 gap-4 animate-fade-in">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={() => setAppMode('lobby')}
            className="p-2 bg-white rounded-full shadow-sm text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
            title="חזרה ללובי"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div>
            <h1 className="text-2xl font-black text-indigo-900 tracking-tight">
              חדר תרגול
            </h1>
            <p className="text-indigo-600 font-medium text-xs">מציאת נקודת חיתוך</p>
          </div>
        </div>

        <div className="flex gap-3">
             <button
                 onClick={initGame}
                 className="px-4 py-2 rounded-full font-bold text-sm bg-white text-indigo-600 shadow-sm border border-indigo-100 hover:bg-indigo-50 transition-colors"
               >
                 שאלה חדשה
               </button>
            <div className="bg-white px-6 py-2 rounded-full shadow-md border border-indigo-100 flex items-center gap-2">
              <span className="text-sm font-bold text-slate-500">ניקוד:</span>
              <span className="text-xl font-black text-indigo-600">{score}</span>
            </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
        
        {/* Left Column: Visualization & Inputs */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Main Visualizer */}
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200">
             {gameState === GameState.LOADING ? (
              <div className="h-96 w-full rounded-xl bg-slate-50 animate-pulse flex items-center justify-center">
                <span className="text-indigo-400 font-medium">טוען בעיה חדשה...</span>
              </div>
            ) : problem ? (
              <>
                 {/* Graph Component */}
                 <LinearGraph 
                  line1={problem.line1} 
                  line2={problem.line2} 
                  showIntersection={gameState === GameState.SOLVED}
                  intersectionPoint={problem.solution}
                  interactiveX={showSlider ? sliderX : null}
                  showOverlay={false} // Hidden as requested for practice
                  enableTooltip={false}
                />
                
                {/* Interactive Slider Control */}
                {showSlider && (
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-xl">
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                      <span>הזז את ה-X כדי להשוות גבהים (y)</span>
                      {/* Removed X value display as requested */}
                    </div>
                    <input 
                      type="range" 
                      min="-10" 
                      max="10" 
                      step="0.5"
                      value={sliderX}
                      onChange={(e) => setSliderX(parseFloat(e.target.value))}
                      className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500"
                    />
                    <div className="mt-2 text-center text-xs text-slate-400">
                      גרור כדי לראות מתי הקווים נפגשים
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Solution Input Area */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold text-slate-800">התשובה שלך</h2>
               {problem && (
                 <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                   problem.type === 'word' ? 'bg-purple-100 text-purple-700' :
                   problem.type === 'implicit' ? 'bg-orange-100 text-orange-700' :
                   'bg-blue-100 text-blue-700'
                 }`}>
                   {getProblemTitle(problem.type)}
                 </span>
               )}
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-500 mb-1 ml-1 text-center">x</label>
                  <input
                    type="number"
                    value={userGuess.x}
                    onChange={(e) => setUserGuess({ ...userGuess, x: e.target.value })}
                    className="w-20 px-2 py-2 text-lg font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-center bg-white"
                    placeholder="?"
                    disabled={gameState === GameState.SOLVED}
                    dir="ltr"
                  />
                </div>
                <span className="text-2xl text-slate-300">,</span>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-500 mb-1 ml-1 text-center">y</label>
                  <input
                    type="number"
                    value={userGuess.y}
                    onChange={(e) => setUserGuess({ ...userGuess, y: e.target.value })}
                    className="w-20 px-2 py-2 text-lg font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-center bg-white"
                    placeholder="?"
                    disabled={gameState === GameState.SOLVED}
                    dir="ltr"
                  />
                </div>
              </div>

              <button
                onClick={handleCheck}
                disabled={gameState === GameState.SOLVED}
                className={`flex-1 px-6 py-4 rounded-xl font-bold text-lg shadow-md transition-all ${
                  gameState === GameState.SOLVED
                    ? 'bg-green-500 text-white cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg text-white'
                }`}
              >
                {gameState === GameState.SOLVED ? 'נכון מאוד!' : 'בדיקה'}
              </button>
            </div>
            
            {message && (
              <div className={`mt-4 p-3 rounded-lg text-center font-bold animate-fade-in ${
                gameState === GameState.SOLVED ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Problem Data & Chat */}
        <div className="lg:col-span-5 flex flex-col gap-6 h-auto min-h-[500px]">
          
          {problem && (
            <div className="flex flex-col gap-4">
              {/* Context/Story Card for Word Problems */}
              {problem.type === 'word' && problem.storyContext && (
                <div className="bg-purple-50 p-5 rounded-xl border border-purple-100 shadow-sm">
                  <h3 className="text-sm font-bold text-purple-800 mb-2 flex items-center gap-2">
                    <span className="text-xl">📖</span> סיפור המקרה
                  </h3>
                  <p className="text-purple-900 leading-relaxed text-sm md:text-base">
                    {problem.storyContext}
                  </p>
                </div>
              )}

              {/* Equation Cards */}
              <div className="space-y-3">
                 <EquationCard line={problem.line1} displayEq={problem.line1Display} label="פונקציה א'" />
                 <EquationCard line={problem.line2} displayEq={problem.line2Display} label="פונקציה ב'" />
              </div>

              {/* Implicit Hint */}
              {problem.type === 'implicit' && (
                <div className="bg-orange-50 px-4 py-3 rounded-lg border border-orange-100 text-sm text-orange-800 flex items-start gap-2">
                  <span className="text-xl">💡</span>
                  <p>טיפ: כדי למצוא את החיתוך, כדאי קודם לבודד את ה-y בכל משוואה.</p>
                </div>
              )}
            </div>
          )}
          
          <div className="flex-1 min-h-[400px] flex flex-col">
             <TutorChat mode="practice" problem={problem} />
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;
