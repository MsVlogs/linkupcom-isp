'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Customer, PaymentFormData } from '@/types';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { formatCurrency, getCurrentBillingMonth, getTodaysDate } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

const paymentSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  status: z.enum(['paid', 'pending', 'overdue']).default('paid'),
  billingMonth: z.string().min(1, 'Billing month is required'),
  paymentMethod: z.enum(['cash', 'mobile_banking', 'bank_transfer']).default('cash'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  notes: z.string().optional(),
});

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

async function fetchCustomerById(id: string): Promise<Customer> {
  const response = await fetch(`/api/customers/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch customer');
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

function CollectPaymentContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PaymentFormData>({
    customerId: '',
    amount: 0,
    status: 'paid' as const,
    billingMonth: getCurrentBillingMonth(),
    paymentMethod: 'cash' as const,
    paymentDate: getTodaysDate(),
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get customer ID from URL parameters
  const preSelectedCustomerId = searchParams.get('customerId');

  // Fetch customer data if coming from customer details page
  const { data: preSelectedCustomer } = useQuery({
    queryKey: ['customer', preSelectedCustomerId],
    queryFn: () => fetchCustomerById(preSelectedCustomerId!),
    enabled: !!preSelectedCustomerId && !selectedCustomer,
  });

  // Auto-select customer if coming from customer details page
  useEffect(() => {
    if (preSelectedCustomer && !selectedCustomer) {
      setSelectedCustomer(preSelectedCustomer);
      setFormData(prev => ({
        ...prev,
        customerId: preSelectedCustomer.customerId, // Use customerId (like "LC-001") not _id
        amount: preSelectedCustomer.monthlyFee,
      }));
    }
  }, [preSelectedCustomer, selectedCustomer]);

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
      customerId: customer.customerId, // Use customerId (like "LC-001") not _id
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-6 space-y-4 sm:space-y-0">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center mr-3">
                <Image
                  src="/logo1.png"
                  alt="Linkup Communications"
                  width={300}
                  height={138}
                  className="h-8 w-auto"
                  unoptimized
                />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Collect Payment</h1>
                <p className="text-sm text-gray-600">Record a new payment from customer</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                ← Back to Dashboard
              </Link>
              {preSelectedCustomerId && (
                <Link
                  href={`/dashboard/customers/${preSelectedCustomerId}`}
                  className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                >
                  ← Back to Customer Details
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Pre-selected Customer Notification */}
      {preSelectedCustomerId && (
        <div className="bg-teal-50 border-b border-teal-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-teal-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-teal-800">
                <span className="font-medium">Customer Pre-selected:</span> Payment form has been auto-filled from customer details
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Search */}
            <div>
              <label htmlFor="customerSearch" className="block text-sm font-medium text-gray-700 mb-2">
                Search Customer *
                {preSelectedCustomerId && (
                  <span className="ml-2 text-sm text-teal-600 font-normal">
                    (Auto-filled from customer details)
                  </span>
                )}
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

              {/* Payment Method */}
              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  id="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={(e) => handleChange('paymentMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="cash">Cash</option>
                  <option value="mobile_banking">Mobile Banking</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
                {errors.paymentMethod && (
                  <p className="mt-1 text-sm text-red-600">{errors.paymentMethod}</p>
                )}
              </div>

              {/* Payment Date */}
              <div>
                <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date *
                </label>
                <input
                  type="date"
                  id="paymentDate"
                  value={formData.paymentDate}
                  onChange={(e) => handleChange('paymentDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {errors.paymentDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.paymentDate}</p>
                )}
              </div>

              {/* Billing Month */}
              <div>
                <label htmlFor="billingMonth" className="block text-sm font-medium text-gray-700 mb-2">
                  Billing Month *
                </label>
                <input
                  type="month"
                  id="billingMonth"
                  value={formData.billingMonth}
                  onChange={(e) => handleChange('billingMonth', e.target.value)}
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

export default function CollectPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    }>
      <CollectPaymentContent />
    </Suspense>
  );
}
