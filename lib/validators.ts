import { z } from 'zod';

// ==============================================================================
// Validation Schema for Note Generation Request
// ==============================================================================
export const generateInputSchema = z.object({
  notes: z
    .string()
    .trim()
    .min(100, { message: 'Notes must be at least 100 characters long to generate high-quality study materials.' })
    .max(8000, { message: 'Notes must not exceed 8,000 characters.' }),
  title: z
    .string()
    .trim()
    .max(120, { message: 'Title must not exceed 120 characters.' })
    .optional()
    .or(z.literal('')),
  subject: z
    .string()
    .trim()
    .max(60, { message: 'Subject must not exceed 60 characters.' })
    .optional()
    .or(z.literal('')),
  numQuizQuestions: z
    .coerce
    .number()
    .int()
    .refine((val) => [5, 10].includes(val), {
      message: 'Number of quiz questions must be either 5 or 10.',
    })
    .default(5),
  numFlashcards: z
    .coerce
    .number()
    .int()
    .refine((val) => [5, 10, 15].includes(val), {
      message: 'Number of flashcards must be 5, 10, or 15.',
    })
    .default(5),
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .default('medium'),
});

export type GenerateInputValidated = z.infer<typeof generateInputSchema>;

// ==============================================================================
// Validation Schema for Gemini LLM Structured JSON Output
// ==============================================================================
export const keyTermSchema = z.object({
  term: z.string().min(1, 'Term is required'),
  definition: z.string().min(1, 'Definition is required'),
});

export const summarySchema = z.object({
  overview: z.string().min(10, 'Overview must be at least 10 characters'),
  key_points: z.array(z.string().min(1)).min(3, 'At least 3 key points are required'),
  key_terms: z.array(keyTermSchema).default([]),
});

export const quizQuestionSchema = z.object({
  question: z.string().min(3, 'Question text is required'),
  options: z
    .array(z.string().min(1))
    .length(4, 'Quiz question must have exactly 4 options'),
  correct_index: z
    .number()
    .int()
    .min(0)
    .max(3, 'correct_index must be between 0 and 3'),
  explanation: z.string().min(3, 'Explanation is required'),
});

export const flashcardSchema = z.object({
  front: z.string().min(1, 'Front side prompt is required'),
  back: z.string().min(1, 'Back side answer is required'),
});

export const studySetOutputSchema = z.object({
  summary: summarySchema,
  quiz: z.array(quizQuestionSchema).min(1, 'At least one quiz question is required'),
  flashcards: z.array(flashcardSchema).min(1, 'At least one flashcard is required'),
});

export type StudySetOutputValidated = z.infer<typeof studySetOutputSchema>;

// ==============================================================================
// Validation Schema for Quiz Attempt Score
// ==============================================================================
export const quizAttemptSchema = z.object({
  study_set_id: z.string().uuid({ message: 'Valid study_set_id UUID is required.' }),
  score: z.number().int().min(0, { message: 'Score cannot be negative.' }),
  total: z.number().int().min(1, { message: 'Total must be at least 1.' }),
}).refine((data) => data.score <= data.total, {
  message: 'Score cannot exceed total questions.',
  path: ['score'],
});

export type QuizAttemptValidated = z.infer<typeof quizAttemptSchema>;

// ==============================================================================
// Validation Schema for Flashcard Progress
// ==============================================================================
export const flashcardProgressSchema = z.object({
  study_set_id: z.string().uuid({ message: 'Valid study_set_id UUID is required.' }),
  card_index: z.number().int().min(0, { message: 'card_index must be non-negative.' }),
  status: z.enum(['known', 'review'], {
    message: 'Status must be either "known" or "review".',
  }),
});

export type FlashcardProgressValidated = z.infer<typeof flashcardProgressSchema>;
