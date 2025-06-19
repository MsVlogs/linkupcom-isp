import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import bcrypt from 'bcryptjs';
import connectDB from '../src/lib/db';
import { User } from '../src/models/User';
import { Customer } from '../src/models/Customer';
import { Payment } from '../src/models/Payment';

async function seedDatabase() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Clear existing data
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Payment.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    await User.create({
      name: 'Admin User',
      email: 'admin@linkup.com',
      password: adminPassword,
      role: 'admin',
      isActive: true,
    });
    console.log('Created admin user');

    // Create staff user
    const staffPassword = await bcrypt.hash('staff123', 12);
    const staff = await User.create({
      name: 'Staff Member',
      email: 'staff@linkup.com',
      password: staffPassword,
      role: 'staff',
      isActive: true,
    });
    console.log('Created staff user');

    // Create sample customers
    const customers = [
      {
        customerId: 'LC-001',
        name: 'Ahmed Rahman',
        address: 'House 15, Road 3, Dhanmondi, Dhaka',
        phone: '+8801711234567',
        package: 'Premium 50 Mbps',
        monthlyFee: 2500,
        area: 'Dhanmondi',
        status: 'active',
      },
      {
        customerId: 'LC-002',
        name: 'Fatima Khatun',
        address: 'Apartment 4B, Green Tower, Gulshan, Dhaka',
        phone: '+8801819876543',
        package: 'Standard 30 Mbps',
        monthlyFee: 1800,
        area: 'Gulshan',
        status: 'active',
      },
      {
        customerId: 'LC-003',
        name: 'Mohammad Ali',
        address: 'House 23, Lane 5, Uttara, Dhaka',
        phone: '+8801555123456',
        package: 'Basic 20 Mbps',
        monthlyFee: 1200,
        area: 'Uttara',
        status: 'active',
      },
      {
        customerId: 'LC-004',
        name: 'Rashida Begum',
        address: 'Flat 6A, Rose Garden, Mohammadpur, Dhaka',
        phone: '+8801677889900',
        package: 'Premium 50 Mbps',
        monthlyFee: 2500,
        area: 'Mohammadpur',
        status: 'active',
      },
      {
        customerId: 'LC-005',
        name: 'Karim Sheikh',
        address: 'House 45, Road 12, Banani, Dhaka',
        phone: '+8801933445566',
        package: 'Ultra 100 Mbps',
        monthlyFee: 4000,
        area: 'Banani',
        status: 'active',
      },
      {
        customerId: 'LC-006',
        name: 'Salma Akter',
        address: 'Apartment 2C, Sky View, Mirpur, Dhaka',
        phone: '+8801444777888',
        package: 'Standard 30 Mbps',
        monthlyFee: 1800,
        area: 'Mirpur',
        status: 'inactive',
      },
    ];

    const createdCustomers = await Customer.insertMany(customers);
    console.log('Created sample customers');

    // Create sample payments for current month
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Previous month for some payment history
    const prevMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth()).padStart(2, '0')}`;

    const payments: Array<{
      customerId: string;
      customerName: string;
      amount: number;
      status: string;
      billingMonth: string;
      dueDate: Date;
      paidAt?: Date;
      collectedBy?: string;
      collectedByName?: string;
      paymentMethod: string;
    }> = [];

    // Current month payments
    createdCustomers.forEach((customer, index) => {
      const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 7);
      
      // Mix of paid, pending, and overdue
      let status = 'pending';
      let paidAt = undefined;
      
      if (index < 2) {
        status = 'paid';
        paidAt = new Date(currentDate.getTime() - Math.random() * 10 * 24 * 60 * 60 * 1000); // Random date within last 10 days
      } else if (index === 5) {
        status = 'overdue';
        dueDate.setDate(dueDate.getDate() - 10); // Make it overdue
      }

      payments.push({
        customerId: customer.customerId,
        customerName: customer.name,
        amount: customer.monthlyFee,
        status,
        billingMonth: currentMonth,
        dueDate,
        paidAt,
        collectedBy: status === 'paid' ? staff._id : undefined,
        collectedByName: status === 'paid' ? staff.name : undefined,
        paymentMethod: 'cash',
      });
    });

    // Previous month payments (mostly paid)
    createdCustomers.slice(0, 4).forEach((customer) => {
      const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 7);
      const paidAt = new Date(currentDate.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date within last 30 days

      payments.push({
        customerId: customer.customerId,
        customerName: customer.name,
        amount: customer.monthlyFee,
        status: 'paid',
        billingMonth: prevMonth,
        dueDate,
        paidAt,
        collectedBy: staff._id,
        collectedByName: staff.name,
        paymentMethod: 'cash',
      });
    });

    await Payment.insertMany(payments);
    console.log('Created sample payments');

    console.log('\n✅ Database seeded successfully!');
    console.log('\nDemo Login Credentials:');
    console.log('Admin: admin@linkup.com / admin123');
    console.log('Staff: staff@linkup.com / staff123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
