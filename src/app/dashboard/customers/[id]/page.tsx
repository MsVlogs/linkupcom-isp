'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Customer, Payment } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function ViewCustomerPage() {
  const params = useParams();
  const customerId = params.id as string;

  const { data: customer, isLoading: customerLoading, error: customerError } = useQuery<Customer>({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      const response = await fetch(`/api/customers/${customerId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch customer');
      }
      return response.json();
    },
    enabled: !!customerId,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ['customer-payments', customerId],
    queryFn: async () => {
      const response = await fetch(`/api/payments?customerId=${customerId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      const data = await response.json();
      return data.payments || [];
    },
    enabled: !!customerId,
  });

  if (customerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (customerError || !customer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Customer not found or error loading customer</p>
          <Link
            href="/dashboard/customers"
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
          >
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusBadge = (status: string) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Customer Details</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href={`/dashboard/customers/${customer._id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit Customer
              </Link>
              <Link
                href="/dashboard/customers"
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                ← Back to Customers
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Customer Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Customer ID</label>
                  <p className="text-gray-900">{customer.customerId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
                  <p className="text-gray-900">{customer.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                  <p className="text-gray-900">{customer.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Area</label>
                  <p className="text-gray-900">{customer.area}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                  <p className="text-gray-900">{customer.address}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Package</label>
                  <p className="text-gray-900">{customer.package}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Monthly Fee</label>
                  <p className="text-gray-900 font-semibold">{formatCurrency(customer.monthlyFee)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(customer.status)}`}>
                    {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Connection Date</label>
                  <p className="text-gray-900">{new Date(customer.connectionDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  href={`/dashboard/payments/collect?customerId=${customer._id}`}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
                >
                  Collect Payment
                </Link>
                <Link
                  href={`/dashboard/customers/${customer._id}/edit`}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Edit Customer
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-lg border border-gray-200 mt-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Payment History</h2>
          </div>
          <div className="overflow-x-auto">
            {paymentsLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading payments...</p>
              </div>
            ) : !payments || payments.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No payment records found for this customer.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Billing Month
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Collected By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.billingMonth}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusBadge(payment.status)}`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.paymentMethod?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.collectedByName || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
