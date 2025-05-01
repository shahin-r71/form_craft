import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';

export async function GET() {
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

    // Use Prisma to fetch user profile data
    const userProfile = await prisma.user.findUnique({
      where: {
        id: user.id
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        isAdmin: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Format dates to ISO string for JSON serialization
    const userData = {
      ...userProfile,
      createdAt: userProfile.createdAt.toISOString(),
      updatedAt: userProfile.updatedAt.toISOString()
    };

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}