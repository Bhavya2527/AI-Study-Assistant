import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to view this study set.' },
        { status: 401 }
      );
    }

    // 1. Fetch study set verifying ownership via user_id
    const { data: studySet, error: fetchError } = await supabase
      .from('study_sets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !studySet) {
      return NextResponse.json(
        { error: 'Study set not found or you do not have permission to view it.' },
        { status: 404 }
      );
    }

    // 2. Fetch past quiz attempts
    const { data: quizAttempts } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('study_set_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // 3. Fetch flashcard progress
    const { data: flashcardProgress } = await supabase
      .from('flashcard_progress')
      .select('*')
      .eq('study_set_id', id)
      .eq('user_id', user.id);

    return NextResponse.json({
      study_set: studySet,
      quiz_attempts: quizAttempts || [],
      flashcard_progress: flashcardProgress || [],
    });
  } catch (error: unknown) {
    console.error('Error fetching study set by ID:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred while fetching the study set.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to delete this study set.' },
        { status: 401 }
      );
    }

    // Delete record ensuring it belongs to current user
    const { error: deleteError } = await supabase
      .from('study_sets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Failed to delete study set:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete study set from database.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Study set deleted successfully.',
    });
  } catch (error: unknown) {
    console.error('Error deleting study set:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred while deleting the study set.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
