import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  // Check for cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const now = new Date().toISOString();

    // Select unpublished posts that should be published by now
    const { data: posts, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('id')
      .eq('published', false)
      .lte('scheduled_at', now);

    if (fetchError) throw fetchError;

    if (!posts || posts.length === 0) {
      return NextResponse.json({ success: true, published: 0 });
    }

    const ids = posts.map(p => p.id);

    // Mark them as published
    const { error: updateError } = await supabaseAdmin
      .from('posts')
      .update({ published: true })
      .in('id', ids);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, published: ids.length });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
