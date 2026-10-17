'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import StudySetCard, { StudySetSummary } from '@/components/StudySetCard';
import {
  PlusCircle,
  Search,
  Filter,
  BookOpen,
  HelpCircle,
  Layers,
  Sparkles,
  Loader2,
  FolderOpen,
} from 'lucide-react';

export default function DashboardPage() {
  const [studySets, setStudySets] = useState<StudySetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');

  useEffect(() => {
    let isMounted = true;

    async function fetchStudySets() {
      try {
        const res = await fetch('/api/study-sets');
        if (!res.ok) {
          throw new Error('Failed to retrieve your study sets.');
        }
        const data = await res.json();
        if (isMounted) {
          setStudySets(data.study_sets || []);
          setLoading(false);
        }
      } catch (err: unknown) {
        console.error('Error fetching dashboard sets:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load study sets.');
          setLoading(false);
        }
      }
    }

    fetchStudySets();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDeleted = (id: string) => {
    setStudySets((prev) => prev.filter((s) => s.id !== id));
  };

  // Distinct subjects for filter dropdown
  const uniqueSubjects = Array.from(
    new Set(studySets.map((s) => s.subject).filter(Boolean))
  );

  // Filtered study sets
  const filteredSets = studySets.filter((set) => {
    const matchesSearch =
      set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      set.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || set.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  // Aggregate stats
  const totalSets = studySets.length;
  const totalQuestions = studySets.reduce((acc, curr) => acc + curr.total_questions, 0);
  const totalFlashcards = studySets.reduce((acc, curr) => acc + curr.total_flashcards, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8 animate-in fade-in">
      {/* Header with Title and "Create New" Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-indigo-400" />
            My Study Vault
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Access, review, and test yourself on your AI-generated summaries, quizzes, and cards.
          </p>
        </div>

        <Link
          href="/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/25 transition-all hover:scale-102 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Study Set</span>
        </Link>
      </div>

      {/* Aggregate Metrics Bar */}
      {!loading && totalSets > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase">Active Sets</p>
              <p className="text-xl font-bold text-white mt-0.5">{totalSets}</p>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase">Quiz Questions</p>
              <p className="text-xl font-bold text-white mt-0.5">{totalQuestions}</p>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-pink-500/15 text-pink-400 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase">Total Flashcards</p>
              <p className="text-xl font-bold text-white mt-0.5">{totalFlashcards}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      {!loading && totalSets > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or subject..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Subject Filter Dropdown */}
          {uniqueSubjects.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:inline" />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All">All Subjects ({totalSets})</option>
                {uniqueSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-xs text-slate-400">Loading your study vault from Supabase...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-center space-y-2">
          <p className="font-bold text-sm">Failed to load study sets</p>
          <p className="text-xs text-rose-300">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              fetch('/api/study-sets')
                .then((r) => r.json())
                .then((d) => {
                  setStudySets(d.study_sets || []);
                  setLoading(false);
                })
                .catch((e) => {
                  setError(e.message);
                  setLoading(false);
                });
            }}
            className="px-4 py-2 mt-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State when no sets exist at all */}
      {!loading && !error && totalSets === 0 && (
        <div className="glass-panel rounded-3xl p-12 text-center max-w-lg mx-auto space-y-5 my-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">
            <FolderOpen className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-bold text-white">No Study Sets Yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              You haven&apos;t generated any study sets yet. Paste your lecture notes or choose a sample
              to generate your first summary, quiz, and flashcards!
            </p>
          </div>

          <Link
            href="/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create Your First Study Set</span>
          </Link>
        </div>
      )}

      {/* Filtered Empty State */}
      {!loading && !error && totalSets > 0 && filteredSets.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <p className="text-slate-400 text-sm">
            No study sets matched your search query &quot;{searchQuery}&quot;.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedSubject('All');
            }}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Grid of Study Set Cards */}
      {!loading && filteredSets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSets.map((set) => (
            <StudySetCard key={set.id} studySet={set} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}
