import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { updateTemplateSchema } from '@/lib/validations/template';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const params = await props.params;
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
        templateTags: {
          include: {
            tag: true
          }
        },
        accessGrants: true,
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

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = await props.params;
  const { id } = params;
  
  try {
    const body = await request.json();
    
    // Validate request body
    const result = updateTemplateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { title, description, isPublic, imageUrl, topicId, templateFields, templateTags, accessGrants } = result.data;

    // Check if template exists and user has permission
    const existingTemplate = await prisma.template.findUnique({
      where: { id },
      include: { templateFields: true }
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (existingTemplate.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update template and fields in a transaction
    const updatedTemplate = await prisma.$transaction(async (tx) => {
      // Delete existing fields
      await tx.templateField.deleteMany({
        where: { templateId: id }
      });

      // Update template and create new fields
      const template = await tx.template.update({
        where: { id },
        data: {
          title,
          description,
          isPublic,
          imageUrl,
          topicId,
          templateTags: {
            deleteMany: {},
            create: templateTags?.map((tagId: string) => ({
              tagId
            })) || []
          },
          accessGrants: {
            deleteMany: {},
            create: accessGrants?.map((userId: string) => ({
              userId
            })) || []
          },
          templateFields: {
            create: templateFields.map((field: any, index: number) => ({
              type: field.type,
              title: field.title,
              description: field.description,
              required: field.required ?? false,
              showInResults: field.showInResults ?? true,
              order: index
            }))
          }
        },
        include: {
          templateTags: true,
          accessGrants: true,
          templateFields: {
            orderBy: { order: 'asc' }
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

      return template;
    });
    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = await props.params;
  const { id } = params;

  try {
    // Check if template exists and user has permission
    const template = await prisma.template.findUnique({
      where: { id }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (template.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete template and related data
    await prisma.template.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}