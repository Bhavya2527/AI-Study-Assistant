import React from 'react';
import NoteForm from '@/components/NoteForm';
import { BrainCircuit } from 'lucide-react';

export const metadata = {
  title: 'Generate New Study Set | AI Study Assistant',
  description: 'Paste your study notes to generate summaries, quizzes, and flashcards with Gemini 2.0 Flash.',
};

export default function NewNotePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8 animate-in fade-in">
      {/* Page Title & Context */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold">
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>Google Gemini 2.0 Flash Integration</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Create New Study Set
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Paste your study material below. Our single-prompt architecture creates a structured
          summary, interactive quiz, and 3D flashcards in one seamless request.
        </p>
      </div>

      {/* Main Creation Form Component */}
      <NoteForm />
    </div>
  );
}
