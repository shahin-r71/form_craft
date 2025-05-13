import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

const searchSchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters long'),
});

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  const validation = searchSchema.safeParse({ q: query });

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid search query', details: validation.error.format() }, { status: 400 });
  }

  const searchQuery = validation.data.q;
  // Process the search query for textSearch (e.g., replace spaces with '&' for 'AND' logic)
  const processedQuery = searchQuery.trim().split(/\s+/).join(' & ');

  try {
    
    const { data, error } = await supabase
      .from('templates')
      .select(`
        id, title, description, image_url, created_at, owner_id, topic_id,
        owner:users!templates_owner_id_fkey ( id, name, avatar_url ),
        topic:topics ( id, name ),
        likes ( count ),
        submissions ( count )
      `)
      .textSearch('fts', processedQuery, { type: 'plain' });

    if (error) {
      console.error('Supabase search error:', error);
      return NextResponse.json({ error: 'Failed to search templates', details: error.message }, { status: 500 });
    }

    const results = data ? data.map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      imageUrl: item.image_url,
      owner: {
        id: item.owner?.id,
        name: item.owner?.name,
        avatarUrl: item.owner?.avatar_url,
      },
      topic: item.topic ? {
        id: item.topic.id,
        name: item.topic.name,
      } : null,
      stats: {
        likes: item.likes?.[0]?.count || 0, // Supabase returns count as an array of objects
        submissions: item.submissions?.[0]?.count || 0,
      },
      createdAt: item.created_at,
    })) : [];

    return NextResponse.json({ results });

  } catch (error: any) {
    console.error('API search error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}