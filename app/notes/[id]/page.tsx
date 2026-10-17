'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StudySet, QuizAttempt, FlashcardProgress } from '@/lib/types';
import SummaryView from '@/components/SummaryView';
import QuizView from '@/components/QuizView';
import FlashcardView from '@/components/FlashcardView';
import {
  ArrowLeft,
  BookOpen,
  HelpCircle,
  Layers,
  Trash2,
  RotateCcw,
  Calendar,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/components/Toast';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StudySetDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'summary' | 'quiz' | 'flashcards'>('summary');
  const [studySet, setStudySet] = useState<StudySet | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [flashcardProgress, setFlashcardProgress] = useState<FlashcardProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Regenerate state
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    async function loadSet() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/study-sets/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Study set not found or you do not have permission to view it.');
          }
          throw new Error('Failed to load study set from database.');
        }

        const data = await res.json();
        setStudySet(data.study_set);
        setQuizAttempts(data.quiz_attempts || []);
        setFlashcardProgress(data.flashcard_progress || []);
      } catch (err: unknown) {
        console.error('Error loading study set:', err);
        setError(err instanceof Error ? err.message : 'Failed to load study set.');
      } finally {
        setLoading(false);
      }
    }

    loadSet();
  }, [id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/study-sets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete study set.');
      success('Study set deleted', 'Redirecting to your dashboard...');
      router.push('/dashboard');
    } catch (err: unknown) {
      toastError('Delete failed', err instanceof Error ? err.message : 'Failed to delete');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleRegenerate = async () => {
    if (!studySet) return;
    setIsRegenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: studySet.original_notes,
          title: `${studySet.title} (Regenerated)`,
          subject: studySet.subject || undefined,
          numQuizQuestions: studySet.quiz.length === 10 ? 10 : 5,
          numFlashcards: studySet.flashcards.length >= 10 ? 10 : 5,
          difficulty: studySet.difficulty || 'medium',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to regenerate study set.');

      success('New study set generated!', 'Redirecting to regenerated version...');
      router.push(`/notes/${data.id}`);
    } catch (err: unknown) {
      toastError(
        'Regeneration failed',
        err instanceof Error ? err.message : 'Failed to regenerate'
      );
      setIsRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-32 space-y-3">
        <Loader2 className="w-9 h-9 animate-spin text-indigo-500" />
        <p className="text-xs text-slate-400">Loading your study set...</p>
      </div>
    );
  }

  if (error || !studySet) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Study Set Not Available</h2>
        <p className="text-xs text-slate-400">{error || 'This study set could not be found.'}</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vault
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(studySet.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 animate-in fade-in">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Vault</span>
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 rounded-lg transition-all"
            title="Generate a fresh variation with Gemini"
          >
            {isRegenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            <span>{isRegenerating ? 'Generating...' : 'Regenerate'}</span>
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 rounded-lg transition-all"
            title="Delete this study set permanently"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Title & Metadata Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5 flex-wrap text-xs">
          <span className="px-3 py-1 rounded-md font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
            {studySet.subject || 'General'}
          </span>
          <span
            className={`capitalize px-2.5 py-0.5 rounded-full font-semibold ${
              studySet.difficulty === 'easy'
                ? 'bg-emerald-500/15 text-emerald-300'
                : studySet.difficulty === 'hard'
                ? 'bg-rose-500/15 text-rose-300'
                : 'bg-indigo-500/15 text-indigo-300'
            }`}
          >
            {studySet.difficulty} difficulty
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            {formattedDate}
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          {studySet.title}
        </h1>
      </div>

      {/* 3 Interactive Mode Tabs */}
      <div className="flex items-center border-b border-slate-800 space-x-1 sm:space-x-3 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'summary'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 rounded-t-xl'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Executive Summary</span>
        </button>

        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex items-center gap-2 py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'quiz'
              ? 'border-purple-500 text-purple-400 bg-purple-500/10 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 rounded-t-xl'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Interactive Quiz ({studySet.quiz?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('flashcards')}
          className={`flex items-center gap-2 py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'flashcards'
              ? 'border-pink-500 text-pink-400 bg-pink-500/10 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 rounded-t-xl'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>3D Flashcards ({studySet.flashcards?.length || 0})</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === 'summary' && (
          <SummaryView
            summary={studySet.summary}
            title={studySet.title}
            subject={studySet.subject || undefined}
            originalNotes={studySet.original_notes}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizView
            studySetId={studySet.id}
            questions={studySet.quiz || []}
            initialAttempts={quizAttempts}
          />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardView
            studySetId={studySet.id}
            flashcards={studySet.flashcards || []}
            initialProgress={flashcardProgress}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-white">Delete This Study Set?</h4>
              <p className="text-xs text-slate-400">
                Are you sure you want to permanently delete &quot;{studySet.title}&quot;? All
                generated content, quiz history, and card mastery will be lost.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-750 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 flex items-center justify-center gap-1.5 transition-colors"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
