import prisma from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET endpoint to retrieve a specific submission
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const submissionId = searchParams.get('submissionId');
  
  if (!submissionId) {
    return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
  }
  
  try {
    // Check if user is the template owner or has access
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });
    
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    
    const isOwner = submission.userId === user.id;
    
    if (!isOwner) {
      return NextResponse.json({ error: 'You do not have permission to view this submission' }, { status: 403 });
    }
    
    // Fetch submissions for the template
    const submissionData = await prisma.submission.findUnique({
      where: { id:submissionId },
      include: {
        fieldSubmissions: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      }
    });
    
    return NextResponse.json(submissionData);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}