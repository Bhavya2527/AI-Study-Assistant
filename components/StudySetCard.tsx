'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Layers,
  HelpCircle,
  Trophy,
  Trash2,
  ChevronRight,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useToast } from './Toast';

export interface StudySetSummary {
  id: string;
  title: string;
  subject: string;
  difficulty: string;
  created_at: string;
  total_questions: number;
  total_flashcards: number;
  best_score: number | null;
  best_attempt?: { score: number; total: number; percentage: number } | null;
}

interface StudySetCardProps {
  studySet: StudySetSummary;
  onDeleted: (id: string) => void;
}

export default function StudySetCard({ studySet, onDeleted }: StudySetCardProps) {
  const { success, error: toastError } = useToast();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formattedDate = new Date(studySet.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/study-sets/${studySet.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete study set from database.');
      }

      success('Study set deleted', `"${studySet.title}" was removed.`);
      onDeleted(studySet.id);
    } catch (err: unknown) {
      toastError(
        'Delete failed',
        err instanceof Error ? err.message : 'Failed to delete'
      );
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-5 sm:p-6 flex flex-col justify-between relative group">
      {/* Top Meta: Subject & Difficulty */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
            {studySet.subject || 'General'}
          </span>

          <span
            className={`capitalize text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              studySet.difficulty === 'easy'
                ? 'bg-emerald-500/15 text-emerald-300'
                : studySet.difficulty === 'hard'
                ? 'bg-rose-500/15 text-rose-300'
                : 'bg-indigo-500/15 text-indigo-300'
            }`}
          >
            {studySet.difficulty}
          </span>
        </div>

        {/* Title */}
        <Link href={`/notes/${studySet.id}`} className="block group-hover:text-indigo-300 transition-colors">
          <h3 className="font-bold text-base sm:text-lg text-white line-clamp-2 leading-snug">
            {studySet.title}
          </h3>
        </Link>

        {/* Date */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Metrics & Best Score */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-400" title="Quiz questions">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              {studySet.total_questions} Qs
            </span>
            <span className="flex items-center gap-1 text-slate-400" title="Flashcards">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              {studySet.total_flashcards} Cards
            </span>
          </div>

          {/* Best Score Pill */}
          {studySet.best_attempt ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <Trophy className="w-3 h-3" />
              Best: {studySet.best_attempt.percentage}% ({studySet.best_attempt.score}/{studySet.best_attempt.total})
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">Quiz unattempted</span>
          )}
        </div>

        {/* Card Actions */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <Link
            href={`/notes/${studySet.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-indigo-600/80 border border-slate-700/80 hover:border-indigo-500/50 rounded-xl transition-all"
          >
            <span>Open Study Set</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={() => setShowConfirmDelete(true)}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 rounded-xl transition-all"
            title="Delete study set"
            aria-label="Delete study set"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-white">Delete Study Set?</h4>
              <p className="text-xs text-slate-400">
                Are you sure you want to permanently delete &quot;{studySet.title}&quot;? All quiz
                attempts and flashcard progress will be removed.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowConfirmDelete(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-750 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-rose-600/20"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
