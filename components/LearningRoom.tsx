import React, { useState } from 'react';
import LinearGraph from './LinearGraph';
import TutorChat from './TutorChat';
import { LearningExample } from '../types';

interface LearningRoomProps {
  onBack: () => void;
}

const EXAMPLES: LearningExample[] = [
  {
    id: 1,
    title: "דוגמה קלאסית: שיפועים הפוכים",
    line1: { m: 2, b: -2, color: '#2563eb', id: 1 },
    line2: { m: -1, b: 4, color: '#dc2626', id: 2 },
    line1Display: "y = 2x - 2",
    line2Display: "y = -x + 4",
    intersectionX: 2,
    description: "כאן רואים שני ישרים עם שיפועים מנוגדים. האחד עולה והשני יורד. הנקודה היחידה בה הם באותו גובה היא נקודת החיתוך."
  },
  {
    id: 2,
    title: "דוגמה 2: שיפועים חיוביים",
    line1: { m: 3, b: 1, color: '#2563eb', id: 1 },
    line2: { m: 1, b: -3, color: '#dc2626', id: 2 },
    line1Display: "y = 3x + 1",
    line2Display: "y = x - 3",
    intersectionX: -2,
    description: "גם כשיש שני ישרים עולים, הם ייפגשו אם השיפועים שלהם שונים. שימו לב שהחיתוך כאן קורה בערך x שלילי."
  },
  {
    id: 3,
    title: "דוגמה 3: חיתוך בראשית הצירים",
    line1: { m: 2, b: 0, color: '#2563eb', id: 1 },
    line2: { m: -0.5, b: 0, color: '#dc2626', id: 2 },
    line1Display: "y = 2x",
    line2Display: "y = -0.5x",
    intersectionX: 0,
    description: "כאשר לשתי הפונקציות אין איבר חופשי (b=0), שתיהן עוברות דרך ראשית הצירים (0,0). זוהי נקודת החיתוך."
  }
];

const LearningRoom: React.FC<LearningRoomProps> = ({ onBack }) => {
  const [exampleIndex, setExampleIndex] = useState(0);
  const [sliderX, setSliderX] = useState<number>(0);
  
  const currentExample = EXAMPLES[exampleIndex];
  
  const y1 = currentExample.line1.m * sliderX + currentExample.line1.b;
  const y2 = currentExample.line2.m * sliderX + currentExample.line2.b;
  
  const isIntersection = Math.abs(sliderX - currentExample.intersectionX) < 0.1;

  const nextExample = () => {
    setExampleIndex((prev) => (prev + 1) % EXAMPLES.length);
    setSliderX(0); // Reset slider
  };

  const prevExample = () => {
    setExampleIndex((prev) => (prev - 1 + EXAMPLES.length) % EXAMPLES.length);
    setSliderX(0); // Reset slider
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto gap-4 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-full hover:bg-slate-200 transition-colors"
            title="חזרה לתפריט"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h2 className="text-2xl font-black text-slate-800">חדר לימוד: שיטת ההשוואה</h2>
        </div>
        
        <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-slate-200">
          <button onClick={prevExample} className="p-2 hover:bg-slate-100 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span className="text-sm font-bold text-slate-600 px-2 min-w-[150px] text-center">
            {currentExample.title} ({exampleIndex + 1}/{EXAMPLES.length})
          </span>
          <button onClick={nextExample} className="p-2 hover:bg-slate-100 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Interactive Graph (7 columns) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white p-2 rounded-xl shadow border border-slate-200 min-h-[400px]">
            <LinearGraph 
              line1={currentExample.line1} 
              line2={currentExample.line2} 
              showIntersection={true} 
              intersectionPoint={{
                x: currentExample.intersectionX, 
                y: currentExample.line1.m * currentExample.intersectionX + currentExample.line1.b
              }} 
              interactiveX={sliderX}
            />
          </div>
          
          {/* Slider Control */}
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 shadow-sm">
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-bold text-indigo-900">
                הזז את ה-X: חפש מתי הגבהים שווים
              </label>
              <div className="font-mono text-indigo-700 bg-white px-3 py-1 rounded shadow-sm font-bold" dir="ltr">
                 x = {sliderX.toFixed(1)}
              </div>
            </div>
            <input 
              type="range" 
              min={currentExample.intersectionX - 5} 
              max={currentExample.intersectionX + 5} 
              step="0.1" 
              value={sliderX}
              onChange={(e) => setSliderX(parseFloat(e.target.value))}
              className="w-full h-3 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500"
              dir="ltr"
            />
            <div className="flex justify-between mt-2 text-xs text-slate-500 font-mono" dir="ltr">
              <span>{currentExample.intersectionX - 5}</span>
              <span>{currentExample.intersectionX + 5}</span>
            </div>
          </div>

          {/* Value Comparison */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className={`p-3 rounded-xl border-2 transition-all shadow-sm ${y1 === y2 ? 'border-green-400 bg-green-50' : 'border-blue-100 bg-white'}`}>
              <div className="text-xs text-slate-500 mb-1 font-bold">גובה (y) פונקציה 1</div>
              <div className="font-mono text-xl font-bold text-blue-700" dir="ltr">{y1.toFixed(2)}</div>
            </div>
            
            <div className={`p-3 rounded-xl border-2 transition-all shadow-sm ${y1 === y2 ? 'border-green-400 bg-green-50' : 'border-red-100 bg-white'}`}>
              <div className="text-xs text-slate-500 mb-1 font-bold">גובה (y) פונקציה 2</div>
              <div className="font-mono text-xl font-bold text-red-700" dir="ltr">{y2.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Right: Algebra & Chat (5 columns) */}
        <div className="lg:col-span-5 flex flex-col gap-4 h-full">
          
          {/* Algebra Explanation Card */}
          <div className="bg-white p-5 rounded-2xl shadow-lg border-t-4 border-purple-500 flex flex-col gap-3">
            <div className="text-sm text-slate-500 leading-relaxed mb-2">
              {currentExample.description}
            </div>

            <div className={`transition-all duration-500 transform ${isIntersection ? 'scale-105 shadow-xl' : ''}`}>
              <div className={`p-4 rounded-xl border-2 relative overflow-hidden ${isIntersection ? 'bg-green-50 border-green-400' : 'bg-slate-50 border-slate-200'}`}>
                {isIntersection && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                    נכון מאוד!
                  </div>
                )}
                
                <h4 className={`font-bold text-sm mb-3 ${isIntersection ? 'text-green-800' : 'text-slate-700'}`}>
                  {isIntersection ? 'בנקודת החיתוך המשוואות שוות:' : 'המשוואה שצריך לפתור:'}
                </h4>
                
                <div className="bg-white p-3 rounded-lg text-center shadow-inner font-mono text-lg font-bold text-slate-800 flex items-center justify-center gap-2" dir="ltr">
                  <span className="text-blue-600">{currentExample.line1Display.split('=')[1]}</span>
                  <span className="text-slate-400 font-black">=</span>
                  <span className="text-red-600">{currentExample.line2Display.split('=')[1]}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Bot for Learning */}
          <div className="flex-1 min-h-[300px]">
            <TutorChat 
              mode="learning" 
              learningExample={currentExample} 
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default LearningRoom;