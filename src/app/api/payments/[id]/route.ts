import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { Payment } from '@/models/Payment';
import { createLog } from '@/lib/logger';
import { z } from 'zod';

const paymentUpdateSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  status: z.enum(['paid', 'pending', 'overdue']),
  billingMonth: z.string().min(1, 'Billing month is required'),
  paymentMethod: z.enum(['cash', 'mobile_banking', 'bank_transfer']),
  notes: z.string().optional(),
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

    const payment = await Payment.findById(id);

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
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
    const validatedData = paymentUpdateSchema.parse(body);

    await connectDB();

    const payment = await Payment.findById(id);
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Update payment with new status date if status changed to paid
    const updateData: Record<string, unknown> = { ...validatedData };
    if (validatedData.status === 'paid' && payment.status !== 'paid') {
      updateData.paidAt = new Date();
      updateData.collectedBy = session.user.id;
      updateData.collectedByName = session.user.name;
    } else if (validatedData.status !== 'paid') {
      updateData.paidAt = null;
      updateData.collectedBy = null;
      updateData.collectedByName = null;
    }

    const updatedPayment = await Payment.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    // Log the action
    await createLog({
      action: 'UPDATE_PAYMENT',
      userId: session.user.id,
      userName: session.user.name,
      details: {
        paymentId: id,
        customerName: payment.customerName,
        billingMonth: validatedData.billingMonth,
        amount: validatedData.amount,
        status: validatedData.status,
        changes: validatedData,
      },
      req: request,
    });

    return NextResponse.json(updatedPayment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating payment:', error);
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

    const payment = await Payment.findById(id);
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    await Payment.findByIdAndDelete(id);

    // Log the action
    await createLog({
      action: 'DELETE_PAYMENT',
      userId: session.user.id,
      userName: session.user.name,
      details: {
        paymentId: id,
        customerName: payment.customerName,
        billingMonth: payment.billingMonth,
        amount: payment.amount,
      },
      req: request,
    });

    return NextResponse.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
