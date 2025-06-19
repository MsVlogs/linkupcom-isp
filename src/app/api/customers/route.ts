import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { Customer } from '@/models/Customer';
import { createLog } from '@/lib/logger';
import { z } from 'zod';

const customerSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone is required'),
  package: z.string().min(1, 'Package is required'),
  monthlyFee: z.number().positive('Monthly fee must be positive'),
  area: z.string().min(1, 'Area is required'),
  status: z.enum(['active', 'inactive']).default('active'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const area = searchParams.get('area');

    const query: Record<string, unknown> = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { customerId: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (area) {
      query.area = { $regex: area, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await Customer.countDocuments(query);

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = customerSchema.parse(body);

    await connectDB();

    // Check if customer ID already exists
    const existingCustomer = await Customer.findOne({
      customerId: validatedData.customerId,
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer ID already exists' },
        { status: 400 }
      );
    }

    const customer = await Customer.create(validatedData);

    // Log the action
    await createLog({
      action: 'CREATE_CUSTOMER',
      userId: session.user.id,
      userName: session.user.name,
      details: {
        customerId: customer.customerId,
        customerName: customer.name,
      },
      req: request,
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
