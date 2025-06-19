'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { Customer } from '@/types';

const customerSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  package: z.string().min(1, 'Package is required'),
  monthlyFee: z.number().min(1, 'Monthly fee must be greater than 0'),
  status: z.enum(['active', 'inactive']),
  area: z.string().min(1, 'Area is required'),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  customer?: Customer;
  isEditing?: boolean;
}

export default function CustomerForm({ customer, isEditing = false }: CustomerFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>({
    customerId: customer?.customerId || '',
    name: customer?.name || '',
    address: customer?.address || '',
    phone: customer?.phone || '',
    package: customer?.package || '',
    monthlyFee: customer?.monthlyFee || 0,
    status: customer?.status || 'active',
    area: customer?.area || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validate form data
      const validatedData = customerSchema.parse(formData);

      const url = isEditing ? `/api/customers/${customer?._id}` : '/api/customers';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save customer');
      }

      toast.success(isEditing ? 'Customer updated successfully' : 'Customer created successfully');
      router.push('/dashboard/customers');
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

  const handleChange = (field: keyof CustomerFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
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
              <button
                onClick={() => router.back()}
                className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center mr-3"
              >
                <span className="text-white font-bold text-sm">←</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditing ? 'Edit Customer' : 'Add New Customer'}
                </h1>
                <p className="text-sm text-gray-600">
                  {isEditing ? 'Update customer information' : 'Enter customer details'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer ID */}
              <div>
                <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-2">
                  Customer ID *
                </label>
                <input
                  type="text"
                  id="customerId"
                  value={formData.customerId}
                  onChange={(e) => handleChange('customerId', e.target.value)}
                  disabled={isEditing} // Don't allow editing customer ID
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50"
                />
                {errors.customerId && (
                  <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>
                )}
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              {/* Area */}
              <div>
                <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
                  Area *
                </label>
                <input
                  type="text"
                  id="area"
                  value={formData.area}
                  onChange={(e) => handleChange('area', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {errors.area && (
                  <p className="mt-1 text-sm text-red-600">{errors.area}</p>
                )}
              </div>

              {/* Package */}
              <div>
                <label htmlFor="package" className="block text-sm font-medium text-gray-700 mb-2">
                  Package *
                </label>
                <select
                  id="package"
                  value={formData.package}
                  onChange={(e) => {
                    const selectedPackage = e.target.value;
                    handleChange('package', selectedPackage);
                    
                    // Auto-update monthly fee based on package selection
                    const packagePrices: Record<string, number> = {
                      'Basic': 500,
                      'Bronze': 600,
                      'Silver': 700,
                      'Gold': 800,
                      'Platinum': 900,
                      'Platinum Plus': 1000,
                      'Diamond': 1200,
                      'Titanium': 1500,
                    };
                    
                    if (selectedPackage && packagePrices[selectedPackage]) {
                      handleChange('monthlyFee', packagePrices[selectedPackage]);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select Package</option>
                  <option value="Basic">Basic - 5 Mbps (৳500) - Smooth browsing, unlimited entertainment</option>
                  <option value="Bronze">Bronze - 10 Mbps (৳600) - Bufferless Facebook & YouTube, 24x7 support</option>
                  <option value="Silver">Silver - 15 Mbps (৳700) - Multiple devices, HD streaming</option>
                  <option value="Gold">Gold - 20 Mbps (৳800) - Heavy usage, seamless entertainment</option>
                  <option value="Platinum">Platinum - 25 Mbps (৳900) - Premium experience, multiple streams</option>
                  <option value="Platinum Plus">Platinum Plus - 30 Mbps (৳1000) - Ultra-fast, professional use</option>
                  <option value="Diamond">Diamond - 35 Mbps (৳1200) - Enterprise level, content creation</option>
                  <option value="Titanium">Titanium - 40 Mbps (৳1500) - Maximum speed, premium support</option>
                </select>
                {errors.package && (
                  <p className="mt-1 text-sm text-red-600">{errors.package}</p>
                )}
              </div>

              {/* Monthly Fee */}
              <div>
                <label htmlFor="monthlyFee" className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Fee (৳) *
                </label>
                <input
                  type="number"
                  id="monthlyFee"
                  value={formData.monthlyFee || ''}
                  onChange={(e) => handleChange('monthlyFee', parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {errors.monthlyFee && (
                  <p className="mt-1 text-sm text-red-600">{errors.monthlyFee}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value as 'active' | 'inactive')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Full Address *
              </label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : (isEditing ? 'Update Customer' : 'Create Customer')}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
