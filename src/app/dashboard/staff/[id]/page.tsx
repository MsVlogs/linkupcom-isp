'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { User } from '@/types';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';

async function fetchStaff(id: string): Promise<User> {
  const response = await fetch(`/api/staff/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch staff member');
  }
  return response.json();
}

export default function ViewStaffPage() {
  const { data: session } = useSession();
  const params = useParams();
  const staffId = params.id as string;

  const { data: staff, isLoading, error } = useQuery({
    queryKey: ['staff', staffId],
    queryFn: () => fetchStaff(staffId),
    enabled: !!session && session.user.role === 'admin',
  });

  // Redirect non-admin users
  if (session && session.user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Access denied. Admin privileges required.</p>
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading staff member</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 mr-4"
          >
            Retry
          </button>
          <Link
            href="/dashboard/staff"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Back to Staff List
          </Link>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Staff member not found</p>
          <Link
            href="/dashboard/staff"
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
          >
            Back to Staff List
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
                <h1 className="text-2xl font-bold text-gray-900">Staff Details</h1>
                <p className="text-sm text-gray-600">View staff member information</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href={`/dashboard/staff/${staff._id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
              >
                Edit Staff
              </Link>
              <Link
                href="/dashboard/staff"
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                ← Back to Staff List
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Staff Info Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                  <span className="text-teal-600 font-bold text-xl">
                    {staff.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-bold text-gray-900">{staff.name}</h2>
                  <p className="text-sm text-gray-600">{staff.email}</p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    staff.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {staff.role === 'admin' ? 'Administrator' : 'Staff Member'}
                </span>
                <div className="mt-2">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      staff.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {staff.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Staff Details */}
          <div className="px-6 py-6">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{staff.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                <dd className="mt-1 text-sm text-gray-900">{staff.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Role</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{staff.role}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {staff.isActive ? 'Active' : 'Inactive'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Account Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(staff.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(staff.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Staff ID: <span className="font-mono">{staff._id}</span>
              </div>
              <div className="flex space-x-3">
                <Link
                  href={`/dashboard/staff/${staff._id}/edit`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Edit Details
                </Link>
                <Link
                  href="/dashboard/staff"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
                >
                  Back to Staff List
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
