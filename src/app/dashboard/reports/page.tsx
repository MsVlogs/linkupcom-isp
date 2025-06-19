'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { StaffPerformance } from '@/types';

interface ReportData {
  overview?: {
    totalCustomers: number;
    activeCustomers: number;
    totalPayments: number;
    totalRevenue: number;
  };
  recentPayments?: Array<{
    _id: string;
    amount: number;
    createdAt: string;
    customerId?: { name?: string };
  }>;
  revenueByMonth?: Array<{
    _id: { year: number; month: number };
    revenue: number;
    count: number;
  }>;
  revenueByPlan?: Array<{
    _id: string;
    revenue: number;
    count: number;
  }>;
  statusCounts?: Array<{
    _id: string;
    count: number;
  }>;
  planCounts?: Array<{
    _id: string;
    count: number;
  }>;
  paymentsByStatus?: Array<{
    _id: string;
    count: number;
    amount: number;
  }>;
  dailyPayments?: Array<{
    _id: string;
    count: number;
    amount: number;
  }>;
  staffPerformance?: Array<{
    _id: string;
    staffName: string;
    staffEmail: string;
    paymentsCollected: number;
    totalAmount: number;
  }>;
}

async function fetchReportData(type: string, startDate?: string, endDate?: string): Promise<ReportData> {
  const params = new URLSearchParams({
    type,
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  });

  const response = await fetch(`/api/reports?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch report data');
  }
  return response.json();
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const [reportType, setReportType] = useState('overview');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', reportType, startDate, endDate],
    queryFn: () => fetchReportData(reportType, startDate, endDate),
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
          <p className="text-red-600 mb-4">Error loading reports</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
          >
            Retry
          </button>
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
              <Link href="/dashboard" className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">LC</span>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="text-sm text-gray-600">View business insights and performance metrics</p>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <select
                id="reportType"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="overview">Overview</option>
                <option value="revenue">Revenue Analysis</option>
                <option value="customer-status">Customer Status</option>
                <option value="payment-trends">Payment Trends</option>
                {session?.user.role === 'admin' && (
                  <option value="staff-performance">Staff Performance</option>
                )}
              </select>
            </div>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex items-end space-x-2">
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Clear Dates
              </button>
              <Link
                href={`/api/export/revenue-summary?startDate=${startDate}&endDate=${endDate}`}
                className="px-4 py-2 bg-teal-600 text-white text-sm rounded-md hover:bg-teal-700"
              >
                Export CSV
              </Link>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="space-y-6">
          {/* Overview Report */}
          {reportType === 'overview' && data?.overview && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-500">Total Customers</h3>
                  <p className="text-2xl font-bold text-gray-900">{data.overview.totalCustomers}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-500">Active Customers</h3>
                  <p className="text-2xl font-bold text-gray-900">{data.overview.activeCustomers}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-500">Total Payments</h3>
                  <p className="text-2xl font-bold text-gray-900">{data.overview.totalPayments}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                  <p className="text-2xl font-bold text-teal-600">
                    {formatCurrency(data.overview.totalRevenue)}
                  </p>
                </div>
              </div>

              {data.recentPayments && data.recentPayments.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Recent Payments</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.recentPayments.slice(0, 10).map((payment) => (
                          <tr key={payment._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {payment.customerId?.name || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(payment.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Revenue Report */}
          {reportType === 'revenue' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data?.revenueByMonth && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Month</h3>
                  <div className="space-y-3">
                    {data.revenueByMonth.map((item) => (
                      <div key={`${item._id.year}-${item._id.month}`} className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          {new Date(item._id.year, item._id.month - 1).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long' 
                          })}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(item.revenue)} ({item.count} payments)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data?.revenueByPlan && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Plan</h3>
                  <div className="space-y-3">
                    {data.revenueByPlan.map((item) => (
                      <div key={item._id} className="flex justify-between">
                        <span className="text-sm text-gray-600">{item._id}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(item.revenue)} ({item.count} payments)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Customer Status Report */}
          {reportType === 'customer-status' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data?.statusCounts && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Status</h3>
                  <div className="space-y-3">
                    {data.statusCounts.map((item) => (
                      <div key={item._id} className="flex justify-between">
                        <span className="text-sm text-gray-600 capitalize">{item._id}</span>
                        <span className="text-sm font-medium text-gray-900">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data?.planCounts && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Customers by Plan</h3>
                  <div className="space-y-3">
                    {data.planCounts.map((item) => (
                      <div key={item._id} className="flex justify-between">
                        <span className="text-sm text-gray-600">{item._id}</span>
                        <span className="text-sm font-medium text-gray-900">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Staff Performance Report (Admin only) */}
          {reportType === 'staff-performance' && session?.user.role === 'admin' && data?.staffPerformance && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Staff Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Staff Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Payments Collected
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Total Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.staffPerformance.map((staff: StaffPerformance) => (
                      <tr key={staff._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{staff.staffName}</div>
                          <div className="text-sm text-gray-500">{staff.staffEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {staff.paymentsCollected}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(staff.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
