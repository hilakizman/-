
import { GoogleGenAI, Type } from "@google/genai";
import { MathProblem, ChatMessage, LearningExample, InvestigationProblem, Point, QuizQuestion, QuizResult, GameChallenge } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const problemSchema = {
  type: Type.OBJECT,
  properties: {
    line1_m: { type: Type.NUMBER, description: "Slope of the first line (normalized y=mx+b)" },
    line1_b: { type: Type.NUMBER, description: "Y-intercept of the first line (normalized y=mx+b)" },
    line1_display: { type: Type.STRING, description: "Display string for line 1 (e.g. '2x + 3y = 6' or 'y = 2x - 1')" },
    
    line2_m: { type: Type.NUMBER, description: "Slope of the second line (normalized)" },
    line2_b: { type: Type.NUMBER, description: "Y-intercept of the second line (normalized)" },
    line2_display: { type: Type.STRING, description: "Display string for line 2" },
    
    solution_x: { type: Type.NUMBER, description: "The X coordinate of the intersection point" },
    solution_y: { type: Type.NUMBER, description: "The Y coordinate of the intersection point" },
    
    problem_type: { type: Type.STRING, enum: ["explicit", "implicit", "word"], description: "The type of problem generated" },
    story_context: { type: Type.STRING, description: "If type is 'word', provide the story in Hebrew. Otherwise empty." }
  },
  required: ["line1_m", "line1_b", "line2_m", "line2_b", "solution_x", "solution_y", "line1_display", "line2_display", "problem_type"],
};

// Helper to format equations nicely (e.g. -1x becomes -x)
export const formatLinearEquation = (m: number, b: number): string => {
  let slopePart = '';
  if (m === 0) {
    slopePart = '';
  } else if (m === 1) {
    slopePart = 'x';
  } else if (m === -1) {
    slopePart = '-x';
  } else {
    slopePart = `${m}x`;
  }

  let interceptPart = '';
  if (b > 0) {
    interceptPart = m !== 0 ? ` + ${b}` : `${b}`;
  } else if (b < 0) {
    interceptPart = ` - ${Math.abs(b)}`;
  } else {
    // b is 0
    if (m === 0) interceptPart = '0';
  }

  return `y = ${slopePart}${interceptPart}`;
};

