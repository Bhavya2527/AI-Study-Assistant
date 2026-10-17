// ==============================================================================
// AI Study Assistant - TypeScript Type Definitions
// ==============================================================================

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface KeyTerm {
  term: string;
  definition: string;
}

export interface SummaryData {
  overview: string;
  key_points: string[];
  key_terms: KeyTerm[];
}

export interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  correct_index: number; // 0, 1, 2, or 3
  explanation: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface StudySetGeneratedContent {
  summary: SummaryData;
  quiz: QuizQuestion[];
  flashcards: Flashcard[];
}

export interface StudySet {
  id: string;
  user_id: string;
  title: string;
  subject: string | null;
  original_notes: string;
  summary: SummaryData;
  quiz: QuizQuestion[];
  flashcards: Flashcard[];
  difficulty: DifficultyLevel;
  created_at: string;
  // Joined or calculated stats
  best_score?: number | null;
  total_questions?: number;
  total_flashcards?: number;
}

export interface QuizAttempt {
  id: string;
  study_set_id: string;
  user_id: string;
  score: number;
  total: number;
  created_at: string;
}

export type FlashcardStatus = 'known' | 'review';

export interface FlashcardProgress {
  id?: string;
  study_set_id: string;
  user_id?: string;
  card_index: number;
  status: FlashcardStatus;
  updated_at?: string;
}

export interface GenerateInput {
  notes: string;
  title?: string;
  subject?: string;
  numQuizQuestions?: 5 | 10;
  numFlashcards?: 5 | 10 | 15;
  difficulty?: DifficultyLevel;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  created_at: string;
}
