import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";


// DELETE endpoint to delete a user
export async function DELETE(request: NextRequest) {
  // Create a Supabase admin client with service role to access auth API
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_ROLE_KEY!, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
    });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const curUser = searchParams.get('curUser');
  const { data: { user: adminUser } } = await supabase.auth.admin.getUserById(curUser!);

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

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  // Prevent admin from deleting themselves
  if (userId === adminUser.id) {
    return NextResponse.json({ error: 'Admins cannot delete themselves.' }, { status: 403 });
  }

  try {
    // Delete the user from auth.users which will cascade to public.users
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    const errorMessage = (error as any)?.message || 'Failed to delete user';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}