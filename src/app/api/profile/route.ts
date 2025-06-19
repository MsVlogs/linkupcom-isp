import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { createLog } from '@/lib/logger';
import { z } from 'zod';

const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = profileUpdateSchema.parse(body);

    await connectDB();

    // Check if email already exists (exclude current user)
    if (validatedData.email !== session.user.email) {
      const existingUser = await User.findOne({ 
        email: validatedData.email, 
        _id: { $ne: session.user.id } 
      });
      if (existingUser) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      validatedData,
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Log the action
    await createLog({
      action: 'UPDATE_PROFILE',
      userId: session.user.id,
      userName: session.user.name,
      details: {
        changes: validatedData,
      },
      req: request,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
