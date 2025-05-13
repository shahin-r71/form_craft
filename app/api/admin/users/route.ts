import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';


// GET endpoint to retrieve users with counts and pagination
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();

  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if the user is an admin
  const adminProfile = await prisma.user.findUnique({
    where: { id: adminUser.id },
    select: { isAdmin: true },
  });

  if (!adminProfile?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: User is not an admin' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const searchQuery = searchParams.get('q') || '';
  const offset = (page - 1) * limit;

  try {
    const whereClause: any = {
      OR: [
        { email: { contains: searchQuery, mode: 'insensitive' } },
        { name: { contains: searchQuery, mode: 'insensitive' } },
      ],
    };

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        isAdmin: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            templates: true, // templates owned by the user
            submissions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: limit,
    });

    const totalUsers = await prisma.user.count({
      where: whereClause,
    });

    return NextResponse.json({
      users,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// PUT endpoint to update user status (isAdmin, isActive)
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();

  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminProfile = await prisma.user.findUnique({
    where: { id: adminUser.id },
    select: { isAdmin: true },
  });

  if (!adminProfile?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: User is not an admin' }, { status: 403 });
  }

  try {
    const { userId, isAdmin, isActive } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (typeof isAdmin !== 'boolean' && typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'At least one status (isAdmin or isActive) must be provided and be a boolean' }, { status: 400 });
    }
    
    // Prevent admin from de-admining or deactivating themselves
    if (userId === adminUser.id && (isAdmin === false || isActive === false)) {
        return NextResponse.json({ error: 'Admins cannot change their own admin status or active status.' }, { status: 403 });
    }

    const updateData: { isAdmin?: boolean; isActive?: boolean } = {};
    if (typeof isAdmin === 'boolean') {
      updateData.isAdmin = isAdmin;
    }
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        isAdmin: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            templates: true,
            submissions: true,
          },
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    // Check for specific Prisma errors, e.g., P2025 (Record to update not found)
    if ((error as any).code === 'P2025') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

