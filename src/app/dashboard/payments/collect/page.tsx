'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Customer } from '@/types';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { formatCurrency, getCurrentBillingMonth } from '@/lib/utils';
import Link from 'next/link';

const paymentSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  billingMonth: z.string().min(1, 'Billing month is required'),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface CustomersResponse {
  customers: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

async function fetchCustomers(search: string): Promise<CustomersResponse> {
  const params = new URLSearchParams({
    limit: '50',
    status: 'active',
    ...(search && { search }),
  });

  const response = await fetch(`/api/customers?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch customers');
  }
  return response.json();
}

async function createPayment(data: PaymentFormData): Promise<void> {
  const response = await fetch('/api/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create payment');
  }
}

export default function CollectPaymentPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PaymentFormData>({
    customerId: '',
    amount: 0,
    billingMonth: getCurrentBillingMonth(),
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers-search', customerSearch],
    queryFn: () => fetchCustomers(customerSearch),
    enabled: !!session && customerSearch.length > 2,
  });

  const createPaymentMutation = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Payment collected successfully');
      router.push('/dashboard/payments');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to collect payment');
    },
  });

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      customerId: customer._id,
      amount: customer.monthlyFee,
    }));
    setCustomerSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validatedData = paymentSchema.parse(formData);
      await createPaymentMutation.mutateAsync(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof PaymentFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/dashboard" className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">LC</span>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Collect Payment</h1>
                <p className="text-sm text-gray-600">Record a new payment from customer</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Search */}
            <div>
              <label htmlFor="customerSearch" className="block text-sm font-medium text-gray-700 mb-2">
                Search Customer *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="customerSearch"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Type customer name, ID, or phone..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  disabled={!!selectedCustomer}
                />
                
                {/* Search Results */}
                {customerSearch.length > 2 && !selectedCustomer && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {isLoading ? (
                      <div className="p-4 text-center text-gray-500">Searching...</div>
                    ) : customersData?.customers.length ? (
                      customersData.customers.map((customer) => (
                        <button
                          key={customer._id}
                          type="button"
                          onClick={() => handleCustomerSelect(customer)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">
                            {customer.customerId} • {customer.phone} • {formatCurrency(customer.monthlyFee)}/month
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">No customers found</div>
                    )}
                  </div>
                )}
              </div>
              {errors.customerId && (
                <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>
              )}
            </div>

            {/* Selected Customer */}
            {selectedCustomer && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{selectedCustomer.name}</h3>
                    <p className="text-sm text-gray-600">ID: {selectedCustomer.customerId}</p>
                    <p className="text-sm text-gray-600">Phone: {selectedCustomer.phone}</p>
                    <p className="text-sm text-gray-600">Package: {selectedCustomer.package}</p>
                    <p className="text-sm text-gray-600">Monthly Fee: {formatCurrency(selectedCustomer.monthlyFee)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setFormData(prev => ({ ...prev, customerId: '', amount: 0 }));
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Amount */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount (৳) *
                </label>
                <input
                  type="number"
                  id="amount"
                  value={formData.amount || ''}
                  onChange={(e) => handleChange('amount', parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>

              {/* Billing Month */}
              <div>
                <label htmlFor="billingMonth" className="block text-sm font-medium text-gray-700 mb-2">
                  Billing Month *
                </label>
                <input
                  type="text"
                  id="billingMonth"
                  value={formData.billingMonth}
                  onChange={(e) => handleChange('billingMonth', e.target.value)}
                  placeholder="e.g., January 2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {errors.billingMonth && (
                  <p className="mt-1 text-sm text-red-600">{errors.billingMonth}</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                placeholder="Any additional notes about this payment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              <Link
                href="/dashboard"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || !selectedCustomer}
                className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing...' : 'Collect Payment'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
