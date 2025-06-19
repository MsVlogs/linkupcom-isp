import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Customer } from '@/models/Customer';
import { Payment } from '@/models/Payment';

function formatCSV(data: Record<string, unknown>[], headers: string[]): string {
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  const { type } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    interface DateFilter {
      $gte?: Date;
      $lte?: Date;
    }
    
    const dateFilter: DateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    let csvData: string;
    let filename: string;

    switch (type) {
      case 'customers':
        const customers = await Customer.find().lean();
        const customerHeaders = ['customerCode', 'name', 'email', 'phone', 'address', 'plan', 'monthlyFee', 'status', 'createdAt'];
        csvData = formatCSV(customers.map(c => ({
          ...c,
          createdAt: c.createdAt?.toISOString().split('T')[0]
        })), customerHeaders);
        filename = `customers-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'payments':
        const payments = await Payment.find(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {})
          .populate('customerId', 'name customerCode')
          .populate('collectedBy', 'name')
          .lean();
        
        const paymentHeaders = ['customerCode', 'customerName', 'amount', 'billingMonth', 'status', 'collectedBy', 'createdAt'];
        csvData = formatCSV(payments.map(p => ({
          customerCode: (p.customerId as { customerCode?: string })?.customerCode || '',
          customerName: (p.customerId as { name?: string })?.name || '',
          amount: p.amount,
          billingMonth: p.billingMonth,
          status: p.status,
          collectedBy: (p.collectedBy as { name?: string })?.name || '',
          createdAt: p.createdAt?.toISOString().split('T')[0]
        })), paymentHeaders);
        filename = `payments-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'revenue-summary':
        const revenueSummary = await Payment.aggregate([
          ...(Object.keys(dateFilter).length ? [{ $match: { createdAt: dateFilter } }] : []),
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

        const revenueHeaders = ['year', 'month', 'revenue', 'paymentCount'];
        csvData = formatCSV(revenueSummary.map(r => ({
          year: r._id.year,
          month: r._id.month,
          revenue: r.revenue,
          paymentCount: r.count
        })), revenueHeaders);
        filename = `revenue-summary-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error exporting CSV:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
