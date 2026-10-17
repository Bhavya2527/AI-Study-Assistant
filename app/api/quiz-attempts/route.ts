import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { quizAttemptSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to save quiz results.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parseResult = quizAttemptSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const { study_set_id, score, total } = parseResult.data;

    // Verify user owns the study set
    const { data: studySet, error: setCheckError } = await supabase
      .from('study_sets')
      .select('id')
      .eq('id', study_set_id)
      .eq('user_id', user.id)
      .single();

    if (setCheckError || !studySet) {
      return NextResponse.json(
        { error: 'Invalid study set or permission denied.' },
        { status: 403 }
      );
    }

    // Insert quiz attempt
    const { data: attempt, error: insertError } = await supabase
      .from('quiz_attempts')
      .insert({
        study_set_id,
        user_id: user.id, // verified server-side
        score,
        total,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert quiz attempt:', insertError);
      return NextResponse.json(
        { error: 'Failed to record quiz attempt in database.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, attempt }, { status: 201 });
  } catch (error: unknown) {
    console.error('Unhandled error in /api/quiz-attempts:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred while saving the quiz attempt.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
