import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { createLog } from '@/lib/logger';

const updateStaffSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'staff']).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const staff = await User.findById(id).select('-password').lean();
    
    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Error fetching staff member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateStaffSchema.parse(body);

    await connectDB();

    const staff = await User.findById(id);
    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Check if email already exists (exclude current user)
    if (validatedData.email && validatedData.email !== staff.email) {
      const existingUser = await User.findOne({ 
        email: validatedData.email, 
        _id: { $ne: id } 
      });
      if (existingUser) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
    }

    // Hash password if provided
    if (validatedData.password) {
      validatedData.password = await bcrypt.hash(validatedData.password, 12);
    }

    const updatedStaff = await User.findByIdAndUpdate(
      id,
      validatedData,
      { new: true }
    ).select('-password');

    // Log activity
    await createLog({
      action: 'update_staff',
      userId: session.user.id,
      userName: session.user.name || '',
      details: { 
        message: `Updated staff member: ${updatedStaff?.name}`,
        staffId: id,
        changes: validatedData 
      },
    });

    return NextResponse.json(updatedStaff);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error updating staff member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Prevent deleting self
    if (id === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const staff = await User.findById(id);
    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    await User.findByIdAndDelete(id);

    // Log activity
    await createLog({
      action: 'delete_staff',
      userId: session.user.id,
      userName: session.user.name || '',
      details: { 
        message: `Deleted staff member: ${staff.name} (${staff.email})`,
        deletedStaffId: id 
      },
    });

    return NextResponse.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
