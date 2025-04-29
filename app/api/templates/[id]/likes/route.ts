import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = await props.params;
  const { id } = params;

  try {
    const like = await prisma.like.findUnique({
      where: {
        userId_templateId: {
          userId: user.id,
          templateId: id
        }
      }
    });

    return NextResponse.json({ hasLiked: !!like });
  } catch (error) {
    console.error('Error checking like status:', error);
    return NextResponse.json(
      { error: 'Failed to check like status' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = await props.params;
  const { id } = params;

  try {
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_templateId: {
          userId: user.id,
          templateId: id
        }
      }
    });

    if (existingLike) {
      // Unlike if already liked
      await prisma.like.delete({
        where: {
          userId_templateId: {
            userId: user.id,
            templateId: id
          }
        }
      });
      return NextResponse.json({ message: 'Like removed successfully' });
    } else {
      // Like if not already liked
      await prisma.like.create({
        data: {
          userId: user.id,
          templateId: id
        }
      });
      return NextResponse.json({ message: 'Like added successfully' });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}