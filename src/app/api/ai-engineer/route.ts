import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { Customer } from '@/models/Customer';
import { Payment } from '@/models/Payment';
import { createLog } from '@/lib/logger';
import { z } from 'zod';

const requestSchema = z.object({
  customerId: z.string().min(1),
  question: z.string().min(1).max(1000),
});

type Finding = {
  level: 'info' | 'warning' | 'critical';
  title: string;
  detail: string;
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = requestSchema.parse(await request.json());
    await connectDB();

    let customer = null;
    if (/^[0-9a-fA-F]{24}$/.test(body.customerId)) {
      customer = await Customer.findById(body.customerId).lean();
    }
    if (!customer) customer = await Customer.findOne({ customerId: body.customerId }).lean();
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    const payments = await Payment.find({ customerId: customer._id })
      .sort({ dueDate: -1 })
      .limit(12)
      .lean();

    const findings: Finding[] = [];
    const question = body.question.toLowerCase();

    if (customer.status !== 'active') {
      findings.push({
        level: 'critical',
        title: 'Customer account is not active',
        detail: `The billing account status is "${customer.status}". Check the account/service state before treating this as a network fault.`,
      });
    } else {
      findings.push({
        level: 'info',
        title: 'Customer account is active',
        detail: 'The customer record is active in the billing database.',
      });
    }

    const overdue = payments.filter((p: any) => p.status === 'overdue');
    const pending = payments.filter((p: any) => p.status === 'pending');

    if (overdue.length) {
      findings.push({
        level: 'warning',
        title: 'Overdue billing records found',
        detail: `${overdue.length} overdue payment record(s) are present. Billing status can be a possible service-impact factor depending on your enforcement policy.`,
      });
    }
    if (pending.length) {
      findings.push({
        level: 'info',
        title: 'Pending billing records found',
        detail: `${pending.length} pending payment record(s) are present; these are not treated as proof of an outage.`,
      });
    }

    findings.push({
      level: 'info',
      title: 'Network-device telemetry',
      detail: 'No live MikroTik/OLT/ONU telemetry is currently connected to this read-only diagnostic endpoint, so it will not claim PPPoE, optical, MAC, or device reachability facts that it cannot verify.',
    });

    let summary = 'The customer record is active, but live network telemetry is not available from this application, so the exact offline cause cannot yet be confirmed.';
    if (customer.status !== 'active') {
      summary = `The customer is marked "${customer.status}" in billing. That is the first account-level condition to verify before diagnosing a network outage.`;
    } else if (overdue.length) {
      summary = 'The account is active but has overdue billing records. Verify the service-policy state, then check live PPPoE/OLT/ONU telemetry before concluding the customer is offline.';
    }
    if (!question.includes('offline') && !question.includes('outage') && !question.includes('why')) {
      summary = 'I can analyze this customer using billing/account data and any connected telemetry. The current implementation is read-only and does not make network changes.';
    }

    await createLog({
      action: 'AI_ENGINEER_DIAGNOSTIC',
      userId: session.user.id,
      userName: session.user.name || session.user.email || 'Unknown',
      details: {
        customerId: customer.customerId,
        question: body.question,
        findingCount: findings.length,
        readOnly: true,
      },
      req: request,
    });

    return NextResponse.json({
      assistant: 'BengalStack AI Engineer',
      readOnly: true,
      customer: {
        id: customer._id.toString(),
        customerId: customer.customerId,
        name: customer.name,
        status: customer.status,
      },
      summary,
      findings,
      nextChecks: [
        'Check live PPPoE/session status for the customer username.',
        'Check the assigned MikroTik/BNG session and last-seen time.',
        'If applicable, check OLT/ONU registration, optical alarms and ONU MAC.',
        'Check for an area/device-wide outage affecting other customers.',
      ],
      disclaimer: 'Diagnostic only: this assistant does not change configuration, reboot devices, disable services, delete records, or provision customers.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('AI Engineer diagnostic error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}