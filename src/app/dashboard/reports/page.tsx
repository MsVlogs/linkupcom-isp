'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { StaffPerformance } from '@/types';
import Image from 'next/image';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

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
    customerId: string;
    customerName: string;
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
                              {payment.customerName || 'Unknown'}
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
            <div className="space-y-6">
              {/* Revenue by Month Chart */}
              {data?.revenueByMonth && data.revenueByMonth.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trends</h3>
                  <div className="h-80">
                    <Line
                      data={{
                        labels: data.revenueByMonth.map(item => 
                          new Date(item._id.year, item._id.month - 1).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short' 
                          })
                        ),
                        datasets: [{
                          label: 'Monthly Revenue',
                          data: data.revenueByMonth.map(item => item.revenue),
                          borderColor: 'rgb(45, 212, 191)',
                          backgroundColor: 'rgba(45, 212, 191, 0.1)',
                          tension: 0.1,
                          fill: true,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top' as const,
                          },
                          title: {
                            display: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: function(value) {
                                return '৳' + value.toLocaleString();
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue by Month Table */}
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

                {/* Revenue by Plan Chart */}
                {data?.revenueByPlan && data.revenueByPlan.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Plan</h3>
                    <div className="h-64">
                      <Pie
                        data={{
                          labels: data.revenueByPlan.map(item => item._id),
                          datasets: [{
                            data: data.revenueByPlan.map(item => item.revenue),
                            backgroundColor: [
                              'rgba(45, 212, 191, 0.8)',
                              'rgba(59, 130, 246, 0.8)',
                              'rgba(139, 92, 246, 0.8)',
                              'rgba(236, 72, 153, 0.8)',
                              'rgba(251, 146, 60, 0.8)',
                              'rgba(34, 197, 94, 0.8)',
                            ],
                            borderColor: [
                              'rgb(45, 212, 191)',
                              'rgb(59, 130, 246)',
                              'rgb(139, 92, 246)',
                              'rgb(236, 72, 153)',
                              'rgb(251, 146, 60)',
                              'rgb(34, 197, 94)',
                            ],
                            borderWidth: 2,
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom' as const,
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  return context.label + ': ৳' + context.parsed.toLocaleString();
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Customer Status Report */}
          {reportType === 'customer-status' && (
            <div className="space-y-6">
              {/* Customer Status Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data?.statusCounts && data.statusCounts.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Status Distribution</h3>
                    <div className="h-64">
                      <Pie
                        data={{
                          labels: data.statusCounts.map(item => item._id.charAt(0).toUpperCase() + item._id.slice(1)),
                          datasets: [{
                            data: data.statusCounts.map(item => item.count),
                            backgroundColor: [
                              'rgba(34, 197, 94, 0.8)',
                              'rgba(239, 68, 68, 0.8)',
                              'rgba(59, 130, 246, 0.8)',
                            ],
                            borderColor: [
                              'rgb(34, 197, 94)',
                              'rgb(239, 68, 68)',
                              'rgb(59, 130, 246)',
                            ],
                            borderWidth: 2,
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom' as const,
                            },
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {data?.planCounts && data.planCounts.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Customers by Plan</h3>
                    <div className="h-64">
                      <Bar
                        data={{
                          labels: data.planCounts.map(item => item._id),
                          datasets: [{
                            label: 'Number of Customers',
                            data: data.planCounts.map(item => item.count),
                            backgroundColor: 'rgba(45, 212, 191, 0.8)',
                            borderColor: 'rgb(45, 212, 191)',
                            borderWidth: 2,
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false,
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Data Tables */}
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
            </div>
          )}

          {/* Payment Trends Report */}
          {reportType === 'payment-trends' && (
            <div className="space-y-6">
              {/* Payment Status Chart */}
              {data?.paymentsByStatus && data.paymentsByStatus.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Status Overview</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-64">
                      <Pie
                        data={{
                          labels: data.paymentsByStatus.map(item => item._id.charAt(0).toUpperCase() + item._id.slice(1)),
                          datasets: [{
                            data: data.paymentsByStatus.map(item => item.count),
                            backgroundColor: [
                              'rgba(34, 197, 94, 0.8)',
                              'rgba(251, 191, 36, 0.8)',
                              'rgba(239, 68, 68, 0.8)',
                            ],
                            borderColor: [
                              'rgb(34, 197, 94)',
                              'rgb(251, 191, 36)',
                              'rgb(239, 68, 68)',
                            ],
                            borderWidth: 2,
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom' as const,
                            },
                            title: {
                              display: true,
                              text: 'Payment Count by Status'
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="h-64">
                      <Bar
                        data={{
                          labels: data.paymentsByStatus.map(item => item._id.charAt(0).toUpperCase() + item._id.slice(1)),
                          datasets: [{
                            label: 'Amount (৳)',
                            data: data.paymentsByStatus.map(item => item.amount),
                            backgroundColor: [
                              'rgba(34, 197, 94, 0.8)',
                              'rgba(251, 191, 36, 0.8)',
                              'rgba(239, 68, 68, 0.8)',
                            ],
                            borderColor: [
                              'rgb(34, 197, 94)',
                              'rgb(251, 191, 36)',
                              'rgb(239, 68, 68)',
                            ],
                            borderWidth: 2,
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false,
                            },
                            title: {
                              display: true,
                              text: 'Amount by Status'
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                callback: function(value) {
                                  return '৳' + value.toLocaleString();
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Daily Payment Trends */}
              {data?.dailyPayments && data.dailyPayments.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Payment Trends</h3>
                  <div className="h-80">
                    <Line
                      data={{
                        labels: data.dailyPayments.map(item => 
                          new Date(item._id).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })
                        ),
                        datasets: [
                          {
                            label: 'Payment Count',
                            data: data.dailyPayments.map(item => item.count),
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            yAxisID: 'y',
                          },
                          {
                            label: 'Payment Amount (৳)',
                            data: data.dailyPayments.map(item => item.amount),
                            borderColor: 'rgb(45, 212, 191)',
                            backgroundColor: 'rgba(45, 212, 191, 0.1)',
                            yAxisID: 'y1',
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                          mode: 'index' as const,
                          intersect: false,
                        },
                        plugins: {
                          legend: {
                            position: 'top' as const,
                          },
                        },
                        scales: {
                          x: {
                            display: true,
                            title: {
                              display: true,
                              text: 'Date'
                            }
                          },
                          y: {
                            type: 'linear' as const,
                            display: true,
                            position: 'left' as const,
                            title: {
                              display: true,
                              text: 'Payment Count'
                            }
                          },
                          y1: {
                            type: 'linear' as const,
                            display: true,
                            position: 'right' as const,
                            title: {
                              display: true,
                              text: 'Amount (৳)'
                            },
                            grid: {
                              drawOnChartArea: false,
                            },
                            ticks: {
                              callback: function(value) {
                                return '৳' + value.toLocaleString();
                              }
                            }
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Payment Status Table */}
              {data?.paymentsByStatus && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Summary</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Average</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.paymentsByStatus.map((item) => (
                          <tr key={item._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                                  item._id === 'paid'
                                    ? 'bg-green-100 text-green-800'
                                    : item._id === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {item._id}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {formatCurrency(item.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(Math.round(item.amount / item.count))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
