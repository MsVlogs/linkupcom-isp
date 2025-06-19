import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { createLog } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = passwordUpdateSchema.parse(body);

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(validatedData.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, 12);

    // Update password
    await User.findByIdAndUpdate(session.user.id, {
      password: hashedNewPassword,
    });

    // Log the action
    await createLog({
      action: 'CHANGE_PASSWORD',
      userId: session.user.id,
      userName: session.user.name,
      details: {
        message: 'Password changed successfully',
      },
      req: request,
    });

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
