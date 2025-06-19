'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { User } from '@/types';

const staffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['admin', 'staff']),
  isActive: z.boolean(),
});

type StaffFormData = z.infer<typeof staffSchema>;

export default function EditStaffPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const staffId = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: staff, isLoading, error } = useQuery<User>({
    queryKey: ['staff', staffId],
    queryFn: async () => {
      const response = await fetch(`/api/staff/${staffId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch staff member');
      }
      return response.json();
    },
    enabled: !!staffId,
  });

  const [formData, setFormData] = useState<StaffFormData>({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    isActive: true,
  });

  // Update form data when staff data is loaded
  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name,
        email: staff.email,
        password: '', // Don't prefill password
        role: staff.role,
        isActive: staff.isActive,
      });
    }
  }, [staff]);

  if (session?.user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Access denied. Admin access required.</p>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Staff member not found or error loading</p>
          <Link
            href="/dashboard/staff"
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
          >
            Back to Staff
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
      // Create validation data - remove empty password
      const dataToValidate = { ...formData };
      if (!dataToValidate.password) {
        delete dataToValidate.password;
      }

      const validatedData = staffSchema.parse(dataToValidate);

      const response = await fetch(`/api/staff/${staffId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update staff member');
      }

      toast.success('Staff member updated successfully');
      router.push('/dashboard/staff');
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

  const handleChange = (field: keyof StaffFormData, value: string | boolean) => {
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
              <h1 className="text-2xl font-bold text-gray-900">Edit Staff Member</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/staff"
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                ← Back to Staff
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter full name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter email address"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Leave empty to keep current password"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              <p className="mt-1 text-sm text-gray-500">Leave empty to keep the current password</p>
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value as 'admin' | 'staff')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.role ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={staff._id === session?.user?.id} // Can't change own role
              >
                <option value="staff">Staff</option>
                <option value="admin">Administrator</option>
              </select>
              {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
              {staff._id === session?.user?.id && (
                <p className="mt-1 text-sm text-gray-500">You cannot change your own role</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                  disabled={staff._id === session?.user?.id} // Can't deactivate self
                />
                <span className="ml-2 text-sm text-gray-700">Active (can login)</span>
              </label>
              {staff._id === session?.user?.id && (
                <p className="mt-1 text-sm text-gray-500">You cannot deactivate your own account</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-6">
              <Link
                href="/dashboard/staff"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Updating...' : 'Update Staff Member'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
