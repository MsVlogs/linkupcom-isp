import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { Customer } from '@/models/Customer';
import { Payment } from '@/models/Payment';
import { getCurrentBillingMonth } from '@/lib/utils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const currentMonth = getCurrentBillingMonth();
    
    // Get total and active customers
    const [totalCustomers, activeCustomers] = await Promise.all([
      Customer.countDocuments(),
      Customer.countDocuments({ status: 'active' }),
    ]);

    // Get payment statistics for current month
    const [pendingPayments, overduePayments, paidThisMonth] = await Promise.all([
      Payment.countDocuments({ 
        billingMonth: currentMonth, 
        status: 'pending' 
      }),
      Payment.countDocuments({ 
        status: 'overdue' 
      }),
      Payment.countDocuments({ 
        billingMonth: currentMonth, 
        status: 'paid' 
      }),
    ]);

    // Calculate monthly revenue (paid payments for current month)
    const monthlyRevenueResult = await Payment.aggregate([
      {
        $match: {
          billingMonth: currentMonth,
          status: 'paid',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const monthlyRevenue = monthlyRevenueResult[0]?.total || 0;

    const stats = {
      totalCustomers,
      activeCustomers,
      pendingPayments,
      overduePayments,
      monthlyRevenue,
      paidThisMonth,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