export const generateProblem = async (difficulty: string): Promise<MathProblem> => {
  const prompt = `Generate a linear system math problem for an advanced 8th-grade student in Israel.
  Topic: Intersection of two lines.
  Difficulty: ${difficulty}.
  
  Instructions:
  1. Randomly choose a type: 'explicit' (standard y=mx+b), 'implicit' (requires algebraic manipulation like 2y-x=4), or 'word' (real-world story problem).
  2. If 'implicit': Provide equations that need isolating y (e.g., 3y + 6x = 12).
  3. If 'word': Create a short Hebrew story (e.g., comparing two cell phone plans, filling pools, travel distances). Ensure the linear functions map to the story.
  4. Constraints: Intersection point (x,y) must be nice numbers (integers or halves). Slopes should be reasonable. Lines must not be parallel.
  5. The 'display' fields should be what the student sees initially.
  6. Formatting: If coefficient is -1, write '-x' instead of '-1x'. If 1, write 'x'.
  
  Language: Hebrew for text fields.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: problemSchema,
        temperature: 0.9, 
      },
    });

    const data = JSON.parse(response.text);

    return {
      line1: { m: data.line1_m, b: data.line1_b, color: "#2563eb", id: 1 }, // Blue
      line2: { m: data.line2_m, b: data.line2_b, color: "#dc2626", id: 2 }, // Red
      line1Display: data.line1_display,
      line2Display: data.line2_display,
      storyContext: data.story_context,
      solution: { x: data.solution_x, y: data.solution_y },
      type: data.problem_type as 'explicit' | 'implicit' | 'word',
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
    };
  } catch (error) {
    console.error("Error generating problem:", error);
    // Fallback
    return {
      line1: { m: 2, b: 1, color: "#2563eb", id: 1 },
      line2: { m: -1, b: 4, color: "#dc2626", id: 2 },
      line1Display: "y = 2x + 1",
      line2Display: "y = -x + 4",
      solution: { x: 1, y: 3 },
      type: 'explicit',
      difficulty: 'easy'
    };
  }
};

export const generateInvestigation = async (): Promise<InvestigationProblem> => {
  const prompt = `Generate two linear functions for a full investigation task with varied question phrasing in Hebrew.
  Constraints:
  1. Intersection (x,y) should be integers.
  2. The roots (x-intercepts where y=0) for BOTH lines must be integers.
  3. Slopes should be small integers (e.g. 1, 2, -1, -2, 3, -3).
  4. Lines must NOT be parallel.
  5. Provide varied phrasing for the questions to test different cognitive levels.
  6. In Hebrew questions, refer to Line 1 as "הגרף הכחול" and Line 2 as "הגרף האדום".

  Return JSON with m, b values and question strings.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      line1_m: { type: Type.NUMBER },
      line1_b: { type: Type.NUMBER },
      line2_m: { type: Type.NUMBER },
      line2_b: { type: Type.NUMBER },
      q_slope: { type: Type.STRING, description: "Varied Hebrew phrasing for finding slope of line 1 (blue)" },
      q_equation: { type: Type.STRING, description: "Varied Hebrew phrasing for finding equation of line 1 (blue)" },
      q_intersection: { type: Type.STRING, description: "Varied Hebrew phrasing for finding intersection point" },
      q_pos1: { type: Type.STRING, description: "Varied Hebrew phrasing for positivity of line 1 (blue)" },
      q_neg1: { type: Type.STRING, description: "Varied Hebrew phrasing for negativity of line 1 (blue)" },
      q_pos2: { type: Type.STRING, description: "Varied Hebrew phrasing for positivity of line 2 (red)" },
      q_neg2: { type: Type.STRING, description: "Varied Hebrew phrasing for negativity of line 2 (red)" },
    },
    required: ["line1_m", "line1_b", "line2_m", "line2_b", "q_slope", "q_equation", "q_intersection", "q_pos1", "q_neg1", "q_pos2", "q_neg2"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.9,
      },
    });
    
    const data = JSON.parse(response.text);
    
    // Calculate intersection and roots in JS to ensure precision
    const x = (data.line2_b - data.line1_b) / (data.line1_m - data.line2_m);
    const y = data.line1_m * x + data.line1_b;
    const root1 = -data.line1_b / data.line1_m;
    const root2 = -data.line2_b / data.line2_m;

    // Generate two distinct integer points for line 1 for the slope calculation task
    const p1: Point = { x: 0, y: data.line1_b };
    const p2: Point = { x: 2, y: data.line1_m * 2 + data.line1_b };

    return {
      line1: { m: data.line1_m, b: data.line1_b, color: "#2563eb", id: 1 },
      line2: { m: data.line2_m, b: data.line2_b, color: "#dc2626", id: 2 },
      line1Display: formatLinearEquation(data.line1_m, data.line1_b),
      line2Display: formatLinearEquation(data.line2_m, data.line2_b),
      intersection: { x, y },
      root1,
      root2,
      pointsLine1: [p1, p2],
      questions: {
        slope: data.q_slope,
        equation: data.q_equation,
        intersection: data.q_intersection,
        positivity1: data.q_pos1,
        negativity1: data.q_neg1,
        positivity2: data.q_pos2,
        negativity2: data.q_neg2
      }
    };

  } catch (e) {
    // Fallback
    return {
      line1: { m: 1, b: -2, color: "#2563eb", id: 1 },
      line2: { m: -1, b: 6, color: "#dc2626", id: 2 },
      line1Display: "y = x - 2",
      line2Display: "y = -x + 6",
      intersection: { x: 4, y: 2 },
      root1: 2,
      root2: 6,
      pointsLine1: [{x: 0, y: -2}, {x: 3, y: 1}],
      questions: {
        slope: "חשב את השיפוע של הגרף הכחול",
        equation: "מצא את משוואת הגרף הכחול",
        intersection: "מצא את נקודת החיתוך",
        positivity1: "מצא תחום חיוביות (גרף כחול)",
        negativity1: "מצא תחום שליליות (גרף כחול)",
        positivity2: "מצא תחום חיוביות (גרף אדום)",
        negativity2: "מצא תחום שליליות (גרף אדום)"
      }
    };
  }
};

