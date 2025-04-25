import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const {id} = params;
    const template = await prisma.template.findUnique({
      where: {
        id:  id
      },
      include: {
        templateFields: {
          orderBy: {
            order: 'asc'
          }
        },
        topic: true,
        owner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            submissions: true
          }
        }
      }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}