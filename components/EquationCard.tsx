import React from 'react';
import { LineEquation } from '../types';

interface EquationCardProps {
  line: LineEquation;
  displayEq: string;
  label: string;
}

const EquationCard: React.FC<EquationCardProps> = ({ line, displayEq, label }) => {
  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border-r-4 shadow-sm bg-white mb-3 transition-transform hover:scale-102`} style={{ borderRightColor: line.color, borderLeft: 'none' }}>
      <span className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-4">{label}</span>
      <span className="text-xl md:text-2xl font-mono font-bold text-slate-800 text-left w-full" dir="ltr">
        {displayEq}
      </span>
    </div>
  );
};

export default EquationCard;