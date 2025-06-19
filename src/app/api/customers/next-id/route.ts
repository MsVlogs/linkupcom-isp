import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { Customer } from '@/models/Customer';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get all customer IDs that match the LC-xxx pattern and find the highest number
    const customers = await Customer.find(
      { customerId: { $regex: /^LC-\d+$/ } },
      { customerId: 1 }
    ).lean();

    let nextNumber = 1;

    if (customers.length > 0) {
      // Extract all numbers and find the maximum
      const numbers = customers
        .map(c => {
          const customerRecord = c as { customerId?: string };
          if (customerRecord.customerId && typeof customerRecord.customerId === 'string') {
            const match = customerRecord.customerId.match(/^LC-(\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
          }
          return 0;
        })
        .filter(n => n > 0);

      if (numbers.length > 0) {
        nextNumber = Math.max(...numbers) + 1;
      }
    }

    const nextId = `LC-${nextNumber.toString().padStart(3, '0')}`;

    return NextResponse.json({ nextId });
  } catch (error) {
    console.error('Error generating next customer ID:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
