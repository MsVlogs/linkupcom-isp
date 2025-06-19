import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { Customer } from '@/models/Customer';
import { Payment } from '@/models/Payment';

interface DateFilter {
  $gte?: Date;
  $lte?: Date;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'overview';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter: DateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    switch (reportType) {
      case 'overview':
        return await getOverviewReport(dateFilter);
      
      case 'revenue':
        return await getRevenueReport(dateFilter);
      
      case 'customer-status':
        return await getCustomerStatusReport();
      
      case 'payment-trends':
        return await getPaymentTrendsReport(dateFilter);
      
      case 'staff-performance':
        if (session.user.role !== 'admin') {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return await getStaffPerformanceReport(dateFilter);
      
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getOverviewReport(dateFilter: DateFilter) {
  const hasDateFilter = Object.keys(dateFilter).length > 0;
  const createdAtFilter = hasDateFilter ? { createdAt: dateFilter } : {};
  
  const [
    totalCustomers,
    activeCustomers,
    totalPayments,
    totalRevenue,
    recentPayments
  ] = await Promise.all([
    Customer.countDocuments(),
    Customer.countDocuments({ status: 'active' }),
    Payment.countDocuments(createdAtFilter),
    Payment.aggregate([
      ...(hasDateFilter ? [{ $match: { createdAt: dateFilter } }] : []),
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Payment.find(createdAtFilter)
      .populate('collectedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
  ]);

  return NextResponse.json({
    overview: {
      totalCustomers,
      activeCustomers,
      totalPayments,
      totalRevenue: totalRevenue[0]?.total || 0,
    },
    recentPayments
  });
}

async function getRevenueReport(dateFilter: DateFilter) {
  const hasDateFilter = Object.keys(dateFilter).length > 0;
  
  const revenueByMonth = await Payment.aggregate([
    ...(hasDateFilter ? [{ $match: { createdAt: dateFilter } }] : []),
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const revenueByPlan = await Payment.aggregate([
    ...(hasDateFilter ? [{ $match: { createdAt: dateFilter } }] : []),
    {
      $lookup: {
        from: 'customers',
        localField: 'customerId',
        foreignField: '_id',
        as: 'customer'
      }
    },
    { $unwind: '$customer' },
    {
      $group: {
        _id: '$customer.plan',
        revenue: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  return NextResponse.json({
    revenueByMonth,
    revenueByPlan
  });
}

async function getCustomerStatusReport() {
  const statusCounts = await Customer.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const planCounts = await Customer.aggregate([
    {
      $group: {
        _id: '$plan',
        count: { $sum: 1 }
      }
    }
  ]);

  return NextResponse.json({
    statusCounts,
    planCounts
  });
}

async function getPaymentTrendsReport(dateFilter: DateFilter) {
  const hasDateFilter = Object.keys(dateFilter).length > 0;
  
  const paymentsByStatus = await Payment.aggregate([
    ...(hasDateFilter ? [{ $match: { createdAt: dateFilter } }] : []),
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        amount: { $sum: '$amount' }
      }
    }
  ]);

  const dailyPayments = await Payment.aggregate([
    ...(hasDateFilter ? [{ $match: { createdAt: dateFilter } }] : []),
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 },
        amount: { $sum: '$amount' }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  return NextResponse.json({
    paymentsByStatus,
    dailyPayments
  });
}

async function getStaffPerformanceReport(dateFilter: DateFilter) {
  const hasDateFilter = Object.keys(dateFilter).length > 0;
  
  const staffPerformance = await Payment.aggregate([
    ...(hasDateFilter ? [{ $match: { createdAt: dateFilter } }] : []),
    {
      $group: {
        _id: '$collectedBy',
        paymentsCollected: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'staff'
      }
    },
    { $unwind: '$staff' },
    {
      $project: {
        staffName: '$staff.name',
        staffEmail: '$staff.email',
        paymentsCollected: 1,
        totalAmount: 1
      }
    },
    { $sort: { paymentsCollected: -1 } }
  ]);

  return NextResponse.json({
    staffPerformance
  });
}
