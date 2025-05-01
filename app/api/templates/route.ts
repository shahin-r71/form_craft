import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createTemplateSchema, updateTemplateSchema } from '@/lib/validations/template';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body against Zod schema
    const result = createTemplateSchema.safeParse(body);
    if (!result.success) {
      console.error('Validation error:', result.error);
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { title, description, isPublic, imageUrl, topicId, templateFields, templateTags, accessGrants } = result.data;

    // Create template with fields, tags, and access grants in a transaction
    const template = await prisma.$transaction(async (tx) => {
      // Create the template
      const template = await tx.template.create({
        data: {
          title,
          description,
          isPublic: isPublic ?? true,
          ownerId: user.id,
          topicId,
          imageUrl,
          templateFields: {
            create: templateFields.map((field: any, index: number) => ({
              type: field.type,
              title: field.title,
              description: field.description,
              required: field.required ?? false,
              showInResults: field.showInResults ?? true,
              order: index
            }))
          },
          templateTags: templateTags ? {
            create: templateTags.map((tagId: string) => ({
              tagId
            }))
          } : undefined,
          accessGrants: !isPublic && accessGrants ? {
            create: accessGrants.map((userId: string) => ({
              userId
            }))
          } : undefined
        },
        include: {
          templateFields: true,
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
          }
        }
      });

      return template;
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');
    const userId = searchParams.get('userId');
    const isPublic = searchParams.get('isPublic');
    const ownerId = searchParams.get('ownerId');

    const templates = await prisma.template.findMany({
      where: {
        ...(topicId && { topicId }),
        ...(ownerId && { ownerId: ownerId }),
        ...(isPublic !== null && { isPublic: isPublic === 'true' })
      },
      include: {
        templateFields: true,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

   