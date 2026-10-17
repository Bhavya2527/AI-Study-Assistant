import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateInputSchema } from '@/lib/validators';
import { generateStudySetFromGemini } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user server-side
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to generate study materials.' },
        { status: 401 }
      );
    }

    // 2. Validate request payload with Zod
    const body = await request.json();
    const parseResult = generateInputSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues
        .map((issue) => issue.message)
        .join(', ');
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const { notes, title, subject, numQuizQuestions, numFlashcards, difficulty } =
      parseResult.data;

    // 3. Simple Rate Limiting: Max 10 generations per user per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('study_sets')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo);

    if (countError) {
      console.warn('Failed to verify rate limit count:', countError);
    } else if (count !== null && count >= 10) {
      return NextResponse.json(
        {
          error:
            'Hourly generation limit reached (10 sets/hour). Please review your existing sets and try again later.',
        },
        { status: 429 }
      );
    }

    // 4. Determine final title
    let resolvedTitle = title && title.trim().length > 0 ? title.trim() : '';
    if (!resolvedTitle) {
      // Auto-extract first meaningful line or fallback
      const firstLine = notes.split('\n')[0].replace(/^[#*-\s]+/, '').trim();
      resolvedTitle = firstLine.length > 0 ? firstLine.slice(0, 50) : 'Untitled Study Set';
    }

    const resolvedSubject = subject && subject.trim().length > 0 ? subject.trim() : 'General';

    // 5. Call Google Gemini API (model: gemini-2.0-flash) server-side
    const generatedContent = await generateStudySetFromGemini({
      notes,
      numQuizQuestions,
      numFlashcards,
      difficulty,
      subject: resolvedSubject,
      title: resolvedTitle,
    });

    // 6. Persist to Supabase Postgres (study_sets table) with user_id from session
    const { data: insertedSet, error: insertError } = await supabase
      .from('study_sets')
      .insert({
        user_id: user.id, // NEVER trust client input; always use verified session user.id
        title: resolvedTitle,
        subject: resolvedSubject,
        original_notes: notes,
        summary: generatedContent.summary,
        quiz: generatedContent.quiz,
        flashcards: generatedContent.flashcards,
        difficulty,
      })
      .select('id')
      .single();

    if (insertError || !insertedSet) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save generated study set to database. Please try again.' },
        { status: 500 }
      );
    }

    // 7. Return newly created study set ID
    return NextResponse.json(
      {
        success: true,
        id: insertedSet.id,
        message: 'Study materials successfully generated and saved!',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Unhandled error in /api/generate:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred while generating study materials. Please try again.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
