import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { flashcardProgressSchema } from '@/lib/validators';

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
        { error: 'Unauthorized: Please log in to save flashcard progress.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parseResult = flashcardProgressSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const { study_set_id, card_index, status } = parseResult.data;

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

    // Upsert flashcard progress on unique constraint (user_id, study_set_id, card_index)
    const { data: progress, error: upsertError } = await supabase
      .from('flashcard_progress')
      .upsert(
        {
          study_set_id,
          user_id: user.id,
          card_index,
          status,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,study_set_id,card_index',
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('Failed to upsert flashcard progress:', upsertError);
      return NextResponse.json(
        { error: 'Failed to record flashcard progress in database.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, progress });
  } catch (error: unknown) {
    console.error('Unhandled error in /api/flashcard-progress:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred while saving flashcard progress.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
