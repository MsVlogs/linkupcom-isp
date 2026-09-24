export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  _id: string;
  customerId: string;
  name: string;
  address: string;
  phone: string;
  pppoeUsername?: string;
  onuId?: string;
  package: string;
  monthlyFee: number;
  status: 'active' | 'inactive';
  area: string;
  connectionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  _id: string;
  customerId: string;
  customerName: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  billingMonth: string;
  paidAt?: Date;
  dueDate: Date;
  collectedBy?: string;
  collectedByName?: string;
  paymentMethod: 'cash' | 'mobile_banking' | 'bank_transfer';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Log {
  _id: string;
  action: string;
  userId: string;
  userName: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  pendingPayments: number;
  overduePayments: number;
  monthlyRevenue: number;
  paidThisMonth: number;
}

export interface PaymentFormData {
  customerId: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  billingMonth: string;
  paymentMethod: 'cash' | 'mobile_banking' | 'bank_transfer';
  paymentDate: string;
  notes?: string;
}

export interface CustomerFormData {
  customerId: string;
  name: string;
  address: string;
  phone: string;
  package: string;
  monthlyFee: number;
  area: string;
  status: 'active' | 'inactive';
}

export interface StaffFormData {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'staff';
  isActive: boolean;
}

export interface StaffPerformance {
  _id: string;
  staffName: string;
  staffEmail: string;
  paymentsCollected: number;
  totalAmount: number;
}

export interface ReportsData {
  paymentOverview: {
    totalPayments: number;
    totalAmount: number;
    paidCount: number;
    pendingCount: number;
    overdueCount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
  };
  monthlyTrends: Array<{
    month: string;
    collections: number;
    amount: number;
  }>;
  staffPerformance: StaffPerformance[];
  packageDistribution: Array<{
    _id: string;
    count: number;
    totalRevenue: number;
  }>;
}