export const generateQuiz = async (): Promise<QuizQuestion[]> => {
  const prompt = `Generate a 4-question math quiz for Grade 8 advanced students in Hebrew.
  Topic: Intersection of linear functions and full function investigation.
  
  Structure:
  1. Multiple choice: Conceptual question about slopes/parallel lines.
  2. Multiple choice: Positivity/Negativity domain understanding.
  3. Numeric: Calculate intersection X of two simple lines.
  4. Numeric: Calculate slope given two points.

  Ensure correct Hebrew mathematical terminology. Use LTR for math expressions inside text.
  Return JSON array of questions.`;

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.INTEGER },
        text: { type: Type.STRING, description: "Question text in Hebrew" },
        type: { type: Type.STRING, enum: ["multiple-choice", "numeric"] },
        options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of 4 options if multiple-choice" },
        correctAnswer: { type: Type.STRING, description: "The correct answer string or number" }
      },
      required: ["id", "text", "type", "correctAnswer"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.8,
      },
    });
    return JSON.parse(response.text);
  } catch (e) {
    // Fallback quiz
    return [
      {
        id: 1,
        text: "נתונים שני ישרים בעלי שיפוע זהה ו-b שונה. כמה נקודות חיתוך יש להם?",
        type: "multiple-choice",
        options: ["אחת", "אינסוף", "אף אחת (מקבילים)", "תלוי ב-b"],
        correctAnswer: "אף אחת (מקבילים)"
      },
      {
        id: 2,
        text: "עבור הפונקציה y = 2x - 4, מהו תחום החיוביות?",
        type: "multiple-choice",
        options: ["x > 2", "x < 2", "x > 4", "x < -4"],
        correctAnswer: "x > 2"
      }
    ];
  }
};

export const evaluateQuiz = async (
  questions: QuizQuestion[],
  userAnswers: Record<number, string>
): Promise<QuizResult> => {
  const prompt = `Evaluate this quiz for a Grade 8 student.
  Questions: ${JSON.stringify(questions)}
  Student Answers: ${JSON.stringify(userAnswers)}
  
  Task:
  1. Calculate score (0-100).
  2. Write a short, encouraging verbal feedback in Hebrew analyzing their understanding of intersection and investigation.
  3. Identify one strength.
  4. Identify one area for improvement.
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.INTEGER },
      feedback: { type: Type.STRING },
      strengthArea: { type: Type.STRING },
      weaknessArea: { type: Type.STRING }
    },
    required: ["score", "feedback", "strengthArea", "weaknessArea"]
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: schema }
  });

  return JSON.parse(response.text);
};

export const generateGameChallenge = async (): Promise<GameChallenge> => {
  const prompt = `Generate a single FUN math challenge for Grade 8 advanced students about linear functions.
  Topic: Intersection, Slopes, Equation finding.
  
  RANDOMLY choose one of these types:
  1. 'true-false': A statement about two provided lines.
  2. 'multiple-choice': A conceptual question (e.g., "Which line is steeper?", "In which quadrant do they meet?").
  3. 'open-answer': A quick calculation (e.g., "Find the slope passing through (1,2) and (3,6)", "If y=2x+b passes through (0,5), what is b?").

  Constraint: Keep it short and game-like.
  Language: Hebrew.
  Return valid JSON.
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: ["true-false", "multiple-choice", "open-answer"] },
      question: { type: Type.STRING, description: "The question or statement in Hebrew" },
      line1_m: { type: Type.NUMBER },
      line1_b: { type: Type.NUMBER },
      line2_m: { type: Type.NUMBER },
      line2_b: { type: Type.NUMBER },
      options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "4 options for multiple-choice only" },
      correctAnswer: { type: Type.STRING, description: "The answer. If boolean, use 'true'/'false' string. If number, use string representation." },
      explanation: { type: Type.STRING, description: "Short explanation in Hebrew" },
      difficulty: { type: Type.STRING, enum: ["easy", "hard"] }
    },
    required: ["type", "question", "correctAnswer", "explanation", "difficulty"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: schema }
    });
    const data = JSON.parse(response.text);
    
    // Parse answer properly
    let parsedAnswer: string | number | boolean = data.correctAnswer;
    if (data.type === 'true-false') {
        parsedAnswer = (String(data.correctAnswer).toLowerCase() === 'true');
    }

    return {
      type: data.type as 'true-false' | 'multiple-choice' | 'open-answer',
      question: data.question,
      line1: data.line1_m !== undefined ? { m: data.line1_m, b: data.line1_b, color: "#2563eb", id: 1 } : undefined,
      line2: data.line2_m !== undefined ? { m: data.line2_m, b: data.line2_b, color: "#dc2626", id: 2 } : undefined,
      options: data.options,
      correctAnswer: parsedAnswer,
      explanation: data.explanation,
      difficulty: data.difficulty as 'easy' | 'hard'
    };
  } catch (e) {
    // Fallback
    return {
      type: 'true-false',
      line1: { m: 1, b: 0, color: "#2563eb", id: 1 },
      line2: { m: 1, b: 5, color: "#dc2626", id: 2 },
      question: "הישרים נחתכים בנקודה אחת בלבד",
      correctAnswer: false,
      explanation: "השיפועים זהים (m=1) וה-b שונה, לכן הישרים מקבילים ולעולם לא ייפגשו.",
      difficulty: "easy"
    };
  }
};

