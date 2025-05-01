import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const supabase = await createClient();
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Use Prisma to fetch submissions with their templates in a single query
    const submissions = await prisma.submission.findMany({
      where: {
        userId: user.id
      },
      select: {
        id: true,
        createdAt: true,
        templateId: true,
        template: {
          select: {
            id: true,
            title: true,
            description: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the response to match the expected structure in the frontend
    const formattedSubmissions = submissions.map(submission => ({
      id: submission.id,
      templateId: submission.templateId,
      createdAt: submission.createdAt.toISOString(),
      template: {
        id: submission.template.id,
        title: submission.template.title,
        description: submission.template.description
      }
    }));

    return NextResponse.json(formattedSubmissions);
  } catch (error) {
    console.error('Unexpected error in submissions/user route:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}