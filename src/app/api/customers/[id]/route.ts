import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { Customer } from '@/models/Customer';
import { createLog } from '@/lib/logger';
import { z } from 'zod';

const customerUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  address: z.string().min(1, 'Address is required').optional(),
  phone: z.string().min(1, 'Phone is required').optional(),
  pppoeUsername: z.string().trim().optional(),
  onuId: z.string().trim().optional(),
  package: z.string().min(1, 'Package is required').optional(),
  monthlyFee: z.number().positive('Monthly fee must be positive').optional(),
  area: z.string().min(1, 'Area is required').optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Try to find by MongoDB _id first, then by customerId
    let customer;
    
    // Check if the id looks like a MongoDB ObjectId (24 hex chars)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      customer = await Customer.findById(id);
    }
    
    // If not found by _id or not a valid ObjectId, try by customerId
    if (!customer) {
      customer = await Customer.findOne({ customerId: id });
    }

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = customerUpdateSchema.parse(body);

    await connectDB();

    // Try to find by MongoDB _id first, then by customerId
    let customer;
    
    // Check if the id looks like a MongoDB ObjectId (24 hex chars)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      customer = await Customer.findById(id);
    }
    
    // If not found by _id or not a valid ObjectId, try by customerId
    if (!customer) {
      customer = await Customer.findOne({ customerId: id });
    }

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Update using the actual MongoDB _id
    const updatedCustomer = await Customer.findByIdAndUpdate(
      customer._id,
      validatedData,
      { new: true }
    );

    // Log the action
    await createLog({
      action: 'UPDATE_CUSTOMER',
      userId: session.user.id,
      userName: session.user.name,
      details: {
        customerId: customer.customerId,
        customerName: customer.name,
        changes: validatedData,
      },
      req: request,
    });

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // Try to find by MongoDB _id first, then by customerId
    let customer;
    
    // Check if the id looks like a MongoDB ObjectId (24 hex chars)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      customer = await Customer.findById(id);
    }
    
    // If not found by _id or not a valid ObjectId, try by customerId
    if (!customer) {
      customer = await Customer.findOne({ customerId: id });
    }

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Delete using the actual MongoDB _id
    await Customer.findByIdAndDelete(customer._id);

    // Log the action
    await createLog({
      action: 'DELETE_CUSTOMER',
      userId: session.user.id,
      userName: session.user.name,
      details: {
        customerId: customer.customerId,
        customerName: customer.name,
      },
      req: request,
    });

    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
