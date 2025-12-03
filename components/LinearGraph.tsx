
import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
  Label
} from 'recharts';
import { LineEquation, Point } from '../types';

interface LinearGraphProps {
  line1: LineEquation;
  line2: LineEquation;
  showIntersection: boolean;
  intersectionPoint: Point;
  interactiveX: number | null; // Value from slider
  showOverlay?: boolean;
  enableTooltip?: boolean;
}

const LinearGraph: React.FC<LinearGraphProps> = ({ 
  line1, 
  line2, 
  showIntersection, 
  intersectionPoint,
  interactiveX,
  showOverlay = true,
  enableTooltip = true
}) => {

  const data = useMemo(() => {
    // Determine the domain. Default -10 to 10, but expand if solution is outside.
    const range = Math.max(10, Math.abs(intersectionPoint.x) + 5);
    const start = -range;
    const end = range;
    const step = 1;

    const points = [];
    for (let x = start; x <= end; x += step) {
      points.push({
        x,
        y1: line1.m * x + line1.b,
        y2: line2.m * x + line2.b,
      });
    }
    return points;
  }, [line1, line2, intersectionPoint]);

  // Calculate domain for Y axis to prevent squashing
  const yDomain = useMemo(() => {
     const allY = data.flatMap(p => [p.y1, p.y2]);
     const min = Math.min(...allY);
     const max = Math.max(...allY);
     return [Math.floor(min - 2), Math.ceil(max + 2)];
  }, [data]);

  // Calculate values for the interactive line
  const interactiveValues = useMemo(() => {
    if (interactiveX === null) return null;
    const y1 = line1.m * interactiveX + line1.b;
    const y2 = line2.m * interactiveX + line2.b;
    return { y1, y2 };
  }, [interactiveX, line1, line2]);

  return (
    <div className="w-full h-96 bg-white rounded-xl shadow-inner border border-slate-200 p-4 relative" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="x"
            type="number"
            domain={['auto', 'auto']}
            allowDataOverflow={false}
            stroke="#64748b"
            tick={{fontSize: 12}}
          />
          <YAxis
            type="number"
            domain={yDomain}
            allowDataOverflow={false}
            stroke="#64748b"
             tick={{fontSize: 12}}
          />
          
          {/* Main Axes Lines */}
          <ReferenceLine y={0} stroke="#000" strokeWidth={2} />
          <ReferenceLine x={0} stroke="#000" strokeWidth={2} />

          {/* Functions */}
          <Line
            type="monotone"
            dataKey="y1"
            stroke={line1.color}
            strokeWidth={3}
            dot={false}
            isAnimationActive={false}
            name="Equation 1"
          />
          <Line
            type="monotone"
            dataKey="y2"
            stroke={line2.color}
            strokeWidth={3}
            dot={false}
            isAnimationActive={false}
            name="Equation 2"
          />

          {/* Interactive Scanner Line */}
          {interactiveX !== null && interactiveValues && (
            <>
              <ReferenceLine x={interactiveX} stroke="#6366f1" strokeDasharray="5 5" />
              <ReferenceDot x={interactiveX} y={interactiveValues.y1} r={5} fill={line1.color} stroke="none" />
              <ReferenceDot x={interactiveX} y={interactiveValues.y2} r={5} fill={line2.color} stroke="none" />
            </>
          )}

          {/* Actual Solution Dot */}
          {showIntersection && (
            <ReferenceDot
              x={intersectionPoint.x}
              y={intersectionPoint.y}
              r={8}
              fill="#10b981"
              stroke="#fff"
              strokeWidth={3}
            />
          )}

          {enableTooltip && (
            <Tooltip
              labelFormatter={(value) => `x: ${value}`}
              formatter={(value: number) => value.toFixed(2)}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', direction: 'ltr' }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      
      {/* Floating label for diff - OPTIONAL via prop */}
      {showOverlay && interactiveX !== null && interactiveValues && (
        <div className="absolute top-2 left-2 bg-white/90 p-2 rounded shadow text-xs pointer-events-none border border-slate-200 z-10" dir="ltr">
          <div className="font-bold mb-1">X = {interactiveX.toFixed(1)}</div>
          <div style={{color: line1.color}}>y1 = {interactiveValues.y1.toFixed(1)}</div>
          <div style={{color: line2.color}}>y2 = {interactiveValues.y2.toFixed(1)}</div>
          <div className="mt-1 pt-1 border-t border-slate-200 font-bold text-slate-600">
            Diff: {Math.abs(interactiveValues.y1 - interactiveValues.y2).toFixed(1)}
          </div>
        </div>
      )}
    </div>
  );
};

export default LinearGraph;
