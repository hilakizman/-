
import React, { useState, useEffect } from 'react';
import LinearGraph from './LinearGraph';
import TutorChat from './TutorChat';
import EquationCard from './EquationCard';
import { generateInvestigation } from '../services/geminiService';
import { InvestigationProblem, GameState } from '../types';

interface InvestigationRoomProps {
  onBack: () => void;
}

const InvestigationRoom: React.FC<InvestigationRoomProps> = ({ onBack }) => {
  const [problem, setProblem] = useState<InvestigationProblem | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.LOADING);
  
  // Steps: 
  // 0: Find Slope (Formula)
  // 1: Find Equation (y=mx+b)
  // 2: Intersection
  // 3: Positivity Line 1 (y > 0)
  // 4: Negativity Line 1 (y < 0)
  // 5: Positivity Line 2 (y > 0)
  // 6: Negativity Line 2 (y < 0)
  const [currentStep, setCurrentStep] = useState(0);

  // Inputs
  const [slopeGuess, setSlopeGuess] = useState('');
  const [equationGuess, setEquationGuess] = useState(''); 
  const [intersectionGuess, setIntersectionGuess] = useState({ x: '', y: '' });
  
  // Interval Inputs
  const [pos1Sign, setPos1Sign] = useState('>');
  const [pos1Val, setPos1Val] = useState('');
  
  const [neg1Sign, setNeg1Sign] = useState('>');
  const [neg1Val, setNeg1Val] = useState('');

  const [pos2Sign, setPos2Sign] = useState('>');
  const [pos2Val, setPos2Val] = useState('');

  const [neg2Sign, setNeg2Sign] = useState('>');
  const [neg2Val, setNeg2Val] = useState('');
  
  const [message, setMessage] = useState('');

  const initGame = async () => {
    setGameState(GameState.LOADING);
    setProblem(null);
    setCurrentStep(0);
    setSlopeGuess('');
    setEquationGuess('');
    setIntersectionGuess({ x: '', y: '' });
    setPos1Val(''); setPos2Val('');
    setNeg1Val(''); setNeg2Val('');
    setMessage('');
    
    try {
      const newProblem = await generateInvestigation();
      setProblem(newProblem);
      setGameState(GameState.PLAYING);
    } catch (e) {
      console.error("Failed to load investigation", e);
      setMessage("שגיאה בטעינת הנתונים. נסה לרענן.");
    }
  };

  useEffect(() => {
    initGame();
  }, []);

  const checkSlope = () => {
    if (!problem) return;
    const val = parseFloat(slopeGuess);
    if (Math.abs(val - problem.line1.m) < 0.1) {
      setMessage('מצוין! מצאת את השיפוע. עכשיו מצא את משוואת הישר.');
      setCurrentStep(1);
    } else {
      setMessage('טעות בשיפוע. זכור: הפרש ה-y חלקי הפרש ה-x.');
    }
  };

  const checkEquation = () => {
    if (!problem) return;
    
    // Parse the user's string input
    // Expected format: y = mx + b (flexible)
    const input = equationGuess.replace(/\s/g, '').toLowerCase(); // remove spaces
    
    if (!input.startsWith('y=')) {
      setMessage("המשוואה חייבת להתחיל ב- 'y='");
      return;
    }

    const rhs = input.substring(2); // Get everything after y=
    
    let m = 0;
    let b = 0;

    // Cases:
    // y = 2x + 3
    // y = x - 5
    // y = -x
    // y = 5
    
    if (rhs.includes('x')) {
      const parts = rhs.split('x');
      const mStr = parts[0];
      const bStr = parts[1]; // Rest of string
      
      // Parse Slope (m)
      if (mStr === '' || mStr === '+') m = 1;
      else if (mStr === '-') m = -1;
      else m = parseFloat(mStr);

      // Parse Intercept (b)
      if (!bStr || bStr === '') b = 0;
      else b = parseFloat(bStr);

    } else {
      // Horizontal line (y = b)
      m = 0;
      b = parseFloat(rhs);
    }

    if (isNaN(m) || isNaN(b)) {
      setMessage("מבנה המשוואה לא תקין. נסה שוב (למשל y=2x+3)");
      return;
    }
    
    // Check against real line 1
    if (Math.abs(m - problem.line1.m) < 0.1 && Math.abs(b - problem.line1.b) < 0.1) {
      setMessage('מעולה! מצאת את הגרף הכחול. הנה הגרף האדום, כעת מצא חיתוך.');
      setCurrentStep(2);
    } else {
      setMessage('המשוואה לא נכונה. נסה לחשב שוב את ה-b על ידי הצבת נקודה.');
    }
  };

  const checkIntersection = () => {
    if (!problem) return;
    const x = parseFloat(intersectionGuess.x);
    const y = parseFloat(intersectionGuess.y);
    
    if (Math.abs(x - problem.intersection.x) < 0.1 && Math.abs(y - problem.intersection.y) < 0.1) {
      setMessage('נכון! עברת לשלב הבא: תחומי חיוביות.');
      setCurrentStep(3);
    } else {
      setMessage('טעות בנקודת החיתוך. נסה שוב.');
    }
  };

  const checkPositivity1 = () => {
    if (!problem) return;
    const correctSign = problem.line1.m > 0 ? '>' : '<';
    const val = parseFloat(pos1Val);
    
    if (pos1Sign === correctSign && Math.abs(val - problem.root1) < 0.1) {
      setMessage('מצוין! מצאת את תחום החיוביות. עכשיו מצא את תחום השליליות של הגרף הכחול.');
      setCurrentStep(4);
    } else {
      setMessage('לא מדויק. בדוק את הסימן או את נקודת האפס.');
    }
  };

  const checkNegativity1 = () => {
    if (!problem) return;
    // Negativity: If slope > 0 (increasing), then y < 0 when x < root.
    //             If slope < 0 (decreasing), then y < 0 when x > root.
    const correctSign = problem.line1.m > 0 ? '<' : '>';
    const val = parseFloat(neg1Val);
    
    if (neg1Sign === correctSign && Math.abs(val - problem.root1) < 0.1) {
      setMessage('מעולה! סיימת עם הגרף הכחול. נעבור לגרף האדום - תחום חיוביות.');
      setCurrentStep(5);
    } else {
      setMessage('טעות בתחום השליליות. נסה להיעזר בגרף.');
    }
  };

  const checkPositivity2 = () => {
    if (!problem) return;
    const correctSign = problem.line2.m > 0 ? '>' : '<';
    const val = parseFloat(pos2Val);
    
    if (pos2Sign === correctSign && Math.abs(val - problem.root2) < 0.1) {
      setMessage('נכון! לסיום, מצא את תחום השליליות של הגרף האדום.');
      setCurrentStep(6);
    } else {
      setMessage('לא מדויק.');
    }
  };

  const checkNegativity2 = () => {
    if (!problem) return;
    const correctSign = problem.line2.m > 0 ? '<' : '>';
    const val = parseFloat(neg2Val);
    
    if (neg2Sign === correctSign && Math.abs(val - problem.root2) < 0.1) {
      setMessage('כל הכבוד! סיימת את החקירה המלאה בהצלחה!');
      setGameState(GameState.SOLVED);
    } else {
      setMessage('לא מדויק.');
    }
  };

  return (
    <div className="min-h-screen bg-teal-50 p-4 md:p-8 font-sans">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
           <button 
            onClick={onBack}
            className="p-2 bg-white rounded-full shadow-sm text-slate-500 hover:text-teal-600 transition-all"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="text-2xl font-black text-teal-900">חקירה מלאה ולימוד עצמאי</h1>
        </div>
        <button onClick={initGame} className="px-4 py-2 bg-teal-600 text-white rounded-full text-sm font-bold shadow hover:bg-teal-700">
          חקירה חדשה
        </button>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 pb-10">
        
        {/* Left: Graph */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white p-1 rounded-xl shadow border border-slate-200">
             {gameState === GameState.LOADING ? (
              <div className="h-96 w-full flex items-center justify-center text-teal-500 animate-pulse font-bold">
                טוען חקירה חדשה...
              </div>
             ) : problem ? (
               <LinearGraph 
                line1={problem.line1}
                line2={problem.line2}
                showIntersection={currentStep > 2}
                intersectionPoint={problem.intersection}
                interactiveX={null}
                showOverlay={false}
                enableTooltip={false}
               />
             ) : null}
          </div>
          
          {problem && (
             <div className="flex flex-col gap-2">
                {currentStep >= 2 ? (
                  <EquationCard line={problem.line1} displayEq={problem.line1Display} label="גרף כחול" />
                ) : (
                  <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 text-center text-slate-400 font-bold">
                    ? = גרף כחול - עליך למצוא אותו
                  </div>
                )}
                
                {currentStep >= 2 ? (
                  <EquationCard line={problem.line2} displayEq={problem.line2Display} label="גרף אדום" />
                ) : (
                  <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 text-center text-slate-400 font-bold">
                     ? = גרף אדום - חסוי כרגע
                  </div>
                )}
             </div>
          )}
        </div>

        {/* Right: Steps & Chat */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          <div className="bg-white rounded-2xl shadow-lg border border-teal-100 overflow-hidden">
             <div className="bg-teal-600 p-4 text-white font-bold text-center">
               דף חקירה
             </div>
             
             <div className="p-4 space-y-6 overflow-y-auto max-h-[500px]">
                
                {/* Step 0: Find Slope */}
                <div className={`transition-opacity ${currentStep === 0 ? 'opacity-100' : 'opacity-50'}`}>
                   <h3 className="font-bold text-teal-800 mb-2 flex items-center gap-2">
                     <span className="bg-teal-100 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                     {problem ? problem.questions.slope : "חשב את השיפוע"}
                   </h3>
                   {problem && (
                     <div className="text-sm text-slate-600 mb-2 bg-slate-50 p-2 rounded text-center">
                       <span className="font-bold block mb-1">הישר עובר דרך הנקודות:</span>
                       <div className="font-mono flex justify-center gap-4 text-lg">
                          <span dir="ltr">({problem.pointsLine1[0].x}, {problem.pointsLine1[0].y})</span>
                          <span className="text-slate-300">|</span>
                          <span dir="ltr">({problem.pointsLine1[1].x}, {problem.pointsLine1[1].y})</span>
                       </div>
                     </div>
                   )}
                   <div className="flex gap-2 items-center">
                     <span className="text-sm font-bold text-slate-500">m =</span>
                     <input 
                       type="number" 
                       value={slopeGuess} 
                       onChange={e => setSlopeGuess(e.target.value)}
                       className="border border-slate-300 rounded p-1 w-20 text-center"
                       disabled={currentStep !== 0}
                       dir="ltr"
                     />
                     {currentStep === 0 && (
                       <button onClick={checkSlope} className="bg-teal-600 text-white px-3 py-1 rounded text-sm font-bold shadow-sm hover:bg-teal-700">בדוק</button>
                     )}
                   </div>
                </div>

                {/* Step 1: Find Equation */}
                <div className={`transition-opacity ${currentStep < 1 ? 'opacity-30 blur-sm pointer-events-none' : currentStep === 1 ? 'opacity-100' : 'opacity-50'}`}>
                   <h3 className="font-bold text-teal-800 mb-2 flex items-center gap-2">
                     <span className="bg-teal-100 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                     {problem ? problem.questions.equation : "מצא את משוואת הישר"}
                   </h3>
                   <div className="flex flex-col gap-2 items-start">
                     <div className="text-xs text-slate-500">כתוב את המשוואה המלאה (לדוגמה: y=2x+3)</div>
                     <div className="flex w-full gap-2">
                        <input 
                          type="text" 
                          placeholder="y=mx+b"
                          value={equationGuess} 
                          onChange={e => setEquationGuess(e.target.value)}
                          className="border border-slate-300 rounded p-2 flex-1 text-center font-mono text-lg bg-white"
                          disabled={currentStep !== 1}
                          dir="ltr"
                        />
                        {currentStep === 1 && (
                          <button onClick={checkEquation} className="bg-teal-600 text-white px-4 py-2 rounded text-sm font-bold shadow-sm hover:bg-teal-700">בדוק</button>
                        )}
                     </div>
                   </div>
                </div>

                {/* Step 2: Intersection */}
                <div className={`transition-opacity ${currentStep < 2 ? 'opacity-30 blur-sm pointer-events-none' : currentStep === 2 ? 'opacity-100' : 'opacity-50'}`}>
                   <h3 className="font-bold text-teal-800 mb-2 flex items-center gap-2">
                     <span className="bg-teal-100 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                     {problem ? problem.questions.intersection : "מצא את נקודת החיתוך"}
                   </h3>
                   <div className="flex gap-2 items-center">
                     <span className="text-sm font-bold text-slate-500">x=</span>
                     <input 
                       type="number" 
                       value={intersectionGuess.x} 
                       onChange={e => setIntersectionGuess({...intersectionGuess, x: e.target.value})}
                       className="border border-slate-300 rounded p-1 w-16 text-center"
                       disabled={currentStep !== 2}
                       dir="ltr"
                     />
                     <span className="text-sm font-bold text-slate-500">y=</span>
                     <input 
                       type="number" 
                       value={intersectionGuess.y} 
                       onChange={e => setIntersectionGuess({...intersectionGuess, y: e.target.value})}
                       className="border border-slate-300 rounded p-1 w-16 text-center"
                       disabled={currentStep !== 2}
                       dir="ltr"
                     />
                     {currentStep === 2 && (
                       <button onClick={checkIntersection} className="bg-teal-600 text-white px-3 py-1 rounded text-sm font-bold shadow-sm hover:bg-teal-700">בדוק</button>
                     )}
                   </div>
                </div>

                {/* Step 3: Positivity Line 1 */}
                <div className={`transition-opacity ${currentStep < 3 ? 'opacity-30 blur-sm pointer-events-none' : currentStep === 3 ? 'opacity-100' : 'opacity-50'}`}>
                   <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                     <span className="bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center text-xs">4</span>
                     {problem ? problem.questions.positivity1 : "תחום חיוביות - גרף כחול"}
                   </h3>
                   <div className="flex gap-2 items-center mt-2" dir="ltr">
                     <span className="font-mono font-bold">x</span>
                     <select 
                        value={pos1Sign} 
                        onChange={e => setPos1Sign(e.target.value)} 
                        className="border border-slate-300 rounded p-1 bg-white cursor-pointer"
                        disabled={currentStep !== 3}
                     >
                        <option value=">">{'>'}</option>
                        <option value="<">{'<'}</option>
                     </select>
                     <input 
                        type="number" 
                        value={pos1Val}
                        onChange={e => setPos1Val(e.target.value)}
                        className="border border-slate-300 rounded p-1 w-16 text-center"
                        disabled={currentStep !== 3}
                        dir="ltr"
                     />
                      {currentStep === 3 && (
                       <button onClick={checkPositivity1} className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold ml-2 shadow-sm hover:bg-blue-700">בדוק</button>
                     )}
                   </div>
                </div>

                {/* Step 4: Negativity Line 1 */}
                <div className={`transition-opacity ${currentStep < 4 ? 'opacity-30 blur-sm pointer-events-none' : currentStep === 4 ? 'opacity-100' : 'opacity-50'}`}>
                   <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                     <span className="bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center text-xs">5</span>
                     {problem ? problem.questions.negativity1 : "תחום שליליות - גרף כחול"}
                   </h3>
                   <div className="flex gap-2 items-center mt-2" dir="ltr">
                     <span className="font-mono font-bold">x</span>
                     <select 
                        value={neg1Sign} 
                        onChange={e => setNeg1Sign(e.target.value)} 
                        className="border border-slate-300 rounded p-1 bg-white cursor-pointer"
                        disabled={currentStep !== 4}
                     >
                        <option value=">">{'>'}</option>
                        <option value="<">{'<'}</option>
                     </select>
                     <input 
                        type="number" 
                        value={neg1Val}
                        onChange={e => setNeg1Val(e.target.value)}
                        className="border border-slate-300 rounded p-1 w-16 text-center"
                        disabled={currentStep !== 4}
                        dir="ltr"
                     />
                      {currentStep === 4 && (
                       <button onClick={checkNegativity1} className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold ml-2 shadow-sm hover:bg-blue-700">בדוק</button>
                     )}
                   </div>
                </div>

                 {/* Step 5: Positivity Line 2 */}
                 <div className={`transition-opacity ${currentStep < 5 ? 'opacity-30 blur-sm pointer-events-none' : currentStep === 5 ? 'opacity-100' : 'opacity-50'}`}>
                   <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                     <span className="bg-red-100 w-6 h-6 rounded-full flex items-center justify-center text-xs">6</span>
                     {problem ? problem.questions.positivity2 : "תחום חיוביות - גרף אדום"}
                   </h3>
                   <div className="flex gap-2 items-center mt-2" dir="ltr">
                     <span className="font-mono font-bold">x</span>
                     <select 
                        value={pos2Sign} 
                        onChange={e => setPos2Sign(e.target.value)} 
                        className="border border-slate-300 rounded p-1 bg-white cursor-pointer"
                        disabled={currentStep !== 5}
                     >
                        <option value=">">{'>'}</option>
                        <option value="<">{'<'}</option>
                     </select>
                     <input 
                        type="number" 
                        value={pos2Val}
                        onChange={e => setPos2Val(e.target.value)}
                        className="border border-slate-300 rounded p-1 w-16 text-center"
                        disabled={currentStep !== 5}
                        dir="ltr"
                     />
                      {currentStep === 5 && (
                       <button onClick={checkPositivity2} className="bg-red-600 text-white px-3 py-1 rounded text-sm font-bold ml-2 shadow-sm hover:bg-red-700">בדוק</button>
                     )}
                   </div>
                </div>

                {/* Step 6: Negativity Line 2 */}
                <div className={`transition-opacity ${currentStep < 6 ? 'opacity-30 blur-sm pointer-events-none' : 'opacity-100'}`}>
                   <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                     <span className="bg-red-100 w-6 h-6 rounded-full flex items-center justify-center text-xs">7</span>
                     {problem ? problem.questions.negativity2 : "תחום שליליות - גרף אדום"}
                   </h3>
                   <div className="flex gap-2 items-center mt-2" dir="ltr">
                     <span className="font-mono font-bold">x</span>
                     <select 
                        value={neg2Sign} 
                        onChange={e => setNeg2Sign(e.target.value)} 
                        className="border border-slate-300 rounded p-1 bg-white cursor-pointer"
                        disabled={currentStep !== 6}
                     >
                        <option value=">">{'>'}</option>
                        <option value="<">{'<'}</option>
                     </select>
                     <input 
                        type="number" 
                        value={neg2Val}
                        onChange={e => setNeg2Val(e.target.value)}
                        className="border border-slate-300 rounded p-1 w-16 text-center"
                        disabled={currentStep !== 6}
                        dir="ltr"
                     />
                      {currentStep === 6 && (
                       <button onClick={checkNegativity2} className="bg-red-600 text-white px-3 py-1 rounded text-sm font-bold ml-2 shadow-sm hover:bg-red-700">סיום</button>
                     )}
                   </div>
                </div>

                {message && (
                  <div className={`mt-4 p-3 rounded-lg text-center text-sm font-bold animate-pulse ${
                    gameState === GameState.SOLVED ? 'bg-green-100 text-green-800' : 'bg-yellow-50 text-yellow-800'
                  }`}>
                    {message}
                  </div>
                )}
             </div>
          </div>

          <div className="flex-1 min-h-[250px] flex flex-col">
            <TutorChat mode="investigation" investigationProblem={problem} />
          </div>

        </div>
      </main>
    </div>
  );
};

export default InvestigationRoom;
