'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { Payment } from '@/types';

const paymentSchema = z.object({
  amount: z.number().min(1, 'Amount must be greater than 0'),
  status: z.enum(['paid', 'pending', 'overdue']),
  billingMonth: z.string().min(1, 'Billing month is required'),
  paymentMethod: z.enum(['cash', 'mobile_banking', 'bank_transfer']),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export default function EditPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: payment, isLoading, error } = useQuery<Payment>({
    queryKey: ['payment', paymentId],
    queryFn: async () => {
      const response = await fetch(`/api/payments/${paymentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payment');
      }
      return response.json();
    },
    enabled: !!paymentId,
  });

  const [formData, setFormData] = useState<PaymentFormData>({
    amount: 0,
    status: 'pending',
    billingMonth: '',
    paymentMethod: 'cash',
    notes: '',
  });

  // Update form data when payment data is loaded
  useEffect(() => {
    if (payment) {
      setFormData({
        amount: payment.amount,
        status: payment.status,
        billingMonth: payment.billingMonth,
        paymentMethod: payment.paymentMethod,
        notes: payment.notes || '',
      });
    }
  }, [payment]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Payment not found or error loading</p>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validatedData = paymentSchema.parse(formData);

      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update payment');
      }

      toast.success('Payment updated successfully');
      router.push('/dashboard/payments');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast.error(error instanceof Error ? error.message : 'An error occurred');
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
              <h1 className="text-2xl font-bold text-gray-900">Edit Payment</h1>
            </div>
            <div className="flex items-center space-x-4">
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
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {/* Customer Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Customer:</span>
                <span className="ml-2 font-medium">{payment.customerName}</span>
              </div>
              <div>
                <span className="text-gray-500">Customer ID:</span>
                <span className="ml-2 font-medium">{payment.customerId}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <input
                type="number"
                id="amount"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.amount ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter amount"
              />
              {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.billingMonth ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., January 2024"
              />
              {errors.billingMonth && <p className="mt-1 text-sm text-red-600">{errors.billingMonth}</p>}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value as 'paid' | 'pending' | 'overdue')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.status ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
              {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
            </div>

            {/* Payment Method */}
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method *
              </label>
              <select
                id="paymentMethod"
                value={formData.paymentMethod}
                onChange={(e) => handleChange('paymentMethod', e.target.value as 'cash' | 'mobile_banking' | 'bank_transfer')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.paymentMethod ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="cash">Cash</option>
                <option value="mobile_banking">Mobile Banking</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
              {errors.paymentMethod && <p className="mt-1 text-sm text-red-600">{errors.paymentMethod}</p>}
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.notes ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Additional notes (optional)"
              />
              {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes}</p>}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-6">
              <Link
                href="/dashboard/payments"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Updating...' : 'Update Payment'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