export const getTutorHelp = async (
  history: ChatMessage[],
  problem: MathProblem,
  userQuery: string
): Promise<string> => {
  const systemInstruction = `You are a helpful math tutor for 8th-grade advanced students in Israel.
  Topic: Finding the intersection of two lines.
  Current Problem Type: ${problem.type}
  
  Equations (Standard Form):
  1. y = ${problem.line1.m}x + ${problem.line1.b}
  2. y = ${problem.line2.m}x + ${problem.line2.b}
  
  Equations (Display Form):
  1. ${problem.line1Display}
  2. ${problem.line2Display}
  
  Context: ${problem.storyContext || "None"}
  Solution: (${problem.solution.x}, ${problem.solution.y})

  Pedagogical Goal:
  - If the user is stuck on implicit equations, guide them to isolate y first.
  - If it's a word problem, help them extract the variables and equations.
  - Encourage the method of substitution (equating y1 = y2).
  - Use the Socratic method. Do not give the answer immediately.
  - Speak in Hebrew.
  - Keep it encouraging and short.`;

  try {
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: { systemInstruction },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage({ message: userQuery });
    return result.text;
  } catch (error) {
    console.error("Error getting tutor help:", error);
    return "מצטער, יש לי בעיה בתקשורת כרגע.";
  }
};

export const getLearningHelp = async (
  history: ChatMessage[],
  example: LearningExample,
  userQuery: string
): Promise<string> => {
  const systemInstruction = `You are a friendly and conceptual math teacher for 8th grade.
  Current Mode: Learning / Acquisition Phase.
  Topic: Understanding why the intersection point requires equating the functions (y1 = y2).
  
  Current Example displayed on screen:
  Line 1 (Blue): ${example.line1Display} (y = ${example.line1.m}x + ${example.line1.b})
  Line 2 (Red): ${example.line2Display} (y = ${example.line2.m}x + ${example.line2.b})
  Intersection X: ${example.intersectionX}
  
  Pedagogical Goals:
  1. Explain the connection between the GRAPH (lines crossing) and the ALGEBRA (equations being equal).
  2. Emphasize that only at the intersection point, the 'x' produces the SAME 'y' for both lines.
  3. If the student asks about the slider, explain that the slider represents testing different 'x' values to compare the heights of the lines.
  4. Keep answers short, encouraging, and in Hebrew.
  5. This is NOT a quiz. You are explaining concepts.`;

  try {
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: { systemInstruction },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage({ message: userQuery });
    return result.text;
  } catch (error) {
    console.error("Error getting learning help:", error);
    return "מצטער, יש לי בעיה בתקשורת כרגע.";
  }
};

export const getInvestigationHelp = async (
  history: ChatMessage[],
  problem: InvestigationProblem,
  userQuery: string
): Promise<string> => {
  const systemInstruction = `You are a strict but helpful math teacher grading a FULL investigation.
  Topic: Linear Functions Investigation.
  
  Line 1: y = ${problem.line1.m}x + ${problem.line1.b} (Blue) - Root at x=${problem.root1}
  Line 2: y = ${problem.line2.m}x + ${problem.line2.b} (Red) - Root at x=${problem.root2}
  Intersection: (${problem.intersection.x}, ${problem.intersection.y})
  
  Goals:
  1. Finding Slope (m).
  2. Finding Equation (y=mx+b).
  3. Intersection Point.
  4. Positivity (y > 0).
  5. Negativity (y < 0).
  
  Refer to line 1 as "הגרף הכחול" and line 2 as "הגרף האדום".
  Help the student based on the stage they are currently in.
  Speak in Hebrew. Short answers.`;

  try {
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: { systemInstruction },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage({ message: userQuery });
    return result.text;
  } catch (error) {
    console.error("Error getting investigation help:", error);
    return "מצטער, יש לי בעיה בתקשורת כרגע.";
  }
};
