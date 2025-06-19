'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Payment } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import Image from 'next/image';

async function fetchPayment(id: string): Promise<Payment> {
  const response = await fetch(`/api/payments/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch payment');
  }
  return response.json();
}

export default function ViewPaymentPage() {
  const { data: session } = useSession();
  const params = useParams();
  const paymentId = params.id as string;

  const { data: payment, isLoading, error } = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: () => fetchPayment(paymentId),
    enabled: !!session,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading payment</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 mr-4"
          >
            Retry
          </button>
          <Link
            href="/dashboard/payments"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Back to Payments
          </Link>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Payment not found</p>
          <Link
            href="/dashboard/payments"
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
          >
            Back to Payments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center mr-3">
                <Image
                  src="/logo1.png"
                  alt="Linkup Communications"
                  width={300}
                  height={138}
                  className="h-8 w-auto"
                />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Payment Details</h1>
                <p className="text-sm text-gray-600">View payment information</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href={`/dashboard/payments/${payment._id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
              >
                Edit Payment
              </Link>
              <Link
                href="/dashboard/payments"
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                ← Back to Payments
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Payment Status Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Payment for {payment.customerName}
                </h2>
                <p className="text-sm text-gray-600">
                  Customer ID: {payment.customerId} • {payment.billingMonth}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-teal-600 mb-2">
                  {formatCurrency(payment.amount)}
                </div>
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    payment.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : payment.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {payment.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="px-6 py-6">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Customer Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{payment.customerName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Customer ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{payment.customerId}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Payment Amount</dt>
                <dd className="mt-1 text-sm text-gray-900 font-bold">
                  {formatCurrency(payment.amount)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Payment Status</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{payment.status}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Billing Month</dt>
                <dd className="mt-1 text-sm text-gray-900">{payment.billingMonth}</dd>
              </div>
              {payment.paymentMethod && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">
                    {payment.paymentMethod.replace('_', ' ')}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Collected By</dt>
                <dd className="mt-1 text-sm text-gray-900">{payment.collectedByName || 'Unknown'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Payment Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {payment.paidAt ? formatDate(payment.paidAt) : 'Not paid yet'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(payment.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(payment.updatedAt)}
                </dd>
              </div>
            </dl>

            {/* Notes Section */}
            {payment.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <dt className="text-sm font-medium text-gray-500 mb-2">Notes</dt>
                <dd className="text-sm text-gray-900 bg-gray-50 rounded-lg p-4">
                  {payment.notes}
                </dd>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Payment ID: <span className="font-mono">{payment._id}</span>
              </div>
              <div className="flex space-x-3">
                <Link
                  href={`/dashboard/payments/${payment._id}/edit`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Edit Payment
                </Link>
                <Link
                  href={`/dashboard/customers/${payment.customerId}`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  View Customer
                </Link>
                <Link
                  href="/dashboard/payments"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
                >
                  Back to Payments
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
