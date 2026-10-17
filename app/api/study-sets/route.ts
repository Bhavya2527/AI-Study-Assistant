import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to view your study sets.' },
        { status: 401 }
      );
    }

    // Fetch user's study sets ordered by creation time
    const { data: studySets, error: fetchError } = await supabase
      .from('study_sets')
      .select('id, title, subject, difficulty, created_at, quiz, flashcards')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Failed to fetch study sets:', fetchError);
      return NextResponse.json(
        { error: 'Failed to retrieve study sets from database.' },
        { status: 500 }
      );
    }

    // Fetch quiz attempts to calculate best score for each study set
    const { data: attempts, error: attemptsError } = await supabase
      .from('quiz_attempts')
      .select('study_set_id, score, total')
      .eq('user_id', user.id);

    if (attemptsError) {
      console.warn('Failed to fetch quiz attempts for stats calculation:', attemptsError);
    }

    // Map best scores by study_set_id
    const bestScoreMap = new Map<string, { score: number; total: number; percentage: number }>();
    if (attempts) {
      for (const attempt of attempts) {
        const percentage = Math.round((attempt.score / attempt.total) * 100);
        const existing = bestScoreMap.get(attempt.study_set_id);
        if (!existing || percentage > existing.percentage) {
          bestScoreMap.set(attempt.study_set_id, {
            score: attempt.score,
            total: attempt.total,
            percentage,
          });
        }
      }
    }

    // Transform and enrich with metrics
    const enrichedSets = (studySets || []).map((set) => {
      const quizQuestions = Array.isArray(set.quiz) ? set.quiz : [];
      const flashcardsList = Array.isArray(set.flashcards) ? set.flashcards : [];
      const best = bestScoreMap.get(set.id) || null;

      return {
        id: set.id,
        title: set.title,
        subject: set.subject || 'General',
        difficulty: set.difficulty || 'medium',
        created_at: set.created_at,
        total_questions: quizQuestions.length,
        total_flashcards: flashcardsList.length,
        best_score: best ? best.percentage : null,
        best_attempt: best,
      };
    });

    return NextResponse.json({ study_sets: enrichedSets });
  } catch (error: unknown) {
    console.error('Unhandled error in /api/study-sets:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred while retrieving study sets.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
