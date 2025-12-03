
export interface LineEquation {
  m: number;
  b: number;
  color: string;
  id: number;
}

export interface Point {
  x: number;
  y: number;
}

export type ProblemType = 'explicit' | 'implicit' | 'word';
export type AppMode = 'lobby' | 'learn' | 'practice' | 'investigation' | 'games' | 'quiz';

export interface MathProblem {
  line1: LineEquation;
  line2: LineEquation;
  
  // Text representations for the UI (e.g., "3y - 6x = 12")
  line1Display: string;
  line2Display: string;
  
  storyContext?: string; // For word problems
  
  solution: Point;
  type: ProblemType;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface LearningExample {
  id: number;
  title: string;
  line1: LineEquation;
  line2: LineEquation;
  line1Display: string;
  line2Display: string;
  intersectionX: number;
  description: string; // Pedagogical explanation
}

export interface InvestigationProblem {
  line1: LineEquation;
  line2: LineEquation;
  line1Display: string;
  line2Display: string;
  intersection: Point;
  // Roots (where y=0)
  root1: number;
  root2: number;
  // Specific points for calculating slope of line 1
  pointsLine1: [Point, Point]; 
  
  // Dynamic question phrasing
  questions: {
    slope: string;
    equation: string;
    intersection: string;
    positivity1: string;
    negativity1: string;
    positivity2: string;
    negativity2: string;
  }
}

export interface QuizQuestion {
  id: number;
  text: string;
  type: 'multiple-choice' | 'numeric';
  options?: string[]; // For multiple choice
  correctAnswer: string | number;
  line1?: LineEquation; // Optional context
  line2?: LineEquation; // Optional context
}

export interface QuizResult {
  score: number;
  feedback: string;
  strengthArea: string;
  weaknessArea: string;
}

export type GameChallengeType = 'true-false' | 'multiple-choice' | 'open-answer';

export interface GameChallenge {
  type: GameChallengeType;
  question: string; // The question text
  
  // Context lines (optional, depending on question)
  line1?: LineEquation; 
  line2?: LineEquation;
  
  // For Multiple Choice
  options?: string[];
  
  // The answer
  correctAnswer: string | number | boolean;
  
  explanation: string;
  difficulty: 'easy' | 'hard';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export enum GameState {
  LOADING,
  PLAYING,
  SOLVED,
  ERROR,
  FINISHED // Used for Quiz/Game completion
}
