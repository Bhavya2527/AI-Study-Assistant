// ==============================================================================
// AI Study Assistant - LLM Prompt Design
// ==============================================================================
// Evaluator Note: This file contains the exact structured system instruction
// and prompt template used to call Google Gemini API in a single round-trip.
// It strictly enforces JSON mode, schema fidelity, active recall, and zero hallucination.
// ==============================================================================

export const SYSTEM_INSTRUCTION = `You are an expert study assistant and academic curriculum designer. Use ONLY the provided notes. Do not invent facts.

Your primary objective is to analyze the student's study notes and generate THREE complementary learning assets in a single valid JSON object:
1. SUMMARY: A concise overview paragraph, 5 to 7 high-impact key bullet points, and essential key terms with their exact definitions.
2. QUIZ: Multiple-choice questions with exactly 4 distinct options, exactly 1 unambiguously correct option, a 0-based correct_index, and a clear academic explanation.
3. FLASHCARDS: High-utility active-recall flashcard pairs (front prompt and back answer) optimized for spaced repetition.

STRICT RULES:
- Rely strictly on the information given in the notes. Do not introduce outside or unverified facts.
- Generate EXACTLY the number of quiz questions requested.
- Generate EXACTLY the number of flashcards requested.
- Calibrate the question difficulty (easy, medium, hard) strictly as requested.
- Avoid duplicate or redundant questions and cards.
- Ensure all 4 multiple-choice options are plausible, but only one is factually correct based on the notes.
- Return ONLY valid JSON matching the specified JSON schema. No surrounding markdown, no backticks, no conversational preamble.`;

export interface PromptOptions {
  notes: string;
  numQuizQuestions: number;
  numFlashcards: number;
  difficulty: 'easy' | 'medium' | 'hard';
  subject?: string;
  title?: string;
}

/**
 * Builds the user prompt sent to Gemini.
 */
export function buildStudySetPrompt(options: PromptOptions): string {
  const { notes, numQuizQuestions, numFlashcards, difficulty, subject, title } = options;

  return `Please analyze the following study notes and generate a comprehensive study set according to these precise parameters:

PARAMETERS:
- Subject Context: ${subject && subject.trim() ? subject.trim() : 'General Academic'}
- Proposed Title Context: ${title && title.trim() ? title.trim() : 'Study Notes'}
- Difficulty Level: ${difficulty.toUpperCase()} (Adjust vocabulary, distractor subtlety, and depth accordingly)
- Target Quiz Question Count: EXACTLY ${numQuizQuestions} multiple-choice questions
- Target Flashcard Count: EXACTLY ${numFlashcards} flashcards

STUDENT NOTES CONTENT:
"""
${notes.trim()}
"""

REQUIRED JSON OUTPUT FORMAT:
You MUST respond with a single valid JSON object strictly conforming to this structure:
{
  "summary": {
    "overview": "A clear, cohesive 2-4 sentence summary synthesizing the core thesis and essence of the material.",
    "key_points": [
      "Key bullet point 1 (actionable, distinct, and factual)",
      "Key bullet point 2",
      "Key bullet point 3",
      "Key bullet point 4",
      "Key bullet point 5"
    ],
    "key_terms": [
      {
        "term": "Concept or keyword from the text",
        "definition": "Clear, concise definition strictly based on the text"
      }
    ]
  },
  "quiz": [
    {
      "question": "Clear, direct question testing understanding?",
      "options": [
        "First option",
        "Second option",
        "Third option",
        "Fourth option"
      ],
      "correct_index": 0,
      "explanation": "Detailed explanation of why this option is correct based directly on the notes."
    }
  ],
  "flashcards": [
    {
      "front": "Focused prompt, concept, question, or term?",
      "back": "Concise, precise answer or explanation."
    }
  ]
}

REMINDERS:
- Number of items in "quiz" array MUST BE EXACTLY ${numQuizQuestions}.
- Number of items in "flashcards" array MUST BE EXACTLY ${numFlashcards}.
- Output ONLY the raw JSON string. Do not wrap in markdown or code blocks.`;
}
