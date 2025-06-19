'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import CustomerForm from '@/components/CustomerForm';
import { Customer } from '@/types';

export default function EditCustomerPage() {
  const params = useParams();
  const customerId = params.id as string;

  const { data: customer, isLoading, error } = useQuery<Customer>({
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error || !customer) {
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

  return <CustomerForm customer={customer} isEditing={true} />;
}
