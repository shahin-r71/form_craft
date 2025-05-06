import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';
import { userProfileUpdateSchema } from '@/lib/validations/user';

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    // Get current user from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = userProfileUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, avatarUrl } = validationResult.data;

    // Check if user exists in database
    const existingUser = await prisma.user.findUnique({
      where: {
        id: user.id
      }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create update data object with only provided fields
    const updateData: { name?: string | null; avatarUrl?: string | null } = {};
    if (name !== undefined) updateData.name = name;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    // Update user metadata in Supabase Auth - only update fields that were provided
    const authUpdateData: { name?: string; avatar_url?: string } = {};
    if (name !== undefined) authUpdateData.name = name || "";
    if (avatarUrl !== undefined) authUpdateData.avatar_url = avatarUrl || "";

    if (Object.keys(authUpdateData).length > 0) {
      const { error: updateAuthError } = await supabase.auth.updateUser({
        data: authUpdateData
      });

      if (updateAuthError) {
        console.error('Error updating user in Supabase Auth:', updateAuthError);
        return NextResponse.json(
          { error: 'Failed to update user profile' },
          { status: 500 }
        );
      }
    }

    // Update user in database - only update fields that were provided
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id
      },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        updatedAt: true
      }
    });

    // Format dates to ISO string for JSON serialization
    const userData = {
      ...updatedUser,
      updatedAt: updatedUser.updatedAt.toISOString()
    };

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}


