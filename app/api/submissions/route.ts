import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import {submissionSchema} from '@/lib/validations/submission';
// Validation schema for field submissions


export async function POST(request: Request) {
  // Authenticate user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = submissionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const { templateId, fieldSubmissions } = validationResult.data;
    
    // Verify the template exists
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        templateFields: true,
      },
    });
    
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    // Verify user has access to the template if it's not public
    if (!template.isPublic) {
      const hasAccess = await prisma.templateAccess.findUnique({
        where: {
          templateId_userId: {
            templateId,
            userId: user.id,
          },
        },
      });
      
      const isOwner = template.ownerId === user.id;
      
      if (!isOwner && !hasAccess) {
        return NextResponse.json({ error: 'You do not have access to this template' }, { status: 403 });
      }
    }
    
    // Verify all field submissions correspond to valid template fields
    const templateFieldIds = template.templateFields.map(field => field.id);
    const invalidFields = fieldSubmissions.filter(
      submission => !templateFieldIds.includes(submission.templateFieldId)
    );
    
    if (invalidFields.length > 0) {
      return NextResponse.json(
        { error: 'One or more field submissions reference invalid template fields' },
        { status: 400 }
      );
    }
    
    // Create the submission and field submissions in a transaction
    const submission = await prisma.$transaction(async (tx) => {
      // Create the main submission record
      const newSubmission = await tx.submission.create({
        data: {
          templateId,
          userId: user.id,
        },
      });
      
      // Create all field submissions
      await Promise.all(
        fieldSubmissions.map(fieldSubmission =>
          tx.fieldSubmission.create({
            data: {
              submissionId: newSubmission.id,
              templateFieldId: fieldSubmission.templateFieldId,
              valueString: fieldSubmission.valueString,
              valueInteger: fieldSubmission.valueInteger,
              valueBoolean: fieldSubmission.valueBoolean,
            },
          })
        )
      );
      
      return newSubmission;
    });
    
    return NextResponse.json({
      id: submission.id,
      message: 'Submission created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve submissions for a template
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get('templateId');
  
  if (!templateId) {
    return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
  }
  
  try {
    // Check if user is the template owner or has access
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });
    
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    const isOwner = template.ownerId === user.id;
    
    if (!isOwner) {
      return NextResponse.json({ error: 'You do not have permission to view these submissions' }, { status: 403 });
    }
    
    // Fetch submissions for the template
    const submissions = await prisma.submission.findMany({
      where: { templateId },
      include: {
        fieldSubmissions: {
          include: {
            field: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}