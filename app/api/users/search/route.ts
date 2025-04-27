import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import  prisma  from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Create Supabase client for auth check
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query users with search and pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
        skip: offset,
        take: limit,
        orderBy: {
          email: 'asc',
        },
      }),
      prisma.user.count({
        where: {
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
          ],
          isActive: true,
        },
      }),
    ]);

    // Calculate if there are more results
    const hasMore = total > offset + users.length;

    return NextResponse.json({
      users,
      hasMore,
      total,
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}