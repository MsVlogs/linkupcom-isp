import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { Payment } from '@/models/Payment';
import { Customer } from '@/models/Customer';
import { createLog } from '@/lib/logger';
import { z } from 'zod';

const paymentSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  amount: z.number().positive('Amount must be positive'),
  status: z.enum(['paid', 'pending', 'overdue']),
  billingMonth: z.string().min(1, 'Billing month is required'),
  paymentMethod: z.enum(['cash', 'mobile_banking', 'bank_transfer']).default('cash'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  notes: z.string().optional(),
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
    const status = searchParams.get('status');
    const billingMonth = searchParams.get('billingMonth');
    const customerId = searchParams.get('customerId');

    const query: Record<string, unknown> = {};
    
    if (status) {
      query.status = status;
    }
    
    if (billingMonth) {
      query.billingMonth = billingMonth;
    }
    
    if (customerId) {
      query.customerId = customerId;
    }

    const skip = (page - 1) * limit;
    
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await Payment.countDocuments(query);

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
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
    const validatedData = paymentSchema.parse(body);

    await connectDB();

    // Get customer details
    const customer = await Customer.findOne({ customerId: validatedData.customerId });
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check if payment already exists for this customer and billing month
    const existingPayment = await Payment.findOne({
      customerId: validatedData.customerId,
      billingMonth: validatedData.billingMonth,
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Payment already exists for this billing month' },
        { status: 400 }
      );
    }

    // Create due date (last day of billing month + 7 days grace period)
    const [year, month] = validatedData.billingMonth.split('-');
    const dueDate = new Date(parseInt(year), parseInt(month), 7); // 7th of next month

    const paymentData = {
      ...validatedData,
      customerName: customer.name,
      dueDate,
      collectedBy: session.user.id,
      collectedByName: session.user.name,
      paidAt: validatedData.status === 'paid' ? new Date(validatedData.paymentDate) : undefined,
    };

    const payment = await Payment.create(paymentData);

    // Log the action
    await createLog({
      action: 'CREATE_PAYMENT',
      userId: session.user.id,
      userName: session.user.name,
      details: {
        customerId: validatedData.customerId,
        customerName: customer.name,
        amount: validatedData.amount,
        status: validatedData.status,
        billingMonth: validatedData.billingMonth,
      },
      req: request,
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
